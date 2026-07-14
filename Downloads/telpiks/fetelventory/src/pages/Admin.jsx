import React, { useState, useEffect } from "react";
import "../styles/admin.css";
import "../styles/animations.css";
import { Pencil, AlertTriangle, UserSquare2, Search, UserMinus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../services/apiClient";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

const EMPTY_FORM = {
  fullName: "",
  department: "",
  employeeId: "",
  email: "",
  role: "user",
};

export default function UserAccessManagement() {
  const { user: loggedInUser } = useAuth();
  const currentUser = loggedInUser || { name: "Guest", email: "", role: "user" };
  const isSuperuser = currentUser.role === "superuser";

  const [pendingRequests, setPendingRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingActionId, setPendingActionId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserRole, setEditingUserRole] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [{ users: approved }, { users: pending }] = await Promise.all([
        apiClient.get("/users"),
        apiClient.get("/users/pending"),
      ]);
      setUsers(approved);
      setPendingRequests(pending);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const totalAdmin = users.filter((u) => u.role === "admin" || u.role === "superuser").length;
  const pendingCount = pendingRequests.length;
  const totalRegistered = users.length + pendingRequests.length;

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleApprove(id) {
    setPendingActionId(id);
    try {
      const { user: approvedUser } = await apiClient.post(`/users/${id}/approve`);
      setUsers((prev) => [approvedUser, ...prev]);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      alert(err.message || "Failed to approve this request.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleReject(id) {
    setPendingActionId(id);
    try {
      await apiClient.post(`/users/${id}/decline`);
      setPendingRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      alert(err.message || "Failed to decline this request.");
    } finally {
      setPendingActionId(null);
    }
  }

  function requestRemoveUser(user) {
    setDeleteTarget(user);
  }

  async function confirmRemoveUser() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.del(`/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || "Failed to remove user.");
    } finally {
      setIsDeleting(false);
    }
  }

  function openEditModal(user) {
    setEditingUserId(user.id);
    setEditingUserRole(user.role);
    setForm({
      fullName: user.name,
      department: user.department || "",
      employeeId: user.employeeId || "",
      email: user.email,
      role: user.role,
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingUserId(null);
    setEditingUserRole(null);
    setForm(EMPTY_FORM);
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveChanges() {
    setIsSaving(true);
    setError("");
    try {
      const payload = {
        fullName: form.fullName,
        department: form.department,
        employeeId: form.employeeId,
        email: form.email,
      };
      // Kirim `role` cuma kalau memang berubah DAN yang login Superuser —
      // Admin biasa tidak boleh mengubah role siapa pun (backend akan
      // menolak 403 kalau tetap dikirim & berbeda dari role asli).
      if (isSuperuser && form.role !== editingUserRole) {
        payload.role = form.role;
      }

      const { user: updated } = await apiClient.put(`/users/${editingUserId}`, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      closeModal();
    } catch (err) {
      setError(err.message || "Failed to update user.");
    } finally {
      setIsSaving(false);
    }
  }

  function roleBadgeClass(role) {
    if (role === "superuser") return "uam-status-badge--superuser";
    if (role === "admin") return "uam-status-badge--admin";
    return "uam-status-badge--guest";
  }

  function roleBadgeLabel(role) {
    if (role === "superuser") return "SUPERUSER";
    if (role === "admin") return "ADMIN";
    return "USER";
  }

  // Admin (bukan Superuser) sama sekali tidak boleh menyentuh akun
  // Superuser — cocokkan dengan aturan di backend (users.py update_user /
  // delete_user), jangan cuma mengandalkan pesan error 403 dari server.
  function canEdit(targetUser) {
    if (currentUser.role === "admin" && targetUser.role === "superuser") return false;
    return true;
  }

  function canRemove(targetUser) {
    if (targetUser.id === currentUser.id) return false;
    if (targetUser.role === "superuser") return false;
    if (currentUser.role === "admin" && targetUser.role === "superuser") return false;
    return true;
  }

  return (
    <div className="uam-page">

      <header className="uam-header">
        <h1 className="uam-title">User Access Management</h1>
      </header>
      <div className="uam-header-rule" />

      <section className="uam-profile-row">
        <div className="uam-profile">
          <div className="uam-avatar">
            <svg viewBox="0 0 24 24" fill="#aaa" width="40" height="40">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <div className="uam-profile-info">
            <p className="uam-profile-name">{currentUser.name}</p>
            <p className="uam-profile-email">{currentUser.email}</p>
          </div>
        </div>
      </section>

      <section className="uam-stats-row">
        <div className="uam-stat-card uam-stat-card--admin stagger-item">
          <p className="uam-stat-label">Total Admin</p>
          <p className="uam-stat-value">{totalAdmin} User</p>
        </div>

        <div className="uam-stat-card uam-stat-card--pending stagger-item">
          <p className="uam-stat-label">Pending Requests</p>
          <p className="uam-stat-value">{pendingCount} User</p>
        </div>

        <div className="uam-stat-card uam-stat-card--registered stagger-item">
          <p className="uam-stat-label">Total Registered Users</p>
          <p className="uam-stat-value">{totalRegistered} User</p>
        </div>
      </section>

      <section className="uam-panel stagger-item">
        <h2 className="uam-panel-title">
          <AlertTriangle size={20} className="uam-icon uam-icon--warning" />
          Pending Account Request
        </h2>

        <div className="uam-table-wrap">
          <table className="uam-table">
            <thead>
              <tr>
                <th className="uam-col-no">No</th>
                <th>Name</th>
                <th>Departement</th>
                <th>Email</th>
                <th>Employe ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="uam-empty-row">
                    Loading...
                  </td>
                </tr>
              ) : pendingRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="uam-empty-row">
                    No pending requests.
                  </td>
                </tr>
              ) : (
                pendingRequests.map((req, idx) => (
                  <tr key={req.id}>
                    <td className="uam-col-no">{idx + 1}.</td>
                    <td>{req.name}</td>
                    <td>{req.department || "-"}</td>
                    <td>{req.email}</td>
                    <td>{req.employeeId || "-"}</td>
                    <td>
                      <div className="uam-action-buttons">
                        <button
                          type="button"
                          className="uam-btn uam-btn--approve"
                          onClick={() => handleApprove(req.id)}
                          disabled={pendingActionId === req.id}
                        >
                          APPROVE
                        </button>
                        <button
                          type="button"
                          className="uam-btn uam-btn--reject"
                          onClick={() => handleReject(req.id)}
                          disabled={pendingActionId === req.id}
                        >
                          REJECT
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="uam-panel stagger-item">
        <div className="uam-panel-header-row">
          <h2 className="uam-panel-title">
            <UserSquare2 size={20} className="uam-icon uam-icon--user" />
            Full Data Admin &amp; Users
          </h2>

          <div className="uam-search">
            <input
              type="text"
              placeholder="Search Name...."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} className="uam-search-icon" />
          </div>
        </div>

        <div className="uam-table-wrap">
          <table className="uam-table">
            <thead>
              <tr>
                <th className="uam-col-no">No</th>
                <th>Name</th>
                <th>Departement</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="uam-empty-row">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="uam-empty-row">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id}>
                    <td className="uam-col-no">{idx + 1}.</td>
                    <td>{user.name}</td>
                    <td>{user.department || "-"}</td>
                    <td>{user.email}</td>
                    <td>{user.employeeId || "-"}</td>
                    <td>
                      {/* Badge sekarang pakai role ASLI dari backend (Supabase),
                          bukan tebakan "admin dengan id terkecil" seperti sebelumnya. */}
                      <span className={`uam-status-badge ${roleBadgeClass(user.role)}`}>
                        {roleBadgeLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      {user.role === "superuser" ? (
                        <span className="uam-action-none">—</span>
                      ) : (
                        <div className="uam-action-buttons">
                          <button
                            type="button"
                            className="uam-icon-btn uam-icon-btn--edit"
                            onClick={() => openEditModal(user)}
                            aria-label={`Edit ${user.name}`}
                            title={!canEdit(user) ? "Admins cannot modify a Superuser account" : undefined}
                            disabled={!canEdit(user)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            className="uam-icon-btn uam-icon-btn--remove"
                            onClick={() => requestRemoveUser(user)}
                            aria-label={
                              !canRemove(user)
                                ? "This account cannot be removed"
                                : `Remove ${user.name}`
                            }
                            title={!canRemove(user) ? "This account cannot be removed" : undefined}
                            disabled={!canRemove(user)}
                          >
                            <UserMinus size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="uam-modal-overlay" onClick={closeModal}>
          <div
            className="uam-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="uam-modal-title"
          >
            <div className="uam-modal-header-row">
              <h2 id="uam-modal-title" className="uam-modal-title">
                Edit Users Credentials
              </h2>
              <button type="button" className="uam-modal-close" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="uam-modal-rule" />

            <div className="uam-modal-grid">
              <div className="uam-field">
                <label htmlFor="fullName">Full Name<span className="uam-required">*</span></label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="..."
                  value={form.fullName}
                  onChange={(e) => handleFormChange("fullName", e.target.value)}
                />
              </div>

              <div className="uam-field">
                <label htmlFor="department">Dapartement</label>
                <input
                  id="department"
                  type="text"
                  placeholder="..."
                  value={form.department}
                  onChange={(e) => handleFormChange("department", e.target.value)}
                />
              </div>

              <div className="uam-field">
                <label htmlFor="employeeId">Employe ID</label>
                <input
                  id="employeeId"
                  type="text"
                  placeholder="..."
                  value={form.employeeId}
                  onChange={(e) => handleFormChange("employeeId", e.target.value)}
                />
              </div>

              <div className="uam-field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={form.role}
                  onChange={(e) => handleFormChange("role", e.target.value)}
                  // Cuma Superuser yang boleh ubah role (backend menolak kalau
                  // bukan), dan tidak seorang pun boleh ubah role diri sendiri.
                  disabled={!isSuperuser || editingUserId === currentUser.id}
                >
                  <option value="user">User (Read-only)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
                {!isSuperuser && (
                  <span className="field-hint">Only a Superuser can change roles.</span>
                )}
                {isSuperuser && editingUserId === currentUser.id && (
                  <span className="field-hint">You cannot change your own role.</span>
                )}
              </div>

            </div>

            {error && <span className="field-error">{error}</span>}

            <div className="uam-modal-actions">
              <button type="button" className="uam-btn uam-btn--cancel" onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
              <button type="button" className="uam-btn uam-btn--save" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Remove User"
        description="Are you sure you want to remove user"
        itemLabel={deleteTarget ? `${deleteTarget.name}?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmRemoveUser}
        isDeleting={isDeleting}
      />
    </div>
  );
}

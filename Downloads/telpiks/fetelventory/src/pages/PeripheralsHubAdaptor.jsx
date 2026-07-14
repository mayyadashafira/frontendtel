import { useState, useEffect, useRef } from "react";
import { Cable as HubAdaptorIcon, Plus, Eye, Pencil, Trash2, ImagePlus } from "lucide-react";
import "../styles/hubadaptor.css";
import "../styles/dashboard.css";
import "../styles/animations.css";
import PageHeader from "../components/PageHeader";
import { apiClient } from "../services/apiClient";
import { conditionBadge } from "../utils/conditionBadge";
import { MAX_PHOTO_SIZE_BYTES, MAX_PHOTO_SIZE_MB, PHOTO_HINT_TEXT } from "../constants/upload";
import { useAuth } from "../context/AuthContext";
import CsvToolsBar from "../components/CsvToolsBar";
import NotFoundState from "../components/NotFoundState";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PhotoViewModal from "../components/PhotoViewModal";
import PhotoUploadField from "../components/PhotoUploadField";
import { hubAdaptorAssetService, HUB_ADAPTOR_STATUSES } from "../services/hubAdaptorAssetService";

const emptyForm = {
  id: null,
  condition: "Good",
  last_check_date: "",
  entity_id: "",
  serial_number: "",
  category: "Peripherals & Accessories",
  sub_category: "Hub / Adapter",
  type: "",
  action: "",
  photo: "",
};

function statusBadge(action) {
  const normalized = (action || "").trim().toUpperCase();
  if (normalized === "IN USE") return { className: "badge-good", label: "IN USE" };
  if (normalized === "IN STORE") return { className: "badge-store", label: "IN STORE" };
  if (normalized === "BROKEN") return { className: "badge-broken", label: "BROKEN" };
  return { className: "badge-null", label: "N/A" };
}

export default function PeripheralsHubAdaptor() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef(null);  const [isSaving, setIsSaving] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAssets() {
      setLoading(true);
      const data = await hubAdaptorAssetService.list();
      if (isMounted) {
        setAssets(data);
        setLoading(false);
      }
    }
    loadAssets();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = assets.filter(
    (a) =>
      (a.entity_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.serial_number || "").toLowerCase().includes(search.toLowerCase())
  );
  const hasResult = filtered.length > 0;
  const isEdit = Boolean(formData.id);
  const totalStock = filtered.length;
  const inUse = filtered.filter((a) => a.action === "IN USE").length;
  const inStore = filtered.filter((a) => a.action === "IN STORE").length;

  function openAddModal() {
    setFormData(emptyForm);
    setShowFormModal(true);
  }

  function openEdit(item) {
    setFormData({ ...item });
    setShowFormModal(true);
  }

  function closeForm() {
    setShowFormModal(false);
    setFormData(emptyForm);  }

  function handleFormChange(field, value) {
    if (field === "action") {
      const statusInfo = HUB_ADAPTOR_STATUSES.find((s) => s.value === value);
      setFormData((prev) => ({ ...prev, action: value, badge: statusInfo?.badge || "store" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!formData.entity_id || !formData.serial_number) {
      alert("Please fill all required fields");
      return;
    }
    setIsSaving(true);
    try {
      if (isEdit) {
        const updated = await hubAdaptorAssetService.update(formData.id, formData);
        setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      } else {
        const created = await hubAdaptorAssetService.create(formData);
        setAssets((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      alert(err.message || "Failed to save asset.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await hubAdaptorAssetService.remove(deleteTarget.id);
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || "Failed to delete asset.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        search={search}
        onSearchChange={setSearch}
        placeholder="Search Entity ID...."
      />

      {loading ? (
        <p className="dash-loading-text">Loading assets...</p>
      ) : hasResult ? (
        <>
          <div className="hba-topbar">
            <h1 className="hba-title">HUB/
            <br/>Adaptor</h1>

            <div className="hba-topbar-right">
              <div className="hba-summary-card hba-summary-yellow stagger-item">
                <span className="hba-summary-label">Total Stock</span>
                <span className="hba-summary-value">{totalStock} Unit</span>
              </div>
              <div className="hba-summary-card hba-summary-green stagger-item">
                <span className="hba-summary-label">In Use</span>
                <span className="hba-summary-value">{inUse} Unit</span>
              </div>
              <div className="hba-summary-card hba-summary-blue stagger-item">
                <span className="hba-summary-label">In Store</span>
                <span className="hba-summary-value">{inStore} Unit</span>
              </div>

              {isAdmin && (
                <button className="btn-add-dashboard" onClick={openAddModal}>
                  <Plus size={18} />
                  Add Asset
                </button>
              )}
              <CsvToolsBar
                isAdmin={isAdmin}
                exportFileName="hubAdaptorAssets"
                data={assets}
                onImport={async (rows) => {
                  const created = await hubAdaptorAssetService.bulkImport(rows);
                  setAssets((prev) => [...prev, ...created]);
                }}
              />
            </div>
          </div>

          <section className="hba-section stagger-item">
            <h2 className="hba-section-title">
              <HubAdaptorIcon size={22} />
              Master Tabel Data Hub/Adaptor
            </h2>

            <div className="hba-table-wrapper">
              <table className="hba-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Entity ID</th>
                    <th>Serial Number</th>
                    <th>Type</th>
                    <th>Condition</th>
                    <th>Last Check</th>
                    <th>Status</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}.</td>
                      <td>{a.entity_id}</td>
                      <td>{a.serial_number}</td>
                      <td>{a.type || "-"}</td>
                      <td>
                        <span className={conditionBadge(a.condition).className}>
                          {conditionBadge(a.condition).label}
                        </span>
                      </td>
                      <td>{a.last_check_date || "-"}</td>
                      <td>
                        <span className={statusBadge(a.action).className}>
                          {statusBadge(a.action).label}
                        </span>
                      </td>
                      {isAdmin && (
                      <td>
                        <div className="hba-action-group">
                          <button className="btn-view" onClick={() => setViewTarget(a)}>
                            <Eye size={16} />
                          </button>
                          <button className="btn-edit" onClick={() => openEdit(a)}>
                            <Pencil size={16} />
                          </button>
                          <button className="btn-delete" onClick={() => setDeleteTarget(a)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <NotFoundState />
      )}

      {showFormModal && (
        <div className="dash-modal-overlay" onClick={closeForm}>
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2 className="dash-modal-title">{isEdit ? "Edit Asset" : "Add Asset"}</h2>
              <button className="dash-modal-close" onClick={closeForm}>
                ×
              </button>
            </div>

            <div className="dash-modal-body">
              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Entity ID <span className="required-asterisk">*</span></label>
                  <input
                    placeholder="..."
                    value={formData.entity_id}
                    onChange={(e) => handleFormChange("entity_id", e.target.value)}
                  />
                </div>

                <div className="dash-form-group">
                  <label>Serial Number <span className="required-asterisk">*</span></label>
                  <input
                    placeholder="..."
                    value={formData.serial_number}
                    onChange={(e) => handleFormChange("serial_number", e.target.value)}
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Category</label>
                  <input value={formData.category} readOnly />
                </div>

                <div className="dash-form-group">
                  <label>Type</label>
                  <input
                    placeholder="..."
                    value={formData.type}
                    onChange={(e) => handleFormChange("type", e.target.value)}
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Sub Category</label>
                  <input value={formData.sub_category} readOnly />
                </div>

                <div className="dash-form-group">
                  <label>Status</label>
                  <select
                    value={formData.action}
                    onChange={(e) => handleFormChange("action", e.target.value)}
                  >
                    <option value="IN USE">IN USE</option>
                    <option value="IN STORE">IN STORE</option>
                    <option value="BROKEN">BROKEN</option>
                    <option value="">-- Select --</option>
                  </select>
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      handleFormChange("condition", e.target.value)
                    }
                  >
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Bad">Bad</option>
                    <option value="Very Bad">Very Bad</option>
                  </select>
                </div>

                <div className="dash-form-group">
                  <label>Last Check Date</label>
                  <input
                    type="date"
                    value={formData.last_check_date}
                    onChange={(e) =>
                      handleFormChange("last_check_date", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group full photo-upload-field">
                  <label>Photo</label>
                  <label className="photo-upload-box">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) {
                          alert("Please select an image file.");
                          return;
                        }
                        if (file.size > MAX_PHOTO_SIZE_BYTES) {
                          alert(`Image is too large. Max size is ${MAX_PHOTO_SIZE_MB}MB.`);
                          return;
                        }
                        try {
                          const { url } = await apiClient.uploadFile("/assets/upload-photo", file);
                          handleFormChange("photo", url);
                        } catch (err) {
                          alert(err.message || "Failed to upload photo.");
                        }
                      }}
                    />
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="photo-upload-preview" />
                    ) : (
                      <div className="photo-upload-placeholder">
                        <ImagePlus size={22} />
                        <span>Click to upload</span>
                      </div>
                    )}
                  </label>
                <span className="photo-hint">{PHOTO_HINT_TEXT}</span>
                </div>
              </div>
            </div>

            <div className="dash-modal-footer">
              <button className="dash-btn-cancel" onClick={closeForm} disabled={isSaving}>
                Cancel
              </button>
              <button className="dash-btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PhotoViewModal
        open={!!viewTarget}
        title="Hub/Adaptor Photo"
        photo={viewTarget?.photo}
        label={viewTarget?.entity_id}
        onClose={() => setViewTarget(null)}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete Hub/Adaptor Asset"
        description="Are you sure you want to delete asset"
        itemLabel={deleteTarget ? `${deleteTarget.entity_id}?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

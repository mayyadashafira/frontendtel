import { Plus, Eye, Pencil, Trash2, Database, ChevronDown, ImagePlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import "../styles/ssd.css";
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
import { ssdAssetService, SSD_YEARS, SSD_STATUSES } from "../services/ssdAssetService";

const yearFilters = ["All Years", ...SSD_YEARS];
const emptyForm = {
  id: null,
  condition: "Good",
  last_check_date: "",
  entity_id: "",
  year: "",
  category: "Storage Management",
  sub_category: "SSD",
  serial_number: "",
  assign_to: "",
  dept: "",
  pc_name: "",
  type: "",
  capacity: "",
  action: "",
  photo: "",
};

function statusBadge(action) {
  const normalized = (action || "").trim().toUpperCase();
  if (normalized === "IN USE") return { className: "badge-use", label: "IN USE" };
  if (normalized === "IN STORE") return { className: "badge-store", label: "IN STORE" };
  if (normalized === "BROKEN") return { className: "badge-broken", label: "BROKEN" };
  return { className: "badge-na", label: "N/A" };
}

export default function StorageSSD() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Years");
  const [showStatusDrop, setShowStatusDrop] = useState(false);
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
      const data = await ssdAssetService.list();
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

  const filtered = assets.filter((item) => {
    const matchSearch =
      (item.entity_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.serial_number || "").toLowerCase().includes(search.toLowerCase());
    const matchYear = statusFilter === "All Years" || item.year === statusFilter;
    return matchSearch && matchYear;
  });
  const hasResult = filtered.length > 0;

  const summary = [
    { label: "Total Stock", value: filtered.length, color: "#C837FF" },
    {
      label: "In Use",
      value: filtered.filter((i) => i.action === "IN USE").length,
      color: "#43C943",
    },
    {
      label: "In Store",
      value: filtered.filter((i) => i.action === "IN STORE").length,
      color: "#42A5F5",
    },
  ];

  function openAddModal() {
    setFormData(emptyForm);
    setShowFormModal(true);
  }

  function openEditModal(asset) {
    setFormData(asset);
    setShowFormModal(true);
  }

  function handleFormChange(field, value) {
    if (field === "action") {
      const statusInfo = SSD_STATUSES.find((s) => s.value === value);
      setFormData((prev) => ({ ...prev, action: value, badge: statusInfo?.badge || "store" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function saveAsset() {
    if (!formData.entity_id.trim() || !formData.serial_number.trim()) {
      alert("Please fill all required fields");
      return;
    }
    setIsSaving(true);
    try {
      if (formData.id) {
        const updated = await ssdAssetService.update(formData.id, formData);
        setAssets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await ssdAssetService.create(formData);
        setAssets((prev) => [...prev, created]);
      }
      setShowFormModal(false);
    } catch (err) {
      alert(err.message || "Failed to save asset.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await ssdAssetService.remove(deleteTarget.id);
      setAssets((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || "Failed to delete asset.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <PageHeader search={search} onSearchChange={setSearch} placeholder="Search Entity ID or Serial Number..." />

      {loading ? (
        <p className="dash-loading-text">Loading assets...</p>
      ) : hasResult ? (
        <>
          <div className="dashboard-top">
            <h1 className="ssd-title">Solid State
            <br/>Drive (SSD)</h1>

            <div className="ssd-summary-grid">
              {summary.map((item) => (
                <div key={item.label} className="ssd-summary-card stagger-item">
                  <div className="ssd-summary-bar" style={{ background: item.color }} />
                  <p className="ssd-summary-label">{item.label}</p>
                  <p className="ssd-summary-value">{item.value} Unit</p>
                </div>
              ))}
            </div>

            <div className="ssd-header-actions">
              <div className="ssd-filter-wrap">
                <button
                  className="ssd-filter-btn"
                  onClick={() => setShowStatusDrop(!showStatusDrop)}
                >
                  {statusFilter}
                  <ChevronDown size={16} />
                </button>

                {showStatusDrop && (
                  <div className="ssd-filter-drop">
                    {yearFilters.map((yr) => (
                      <div
                        key={yr}
                        className={`ssd-filter-option ${statusFilter === yr ? "active" : ""}`}
                        onClick={() => {
                          setStatusFilter(yr);
                          setShowStatusDrop(false);
                        }}
                      >
                        {yr}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {isAdmin && (
                <button className="btn-add-dashboard" onClick={openAddModal}>
                  <Plus size={18} />
                  Add Asset
                </button>
              )}
              <CsvToolsBar
                isAdmin={isAdmin}
                exportFileName="ssdAssets"
                data={assets}
                onImport={async (rows) => {
                  const created = await ssdAssetService.bulkImport(rows);
                  setAssets((prev) => [...prev, ...created]);
                }}
              />
            </div>
          </div>

          <section className="ssd-section stagger-item">
            <h2 className="ssd-section-title">
              <Database size={22} />
              Master Table Data SSD
            </h2>
            <div className="ssd-table-wrapper">
              <table className="ssd-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Entity ID</th>
                    <th>Serial Number</th>
                    <th>Assign To</th>
                    <th>Dept</th>
                    <th>PC Name</th>
                    <th>Type & Capacity</th>
                    <th>Condition</th>
                    <th>Last Check</th>
                    <th>Status</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={item.id}>
                      <td>{i + 1}</td>
                      <td>{item.entity_id}</td>
                      <td>{item.serial_number}</td>
                      <td>{item.assign_to}</td>
                      <td>{item.dept}</td>
                      <td>{item.pc_name}</td>
                      <td>{item.type}</td>
                      <td>
                        <span className={conditionBadge(item.condition).className}>
                          {conditionBadge(item.condition).label}
                        </span>
                      </td>
                      <td>{item.last_check_date || "-"}</td>
                      <td>
                        <span className={statusBadge(item.action).className}>
                          {statusBadge(item.action).label}
                        </span>
                      </td>
                      {isAdmin && (
                      <td>
                        <div className="ssd-action-group">
                          <button className="btn-view" onClick={() => setViewTarget(item)}>
                            <Eye size={18} />
                          </button>
                          <button className="btn-edit" onClick={() => openEditModal(item)}>
                            <Pencil size={18} />
                          </button>
                          <button className="btn-delete" onClick={() => setDeleteTarget(item)}>
                            <Trash2 size={18} />
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
        <div
          className="dash-modal-overlay"
          onClick={() => {
            setShowFormModal(false);
            setFormData(emptyForm);          }}
        >
          <div className="dash-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-header">
              <h2 className="dash-modal-title">Add New Asset</h2>
              <button
                className="dash-modal-close"
                onClick={() => {
                  setShowFormModal(false);
                  setFormData(emptyForm);                }}
              >
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
                    onChange={(e) =>
                      handleFormChange("entity_id", e.target.value)
                    }
                  />
                </div>

                <div className="dash-form-group">
                  <label>Purchase Year</label>
                  <input
                    placeholder="..."
                    value={formData.year}
                    onChange={(e) =>
                      handleFormChange("year", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Category</label>
                  <input
                    value={formData.category}
                    readOnly
                  />
                </div>

                <div className="dash-form-group">
                  <label>Serial Number <span className="required-asterisk">*</span></label>
                  <input
                    placeholder="..."
                    value={formData.serial_number}
                    onChange={(e) =>
                      handleFormChange("serial_number", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Sub Category</label>
                  <input
                    value={formData.sub_category}
                    readOnly
                  />
                </div>

                <div className="dash-form-group">
                  <label>Assign To</label>
                  <input
                    placeholder="..."
                    value={formData.assign_to}
                    onChange={(e) =>
                      handleFormChange("assign_to", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>Status</label>
                  <select
                    value={formData.action}
                    onChange={(e) =>
                      handleFormChange("action", e.target.value)
                    }
                  >
                    <option value="IN USE">In Use</option>
                    <option value="IN STORE">In Store</option>
                    <option value="BROKEN">Broken</option>
                    <option value="">-- Select --</option>
                  </select>
                </div>

                <div className="dash-form-group">
                  <label>Department</label>
                  <input
                    placeholder="..."
                    value={formData.dept}
                    onChange={(e) =>
                      handleFormChange("dept", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label>PC Name</label>
                  <input
                    placeholder="..."
                    value={formData.pc_name}
                    onChange={(e) =>
                      handleFormChange("pc_name", e.target.value)
                    }
                  />
                </div>

                <div className="dash-form-group">
                  <label>Type</label>
                  <input
                    placeholder="..."
                    value={formData.type}
                    onChange={(e) =>
                      handleFormChange("type", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group full">
                  <label>Capacity</label>
                  <input
                    placeholder="..."
                    value={formData.capacity}
                    onChange={(e) =>
                      handleFormChange("capacity", e.target.value)
                    }
                  />
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
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="photo-upload-preview"
                      />
                    ) : (
                      <div className="photo-upload-placeholder">
                        < ImagePlus size={22} />
                        <span>Click to upload</span>
                      </div>
                    )}
                  </label>
                <span className="photo-hint">{PHOTO_HINT_TEXT}</span>
                </div>
              </div>

            </div>

            <div className="dash-modal-footer">
              <button
                className="dash-btn-cancel"
                onClick={() => {
                  setShowFormModal(false);
                  setFormData(emptyForm);                }}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="dash-btn-save"
                onClick={saveAsset}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PhotoViewModal
        open={!!viewTarget}
        title="SSD Photo"
        photo={viewTarget?.photo}
        label={viewTarget?.entity_id}
        onClose={() => setViewTarget(null)}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete SSD Asset"
        description="Are you sure you want to delete asset"
        itemLabel={deleteTarget ? `${deleteTarget.entity_id}?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

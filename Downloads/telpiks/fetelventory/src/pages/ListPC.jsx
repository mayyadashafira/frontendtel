import { useState, useEffect, useRef } from "react";
import "../styles/listpc.css";
import "../styles/dashboard.css"; 
import "../styles/animations.css";
import { Eye, Pencil, Trash2, Plus, Database, ChevronDown, ImagePlus } from "lucide-react";
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
import { pcAssetService, PC_CONDITIONS, PC_LOCATIONS } from "../services/pcAssetService";
import { CATEGORY_OPTIONS } from "../constants/resourceCategories";

const locationFilters = [
  { label: "All Location", value: "all" },
  ...PC_LOCATIONS.map((loc) => ({ label: loc, value: loc })),
];

const emptyForm = {
  id: null,
  entity_id: "",
  last_check_date: "",
  category: "List PC & Workstation",
  sub_category: "PC",
  location: "",
  device_type: "",
  condition: "Good",
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

export default function ListPC() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [showLocationDrop, setShowLocationDrop] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef(null);  const [isSaving, setIsSaving] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const subCategoryOptions =
    CATEGORY_OPTIONS[formData.category] || [];

  useEffect(() => {
    let isMounted = true;
    async function loadAssets() {
      setLoading(true);
      const data = await pcAssetService.list();
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

  const filteredAssets = assets.filter((asset) => {
    const matchSearch = (asset.entity_id || "").toLowerCase().includes(search.toLowerCase());
    const matchLocation = location === "all" || asset.location === location;
    return matchSearch && matchLocation;
  });
  const hasResult = filteredAssets.length > 0;
  const summary =
    location === "Workshop" || location.startsWith("Room")
      ? [
          { label: "Total Device", value: filteredAssets.length, color: "#2196f3" },
          {
            label: "Good Condition",
            value: filteredAssets.filter((a) => a.condition === "Good" || a.condition === "Very Good").length,
            color: "#4caf50",
          },
          {
            label: "Bad Condition",
            value: filteredAssets.filter((a) => a.condition === "Bad" || a.condition === "Very Bad").length,
            color: "#e53935",
          },
        ]
      : [
          {
            label: "In Use",
            value: filteredAssets.filter((a) => a.action === "IN USE").length,
            color: "#2196f3",
          },
          { label: "Total", value: filteredAssets.length, color: "#4caf50" },
          {
            label: "In Store",
            value: filteredAssets.filter((a) => a.action === "IN STORE").length,
            color: "#e53935",
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function saveAsset() {
    if (!formData.entity_id.trim() || !formData.device_type.trim()) {
      alert("Please fill all required fields");
      return;
    }
    setIsSaving(true);
    try {
      if (formData.id) {
        const updated = await pcAssetService.update(formData.id, formData);
        setAssets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await pcAssetService.create(formData);
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
      await pcAssetService.remove(deleteTarget.id);
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
      <PageHeader search={search} onSearchChange={setSearch} placeholder="Search Entity ID..." />

      {loading ? (
        <p className="dash-loading-text">Loading assets...</p>
      ) : hasResult ? (
        <>
          <div className="listpc-top">
            <div className="listpc-heading">
              <h1 className="listpc-title">
                List PC & <br />
                Workstation
              </h1>
            </div>

            <div className="listpc-summary-grid">
              {summary.map((item) => (
                <div className="listpc-summary-card stagger-item" key={item.label}>
                  <div className="listpc-summary-bar" style={{ background: item.color }} />
                  <div className="listpc-summary-header">
                    <p className="listpc-summary-label">{item.label}</p>
                  </div>
                  <p className="listpc-summary-value">{item.value} Unit</p>
                </div>
              ))}
            </div>

            <div className="listpc-actions">
              <div className="listpc-location-wrap">
                <button
                  className="listpc-location-btn"
                  onClick={() => setShowLocationDrop(!showLocationDrop)}
                >
                  {locationFilters.find((x) => x.value === location)?.label}
                  <ChevronDown size={16} />
                </button>

                {showLocationDrop && (
                  <div className="listpc-location-drop">
                    {locationFilters.map((item) => (
                      <div
                        key={item.value}
                        className={`listpc-location-option ${
                          location === item.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setLocation(item.value);
                          setShowLocationDrop(false);
                        }}
                      >
                        {item.label}
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
                exportFileName="pcAssets"
                data={filteredAssets}
                onImport={async (rows) => {
                  const created = await pcAssetService.bulkImport(rows);
                  setAssets((prev) => [...prev, ...created]);
                }}
              />
            </div>
          </div>

          <section className="section stagger-item">
            <div className="table-header">
              <h2 className="section-title">
                <Database size={22} />
                Master Table Data
              </h2>
            </div>
            <table className="asset-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Entity ID</th>
                  <th>Device Type</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th>Last Check Date</th>
                  <th>Status</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, index) => (
                  <tr key={asset.id}>
                    <td>{index + 1}</td>
                    <td>{asset.entity_id}</td>
                    <td>{asset.device_type}</td>
                    <td>
                      <span className={conditionBadge(asset.condition).className}>
                        {asset.condition}
                      </span>
                    </td>
                    <td>{asset.location}</td>
                    <td>{asset.last_check_date}</td>
                    <td>
                      <span className={statusBadge(asset.action).className}>
                        {statusBadge(asset.action).label}
                      </span>
                    </td>
                    {isAdmin && (
                    <td>
                      <div className="action-group">
                        <button className="btn-view" onClick={() => setViewTarget(asset)} title="View">
                          <Eye size={18} />
                        </button>
                        <button className="btn-edit" onClick={() => openEditModal(asset)} title="Edit">
                          <Pencil size={18} />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setDeleteTarget(asset)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
              <h2 className="dash-modal-title">Add Asset</h2>
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
                <div className="dash-form-group">
                  <label>Category</label>
                  <input
                    value={formData.category}
                    readOnly 
                  />
                </div>

                <div className="dash-form-group">
                  <label>Device Type <span className="required-asterisk">*</span></label>
                  <input
                    placeholder="..."
                    value={formData.device_type}
                    onChange={(e)=>
                      handleFormChange("device_type", e.target.value)
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
                  <label>Location</label>
                  <input
                    placeholder="..."
                    value={formData.location}
                    onChange={(e)=>
                      handleFormChange("location", e.target.value)
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
        title="Asset Photo"
        photo={viewTarget?.photo}
        label={viewTarget?.entity_id}
        onClose={() => setViewTarget(null)}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete Asset"
        description="Are you sure you want to delete asset"
        itemLabel={deleteTarget ? `${deleteTarget.entity_id}?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

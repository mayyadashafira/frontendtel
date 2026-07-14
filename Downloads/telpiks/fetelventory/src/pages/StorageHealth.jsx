import { Activity, Plus, Eye, Pencil, Trash2, ChevronDown, ImagePlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import "../styles/health.css";
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
import {
  healthReportService,
  HEALTH_MONTHS,
  HEALTH_STATUSES,
} from "../services/healthReportService";

const emptyForm = {
  id: null,
  last_check_date: "",
  category: "Storage Management",
  sub_category: "HDD",
  sub_sub: "HDD Health",
  dept: "",
  type: "",
  device_type: "",
  entity_id: "",
  health: "",
  employed_name: "",
  condition: "Good",
  photo: "",
};

export default function StorageHealth() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("All Month");
  const [showMonthDrop, setShowMonthDrop] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const fileInputRef = useRef(null);  const [isSaving, setIsSaving] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      setLoading(true);
      const data = await healthReportService.list();
      if (isMounted) {
        setReports(data);
        setLoading(false);
      }
    }
    loadReports();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = reports.filter((item) => {
    const matchSearch =
      (item.entity_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.employed_name || "").toLowerCase().includes(search.toLowerCase());
    const itemMonth = item.last_check_date
      ? new Date(item.last_check_date).toLocaleString("en-US", { month: "long" })
      : "";
    const matchMonth = month === "All Month" || itemMonth === month;
    return matchSearch && matchMonth;
  });
  const hasResult = filtered.length > 0;

  const summary = [
    {
      label: "Good",
      value: filtered.filter((i) => i.condition === "Very Good" || i.condition === "Good").length,
      color: "#1e88e5",
    },
    {
      label: "Bad",
      value: filtered.filter((i) => i.condition === "Bad").length,
      color: "#ffa000",
    },
    {
      label: "Very Bad",
      value: filtered.filter((i) => i.condition === "Very Bad").length,
      color: "#e53935",
    },
  ];

  function openAddModal() {
    setFormData(emptyForm);
    setShowFormModal(true);
  }

  function openEditModal(report) {
    setFormData(report);
    setShowFormModal(true);
  }

  function handleFormChange(field, value) {
    if (field === "condition") {
      const statusInfo = HEALTH_STATUSES.find((s) => s.value === value);
      setFormData((prev) => ({ ...prev, condition: value, badge: statusInfo?.badge || "na" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function saveReport() {
    if (!formData.employed_name.trim() || !formData.entity_id.trim()) {
      alert("Please fill all required fields");
      return;
    }
    setIsSaving(true);
    try {
      if (formData.id) {
        const updated = await healthReportService.update(formData.id, formData);
        setReports((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await healthReportService.create(formData);
        setReports((prev) => [...prev, created]);
      }
      setShowFormModal(false);
    } catch (err) {
      alert(err.message || "Failed to save report.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await healthReportService.remove(deleteTarget.id);
      setReports((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || "Failed to delete report.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <PageHeader search={search} onSearchChange={setSearch} placeholder="Search Employee..." />

      {loading ? (
        <p className="dash-loading-text">Loading reports...</p>
      ) : hasResult ? (
        <>
          <div className="dashboard-top">
            <h1 className="health-title">Hard Disk
            <br/>Drive (HDD)
            <br/>Health</h1>

            <div className="health-summary-grid">
              {summary.map((item) => (
                <div key={item.label} className="health-summary-card stagger-item">
                  <div className="health-summary-bar" style={{ background: item.color }} />
                  <p className="health-summary-label">{item.label}</p>
                  <p className="health-summary-value">{item.value} Unit</p>
                </div>
              ))}
            </div>

            <div className="health-header-actions">
              <div className="health-filter-wrap">
                <button
                  className="health-filter-btn"
                  onClick={() => setShowMonthDrop(!showMonthDrop)}
                >
                  {month}
                  <ChevronDown size={16} />
                </button>

                {showMonthDrop && (
                  <div className="health-filter-drop">
                    {HEALTH_MONTHS.map((item) => (
                      <div
                        key={item}
                        className={`health-filter-option ${month === item ? "active" : ""}`}
                        onClick={() => {
                          setMonth(item);
                          setShowMonthDrop(false);
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isAdmin && (
                <button className="btn-add-dashboard" onClick={openAddModal}>
                  <Plus size={18} />
                  Add Report
                </button>
              )}
              <CsvToolsBar
                isAdmin={isAdmin}
                exportFileName="healthReports"
                data={reports}
                onImport={async (rows) => {
                  const created = await healthReportService.bulkImport(rows);
                  setReports((prev) => [...prev, ...created]);
                }}
              />
            </div>
          </div>

          <section className="health-section stagger-item">
            <h2 className="health-section-title">
              <Activity size={22} />
              Master Table Data HDD Health
            </h2>
            <div className="health-table-wrapper">
              <table className="health-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Employee</th>
                    <th>Dept</th>
                    <th>Last Check Date</th>
                    <th>Device ID</th>
                    <th>Device Type</th>
                    <th>Health</th>
                    <th>Type</th>
                    <th>Condition</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.employed_name}</td>
                      <td>{item.dept}</td>
                      <td>{item.pmDate}</td>
                      <td>{item.entity_id}</td>
                      <td>{item.device_type}</td>
                      <td>{item.health}</td>
                      <td>{item.type}</td>
                      <td>
                        <span className={conditionBadge(item.condition).className}>
                          {conditionBadge(item.condition).label}
                        </span>
                      </td>
                      {isAdmin && (
                      <td>
                        <div className="health-action-group">
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
                  <label>Employe Name <span className="required-asterisk">*</span></label>
                  <input
                    placeholder="..."
                    value={formData.employed_name}
                    onChange={(e) =>
                      handleFormChange("employed_name", e.target.value)
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
                  <label>Device ID <span className="required-asterisk">*</span></label>
                  <input
                    placeholder="..."
                    value={formData.entity_id}
                    onChange={(e)=>
                      handleFormChange("entity_id", e.target.value)
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
                  <label>Device Type</label>
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
                  <label>Department</label>
                  <input
                    placeholder="..."
                    value={formData.dept}
                    onChange={(e) =>
                      handleFormChange("dept", e.target.value)
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
                <div className="dash-form-group">
                  <label>Health (%)</label>
                  <input
                    placeholder="..."
                    value={formData.health}
                    onChange={(e) =>
                      handleFormChange("health", e.target.value)
                    }
                  />
                </div>

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
                onClick={saveReport}
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
        title="Device Photo"
        photo={viewTarget?.photo}
        label={viewTarget?.entity_id}
        onClose={() => setViewTarget(null)}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        title="Delete Health Report"
        description="Are you sure you want to delete report for"
        itemLabel={deleteTarget ? `${deleteTarget.entity_id}?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

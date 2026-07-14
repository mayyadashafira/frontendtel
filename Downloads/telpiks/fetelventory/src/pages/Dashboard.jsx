import { useState, useEffect } from "react";
import "../styles/dashboard.css";
import {
  BarChart3,
  ClipboardList,
  TriangleAlert,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import NotFoundState from "../components/NotFoundState";
import { dashboardService } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";

const getBarColor = (pct) => {
  if (pct <= 30) return "#FF0000";
  if (pct <= 60) return "#FFEA00";
  return "#32CD32"; 
};

function formatTimeAgo(time) {
  const seconds = Math.floor((Date.now() - time) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [summaryCards, setSummaryCards] = useState([]);
  const [bars, setBars] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState(null);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      const [summary, categoryBars, activityList, lowStockList] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getCategoryBars(),
        dashboardService.getActivities(),
        dashboardService.getLowStock(),
      ]);

      if (!isMounted) return;
      setSummaryCards(summary);
      setBars(categoryBars);
      setActivities(activityList);
      setLowStock(lowStockList);
      setLoading(false);
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const keyword = search.trim().toLowerCase();
  const filteredActivities = activities.filter((item) => {
    const searchTarget = `
      ${item.title}
      ${item.description}
      ${item.user}
      ${item.type}
    `.toLowerCase();

    return searchTarget.includes(keyword);
  });
  const filteredLowStock = lowStock.filter((item) =>
    item.name.toLowerCase().includes(keyword)
  );
  const filteredBars = bars.filter((item) =>
    item.label.toLowerCase().includes(keyword)
  );

  const hasResult =
    filteredBars.length > 0 ||
    filteredActivities.length > 0 ||
    filteredLowStock.length > 0;

  const exportMenus = [
    { id: "all", label: "All Assets" },
    { id: "pc", label: "PC & Workstation" },
    { id: "storage", label: "Storage Management" },
    { id: "hardware", label: "Hardware & Components" },
    { id: "peripherals", label: "Peripherals & Accessories" },
    { id: "network", label: "Network Infrastructure" },
    { id: "devices", label: "Devices & Office Output" },
  ];

  function openHistory(type) {
    setHistoryModal(type);
  }

  function closeHistory() {
    setHistoryModal(null);
  }

  async function handleExport(category) {
    try {
      await dashboardService.exportReport(category);
      setShowExportMenu(false);
    } catch (err) {
      alert(err.message || "Failed to export report.");
    }
  }

  async function handleDownloadReport() {
    setIsDownloadingReport(true);
    try {
      await dashboardService.downloadReport();
      setShowExportMenu(false);
    } catch (err) {
      alert(err.message || "Failed to download PDF report.");
    } finally {
      setIsDownloadingReport(false);
    }
  }

  return (
    <>
      <PageHeader search={search} onSearchChange={setSearch} />

      {loading ? (
        <p className="dash-loading-text">Loading dashboard...</p>
      ) : hasResult ? (
        <>
          <div className="dashboard-top">
            <div className="dashboard-title">
              <h1 className="dash-title">Dashboard</h1>
            </div>
            <div className="dashboardsummary-grid">
              {summaryCards.map((c) => (
                <div key={c.label} className="dashboardsummary-card stagger-item">
                  <div className="dashboardsummary-bar" style={{ background: c.color }} />
                  <p className="dashboardsummary-label">{c.label}</p>
                  <p className="dashboardsummary-value">{c.value}</p>
                </div>
              ))}
            </div>
            <div className="dashboard-actions">
            <button
              className="btn-add-dashboard"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download size={18}/>
              Export Data
            </button>
            {showExportMenu && (
              <div className="export-dropdown" >
              <button
                className="export-dropdown-item"
                onClick={() => handleDownloadReport()}
                disabled={isDownloadingReport}
              >
                <FileText size={16} />
                <span>{isDownloadingReport ? "Preparing PDF..." : "Unduh Laporan (PDF)"}</span>
              </button>
              {exportMenus.map((menu) => (
                <button
                  key={menu.id}
                  className="export-dropdown-item"
                  onClick={() => handleExport(menu.id)}
                >
                  <FileSpreadsheet size={16} />
                  <span>{menu.label} (CSV)</span>
                </button>
              ))}
              </div>
            )}
          </div>
        </div>

          <section className="section viz-section stagger-item">
            <h2 className="section-title">
              <BarChart3 size={22} />
              Visualisation Quick Summary
            </h2>
            <div className="bar-list">
              {filteredBars.map((b) => (
                <div key={b.label} className="bar-row">
                  <p className="bar-label">{b.label}</p>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${b.pct}%`, background: getBarColor(b.pct) }}
                    />
                  </div>
                  <span className="bar-pct" style={{ color: getBarColor(b.pct) }}>
                    {b.pct}%
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="bottom-grid">
            <section className="section activities-section stagger-item">
              <h2 className="section-title">
                <ClipboardList size={22} />
                Recent Activities
              </h2>
              <div style={{ marginBottom: 18 }}>
                <button
                  className="activity-badge"
                  style={{
                    background: "#24437C",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => openHistory("all")}
                >
                  All
                </button>
              </div>
              <div className="activity-list">
                {filteredActivities.slice(0, 3).map((a, i, arr) => (
                  <div key={a.id ?? i} className="activity-item">
                    <button
                      className="activity-badge"
                      style={{
                        background: a.color,
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => openHistory(a.type.toLowerCase())}
                    >
                      {a.type}
                    </button>
                    <div className="activity-content">
                      <p className="activity-title">
                        {a.title}
                      </p>
                      <p className="activity-description">
                        {a.description}
                      </p>
                      <small className="activity-meta">
                        {a.user} • {formatTimeAgo(a.createdAt)}
                      </small>
                    </div>
                    {i < arr.length - 1 && <hr className="activity-divider" />}
                  </div>
                ))}
              </div>
            </section>

            <section className="section lowstock-section stagger-item">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                  <TriangleAlert size={22} />
                  Low Stock Alert
                </h2>
                <button
                  className="activity-badge"
                  style={{ background: "#24437C", border: "none", cursor: "pointer" }}
                  onClick={() => setShowLowStockModal(true)}
                >
                  All
                </button>
              </div>
              <ol className="lowstock-list">
                {filteredLowStock.slice(0, 3).map((item) => (
                  <li key={item.id} className="lowstock-item">
                    <div className="lowstock-info">
                      <span className="lowstock-name">{item.name}</span>
                      <span className="lowstock-sisa">Sisa: {item.sisa}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </>
      ) : (
        <NotFoundState />
      )}

      {historyModal && (
        <div
          className="dash-modal-overlay"
          onClick={closeHistory}
        >
          <div
            className="dash-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "750px",
            }}
          >
            <div className="dash-modal-header">
              <h2 className="dash-modal-title">
                {historyModal === "all"
                  ? "Activity History"
                  : `${historyModal.charAt(0).toUpperCase() + historyModal.slice(1)} History`}
              </h2>
              <button
                className="dash-modal-close"
                onClick={closeHistory}
              >
                ×
              </button>
            </div>
            <div className="dash-modal-body">
              {activities
                .filter(
                  (item) =>
                    historyModal === "all" ||
                    item.type.toLowerCase() === historyModal
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className="activity-item"
                  >
                    <span
                      className="activity-badge"
                      style={{
                        background: item.color,
                      }}
                    >
                      {item.type}
                    </span>
                    <div className="activity-content">
                      <p className="activity-title">
                        {item.title}
                      </p>
                      <p className="activity-description">
                        {item.description}
                      </p>
                      <small className="activity-meta">
                        {item.user} • {formatTimeAgo(item.createdAt)}
                      </small>
                    </div>
                    <hr className="activity-divider" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {showLowStockModal && (
        <div className="dash-modal-overlay" onClick={() => setShowLowStockModal(false)}>
          <div
            className="dash-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="dash-modal-header">
              <h2 className="dash-modal-title">Low Stock Alert — All Items</h2>
              <button className="dash-modal-close" onClick={() => setShowLowStockModal(false)}>
                ×
              </button>
            </div>
            <div className="dash-modal-body">
              {lowStock.length === 0 ? (
                <p>No low stock items.</p>
              ) : (
                <ol className="lowstock-list">
                  {lowStock.map((item) => (
                    <li key={item.id} className="lowstock-item">
                      <div className="lowstock-info">
                        <span className="lowstock-name">{item.name}</span>
                        <span className="lowstock-sisa">Sisa: {item.sisa}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

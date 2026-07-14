import { useRef, useState } from "react";
import { Upload, Download } from "lucide-react";
import { parseCsv, downloadCsv } from "../utils/csv";

/**
 * CsvToolsBar
 * ------------------------------------------------------------------
 * Toolbar generik untuk Import CSV (bulk insert) dan Export CSV.
 * Dipakai di semua halaman asset agar perilakunya konsisten. Import
 * hanya tampil untuk Admin; Export tetap tersedia untuk semua role
 * (read-only friendly).
 *
 * Bulk Restock CSV sengaja DIHAPUS (per permintaan) — restok stok baru
 * sekarang cukup lewat "Add Asset" biasa satu-satu, atau lewat
 * "Import CSV" kalau jumlahnya banyak.
 *
 * Props:
 *  - isAdmin: boolean
 *  - data: array baris yang sedang tampil (untuk Export)
 *  - exportFileName: nama file dasar untuk hasil export
 *  - onImport(rows): async, rows = array object hasil parse CSV
 */
export default function CsvToolsBar({
  isAdmin,
  data = [],
  exportFileName = "export",
  onImport,
}) {
  const importInputRef = useRef(null);
  const [preview, setPreview] = useState(null); // { headers, records, fileName }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const { headers, records } = parseCsv(String(reader.result || ""));
      if (records.length === 0) {
        setError("The CSV file is empty or could not be read.");
        return;
      }
      if (!headers.includes("entity_id") && !headers.includes("serial_number")) {
        setError('CSV must include at least an "entity_id" or "serial_number" column.');
        return;
      }
      setPreview({ headers, records, fileName: file.name });
    };
    reader.onerror = () => setError("Failed to read the file.");
    reader.readAsText(file);
  }

  async function confirmPreview() {
    if (!preview) return;
    setIsSubmitting(true);
    setError("");
    try {
      await onImport(preview.records);
      setPreview(null);
    } catch (err) {
      setError(err.message || "Failed to process the CSV file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleExport() {
    if (!data || data.length === 0) {
      alert("No data to export.");
      return;
    }
    const columns = Array.from(
      data.reduce((set, row) => {
        Object.keys(row).forEach((k) => {
          if (k !== "photo") set.add(k);
        });
        return set;
      }, new Set())
    );
    downloadCsv(`${exportFileName}-${Date.now()}`, data, columns);
  }

  return (
    <>
      {isAdmin && (
        <>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={handleFileSelected}
          />
          <button className="btn-add-dashboard" onClick={() => importInputRef.current?.click()}>
            <Upload size={18} />
            Import CSV
          </button>
        </>
      )}

      <button className="btn-add-dashboard" onClick={handleExport}>
        <Download size={18} />
        Export CSV
      </button>

      {preview && (
        <div className="dash-modal-overlay" onClick={() => !isSubmitting && setPreview(null)}>
          <div
            className="dash-modal-box"
            style={{ maxWidth: 820 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dash-modal-header">
              <h2 className="dash-modal-title">Import CSV Preview</h2>
              <button className="dash-modal-close" onClick={() => setPreview(null)}>
                ×
              </button>
            </div>

            <div className="dash-modal-body">
              <p style={{ marginBottom: 10 }}>
                <strong>{preview.fileName}</strong> — {preview.records.length} row(s) detected.
              </p>
              {error && <span className="field-error">{error}</span>}
              <div style={{ overflowX: "auto", maxHeight: 320, border: "1px solid #e2e2e2", borderRadius: 8 }}>
                <table className="ram-table" style={{ minWidth: 480 }}>
                  <thead>
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.records.slice(0, 20).map((row, idx) => (
                      <tr key={idx}>
                        {preview.headers.map((h) => (
                          <td key={h}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.records.length > 20 && (
                <p style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                  Showing first 20 of {preview.records.length} rows.
                </p>
              )}
            </div>

            <div className="dash-modal-footer">
              <button
                className="dash-btn-cancel"
                onClick={() => setPreview(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button className="dash-btn-save" onClick={confirmPreview} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : `Import ${preview.records.length} row(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

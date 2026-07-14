import { apiClient } from "./apiClient";
import { downloadCsv } from "../utils/csv";
import { RESOURCE_CATEGORIES } from "../constants/resourceCategories";

/**
 * dashboardService.js
 * ------------------------------------------------------------------
 * Ringkasan dashboard (kartu summary, distribusi kategori, aktivitas
 * terbaru, low-stock alert) dihitung langsung oleh backend dari data
 * asli di tabel `master_assets` (lihat GET /api/dashboard/summary).
 * Tidak ada lagi data mock/localStorage, dan tidak ada lagi konsep
 * "resource"/storageKey per kategori — semuanya dibedakan lewat
 * kolom `category` / `sub_category` di master_assets.
 * ------------------------------------------------------------------
 */
export const dashboardService = {
  async _getSummaryPayload() {
    if (!this._cached) {
      this._cached = await apiClient.get("/dashboard/summary");
    }
    return this._cached;
  },

  async getSummary() {
    const data = await apiClient.get("/dashboard/summary");
    this._cached = data;
    return data.summaryCards;
  },

  async getCategoryBars() {
    const data = await this._getSummaryPayload();
    return data.categoryBars;
  },

  async getActivities() {
    const data = await this._getSummaryPayload();
    return data.activities;
  },

  async getLowStock() {
    const data = await this._getSummaryPayload();
    return data.lowStock;
  },

  /**
   * Restock cepat dari kartu Low Stock Alert: menambah `qty` unit baru
   * (dengan entity_id/Asset Tag baru) pada kategori+sub_category terkait
   * lewat endpoint bulk-restock (bulk insert ke master_assets).
   * `entity_id` WAJIB diisi karena backend melewati baris tanpa `entity_id`.
   */
  async restockItem(item, qty, entityId) {
    const category = item?.category;
    const subCategory = item?.sub_category;
    if (!category) throw new Error("Missing category for restock.");
    if (!entityId || !entityId.trim()) {
      throw new Error("Entity ID / Asset Tag is required to restock.");
    }

    const created = await apiClient.post(`/assets/bulk-restock`, {
      items: [
        {
          category,
          sub_category: subCategory,
          entity_id: entityId.trim(),
          quantity: Number(qty) || 1,
        },
      ],
    });

    const data = await apiClient.get("/dashboard/summary");
    this._cached = data;
    const updated = data.lowStock.find(
      (row) => row.category === category && row.sub_category === subCategory
    );
    return (
      updated || {
        id: `${category}-${subCategory}`,
        category,
        sub_category: subCategory,
        name: subCategory || category,
        qty: created.length,
        sisa: `${created.length} pcs`,
      }
    );
  },

  /**
   * Export laporan CSV untuk satu kategori besar (atau seluruh aset bila
   * "all"), langsung dari master_assets. Filter status ("action")
   * bersifat opsional dan diterapkan di sisi client terhadap data yang
   * sudah diambil.
   */
  async exportReport(categoryGroup, statusFilter = "") {
    const categories = RESOURCE_CATEGORIES[categoryGroup] || RESOURCE_CATEGORIES.all;
    let rows = [];
    for (const category of categories) {
      const items = await apiClient.get(`/assets?category=${encodeURIComponent(category)}`);
      items.forEach((item) => rows.push({ ...item }));
    }
    if (statusFilter) {
      rows = rows.filter((row) => (row.action || "").toUpperCase() === statusFilter.toUpperCase());
    }
    if (rows.length === 0) {
      alert("No data to export for this category.");
      return { success: false };
    }
    downloadCsv(`report-${categoryGroup}-${Date.now()}`, rows);
    return { success: true };
  },

  /**
   * Unduh laporan PDF resmi dari backend (app/routers/reports.py ->
   * GET /api/reports/generate?format=pdf). Backend membangun PDF di
   * memori (ReportLab) dan membalasnya sebagai StreamingResponse;
   * apiClient.downloadFile menangani response Blob tsb dan langsung
   * memicu unduhan di browser.
   *
   * @param {{ category?: string, action?: string, condition?: string,
   *            dept?: string, dateFrom?: string, dateTo?: string }} filters
   *   `category` harus berupa nama kategori PERSIS seperti di
   *   master_assets (lihat constants/resourceCategories.js).
   */
  async downloadReport(filters = {}) {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.category) params.set("category", filters.category);
    if (filters.condition) params.set("condition", filters.condition);
    if (filters.dept) params.set("dept", filters.dept);
    if (filters.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters.dateTo) params.set("date_to", filters.dateTo);
    params.set("format", "pdf");

    return apiClient.downloadFile(
      `/reports/generate?${params.toString()}`,
      `telventory-report-${Date.now()}.pdf`
    );
  },
};

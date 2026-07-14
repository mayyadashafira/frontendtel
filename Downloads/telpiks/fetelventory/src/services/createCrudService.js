/**
 * createCrudService.js
 * ------------------------------------------------------------------
 * Factory service CRUD generic yang dipakai oleh semua *AssetService.js.
 *
 * Backend menyimpan SEMUA jenis aset dalam SATU tabel Supabase bernama
 * `master_assets`. Kolom-kolom tabel tersebut adalah:
 *   id, entity_id, category, sub_category, sub_sub, condition,
 *   last_check_date, year, dept, health, action, serial_number,
 *   manufacture, capacity, speed, brand, charger_tab, casing_tab, mac,
 *   port, type, size, location, device_type, assign_to, quantity,
 *   notes, pc_name, employed_name, pic, username, photo, created_at,
 *   updated_at
 *
 * Setiap kategori aset (PC, RAM, SSD, dst) BUKAN tabel terpisah lagi —
 * melainkan baris di `master_assets` yang dibedakan lewat kolom
 * `category` dan `sub_category` (dan, untuk kasus khusus HDD vs HDD
 * Health, juga kolom `sub_sub` — lihat opsi `subSub`/`subSubEmpty` di
 * bawah).
 *
 * PENTING soal nilai category/sub_category: nilai-nilai ini HARUS
 * PERSIS SAMA dengan yang sudah ada di data production Supabase
 * (termasuk penulisan yang mungkin terasa aneh/typo seperti
 * "Dogle Wi-Fi", "Fortiswitch", "HDMIPort", "Hub / Adapter", "MS",
 * "MSW", "Network Part", "Battery NB") — BUKAN ejaan yang "benar",
 * karena backend memfilter dengan pencocokan string persis (exact
 * match) ke data yang sudah ada. Kalau nanti data di Supabase
 * dirapikan/di-rename, nilai di sini harus ikut disesuaikan.
 *
 * Endpoint REST tunggal: /api/assets (lihat apiClient.js untuk base
 * URL). create/update/delete/bulk-import/bulk-restock hanya diizinkan
 * untuk role Admin oleh backend (`require_admin`).
 * ------------------------------------------------------------------
 */
import { apiClient } from "./apiClient";

/**
 * Field yang HANYA dipakai untuk keperluan UI (styling badge, dsb) dan
 * BUKAN kolom asli di master_assets — jangan pernah dikirim ke backend.
 */
const UI_ONLY_FIELDS = ["badge"];

/**
 * Kolom `action` di master_assets adalah ENUM (asset_status) yang HANYA
 * menerima 'IN USE' | 'IN STORE' | 'BROKEN' — nilai lain (termasuk ""
 * atau "Null") akan membuat query gagal. Kalau belum dipilih, kirim
 * `null` (bukan string kosong) supaya kolom tetap NULL di database.
 */
function sanitizePayload(payload = {}) {
  const clean = { ...payload };
  UI_ONLY_FIELDS.forEach((field) => delete clean[field]);
  if ("action" in clean) {
    const value = clean.action;
    clean.action = value && value !== "Null" ? value : null;
  }
  return clean;
}

/**
 * @param {string} category
 * @param {string} subCategory
 * @param {Object} [options]
 * @param {string} [options.subSub] - Kalau diisi, HANYA baris dengan
 *   sub_sub PERSIS sama ini yang diambil (dipakai healthReports untuk
 *   memisahkan baris "laporan kesehatan HDD" dari baris "unit HDD
 *   fisik" — keduanya sama-sama category="Storage Management" +
 *   sub_category="HDD", dibedakan lewat sub_sub). Nilai ini juga
 *   otomatis disisipkan ke payload saat create, kalau field sub_sub
 *   tidak diisi manual.
 * @param {boolean} [options.subSubEmpty] - Kalau true, HANYA baris
 *   dengan sub_sub kosong/NULL yang diambil (dipakai hddAssets untuk
 *   TIDAK menampilkan baris laporan kesehatan HDD yang menumpang di
 *   sub_category yang sama).
 */
export function createCrudService(category, subCategory, options = {}) {
  const { subSub, subSubEmpty } = options;
  const base = "/assets";

  function buildQuery(extra = {}) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subCategory) params.set("sub_category", subCategory);
    if (subSub) params.set("sub_sub", subSub);
    if (subSubEmpty) params.set("sub_sub_empty", "true");
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  function withCategory(payload = {}) {
    const row = {
      category,
      sub_category: subCategory,
      ...payload,
    };
    if (subSub && (row.sub_sub === undefined || row.sub_sub === "")) {
      row.sub_sub = subSub;
    }
    return sanitizePayload(row);
  }

  return {
    /**
     * Ambil seluruh baris master_assets untuk kategori/sub-kategori ini.
     * Filter juga dilakukan di client sebagai pengaman kalau backend
     * mengembalikan lebih dari yang diminta.
     */
    async list() {
      const data = await apiClient.get(buildQuery());
      if (!Array.isArray(data)) return data;
      return data.filter((row) => {
        const matchCategory = !category || row.category === category;
        const matchSub = !subCategory || row.sub_category === subCategory;
        const matchSubSub = !subSub || row.sub_sub === subSub;
        const matchEmptySubSub = !subSubEmpty || !row.sub_sub;
        return matchCategory && matchSub && matchSubSub && matchEmptySubSub;
      });
    },

    async create(payload) {
      return apiClient.post(base, withCategory(payload));
    },

    async update(id, payload) {
      return apiClient.put(`${base}/${id}`, withCategory(payload));
    },

    async remove(id) {
      return apiClient.del(`${base}/${id}`);
    },

    /**
     * Bulk import dari CSV (preview & validasi dilakukan di UI sebelum
     * dipanggil). Backend melakukan bulk insert dalam satu transaksi
     * ke master_assets.
     */
    async bulkImport(items) {
      return apiClient.post(`${base}/bulk-import`, {
        items: items.map((item) => withCategory(item)),
      });
    },

    /**
     * Bulk restock dari CSV: menambah unit stok baru berdasarkan qty per baris.
     */
    async bulkRestock(items) {
      return apiClient.post(`${base}/bulk-restock`, {
        items: items.map((item) => withCategory(item)),
      });
    },
  };
}

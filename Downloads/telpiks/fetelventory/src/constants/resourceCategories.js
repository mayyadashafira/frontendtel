/**
 * resourceCategories.js
 * ------------------------------------------------------------------
 * Daftar kategori & sub-kategori master_assets (Supabase). Semua aset
 * disimpan di SATU tabel `master_assets`, dibedakan lewat kolom
 * `category` dan `sub_category`. File ini adalah satu-satunya sumber
 * kebenaran (single source of truth) untuk nilai `category`/
 * `sub_category` yang dipakai di seluruh halaman & service, supaya
 * tidak ada lagi typo/ketidaksesuaian antar halaman (mis. dulu ada
 * "PC & Wokrshop" vs "PC & Workshop", "Peripherals & Accecories" vs
 * "Peripherals & Accessories", dst).
 * ------------------------------------------------------------------
 */

/**
 * resourceCategories.js
 * ------------------------------------------------------------------
 * Daftar kategori & sub-kategori master_assets (Supabase). Nilai
 * sub_category di sini disamakan PERSIS dengan yang sudah ada di data
 * production (lihat cek langsung ke Supabase) — termasuk penulisan
 * yang terasa tidak baku ("Dogle Wi-Fi", "Fortiswitch", "HDMIPort",
 * "Hub / Adapter", "MS", "MSW", "Network Part", "Battery NB") karena
 * backend memfilter dengan pencocokan string persis.
 * ------------------------------------------------------------------
 */

export const CATEGORY_OPTIONS = {
  "Storage Management": ["SSD", "HDD", "Flashdisk"],
  "Hardware & Components": ["RAM", "Battery NB"],
  "Peripherals & Accessories": [
    "Keyboard",
    "Combo",
    "Webcam",
    "Headphone",
    "Multiport USB",
    "HDMIPort",
    "Hub / Adapter",
    "MSW",
    "MS",
  ],
  "Network Infrastructure": ["Dogle Wi-Fi", "Network Part", "Fortiswitch"],
  "Devices & Office Output": ["Tablet", "Cast", "Printer", "UPS"],
  "List PC & Workstation": ["PC"],
};

/**
 * Dipakai oleh dashboardService untuk export CSV & filter dashboard
 * per kategori besar. "all" = seluruh kategori.
 */
export const RESOURCE_CATEGORIES = {
  all: Object.keys(CATEGORY_OPTIONS),
  pc: ["List PC & Workstation"],
  storage: ["Storage Management"],
  hardware: ["Hardware & Components"],
  peripherals: ["Peripherals & Accessories"],
  network: ["Network Infrastructure"],
  devices: ["Devices & Office Output"],
};

/**
 * Nilai valid untuk kolom `action` (enum asset_status di Supabase).
 * HANYA 3 nilai ini yang diterima database — jangan pernah kirim
 * string lain (termasuk "Null"/"" akan otomatis dikonversi ke NULL
 * oleh createCrudService, JANGAN dikirim sebagai teks).
 */
export const ACTION_STATUSES = ["IN USE", "IN STORE", "BROKEN"];

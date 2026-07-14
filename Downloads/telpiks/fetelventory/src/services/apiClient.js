/**
 * apiClient.js
 * ------------------------------------------------------------------
 * Lapisan HTTP terpusat untuk seluruh komunikasi frontend <-> backend
 * FastAPI (app/main.py). Base URL default "/api" (di-proxy oleh Vite ke
 * backend, lihat vite.config.js), atau bisa dioverride lewat
 * VITE_API_BASE_URL di file .env.
 *
 * Auth: TIDAK lagi pakai token JWT custom di localStorage. Token yang
 * dikirim sebagai header `Authorization: Bearer <token>` sekarang
 * diambil langsung dari sesi Supabase Auth yang sedang aktif
 * (supabase.auth.getSession()) — sesi ini otomatis di-refresh oleh
 * supabase-js, jadi tokennya selalu valid selama user belum logout.
 * ------------------------------------------------------------------
 */
import { supabase } from "../lib/supabaseClient";

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "/api";

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

async function request(path, { method = "GET", body, headers } = {}) {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Sesi habis/invalid di sisi backend -> paksa logout dari Supabase juga
    // supaya AuthContext (via onAuthStateChange) otomatis mendeteksi dan
    // ProtectedRoute mengarahkan balik ke halaman login.
    await supabase.auth.signOut();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || data?.detail || message;
    } catch {
      // response tidak berupa JSON, biarkan pesan default
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * requestBlob
 * ------------------------------------------------------------------
 * Sama seperti `request`, tapi untuk endpoint yang membalas file biner
 * (mis. laporan PDF dari `StreamingResponse` FastAPI) alih-alih JSON.
 */
async function requestBlob(path) {
  const token = await getAuthToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || data?.detail || message;
    } catch {
      // response bukan JSON (mis. body PDF kosong pada error), pakai pesan default
    }
    throw new Error(message);
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const blob = await res.blob();
  return { blob, filename: match ? match[1] : null };
}

/**
 * Memicu unduhan file di browser dari sebuah Blob, tanpa perlu
 * membuka tab baru atau menulis file sementara di server.
 */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `download-${Date.now()}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * uploadFile
 * ------------------------------------------------------------------
 * Kirim file sebagai multipart/form-data (dipakai buat upload foto
 * aset ke Supabase Storage lewat backend). SENGAJA tidak pakai
 * `request()` di atas karena butuh FormData, bukan JSON — dan
 * Content-Type header TIDAK di-set manual, biar browser yang isi
 * otomatis (termasuk boundary multipart-nya).
 */
async function uploadFile(path, file) {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || data?.detail || message;
    } catch {
      // response bukan JSON, biarkan pesan default
    }
    throw new Error(message);
  }

  return res.json();
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
  /** Ambil response sebagai Blob mentah (tanpa langsung mengunduh). */
  getBlob: (path) => requestBlob(path),
  /** Ambil file dari `path` lalu langsung picu unduhan di browser. */
  downloadFile: async (path, fallbackName) => {
    const { blob, filename } = await requestBlob(path);
    triggerBlobDownload(blob, filename || fallbackName);
    return true;
  },
  /** Upload file (multipart/form-data), lihat uploadFile() di atas. */
  uploadFile,
  baseUrl: BASE_URL,
  /** Sekarang ASYNC (harus di-tanya ke Supabase) — dulu sync (localStorage). */
  getToken: getAuthToken,
};

import { supabase } from "../lib/supabaseClient";
import { apiClient } from "./apiClient";

/**
 * authService.js
 * ------------------------------------------------------------------
 * Login, register, forgot/reset password sekarang seluruhnya lewat
 * Supabase Auth langsung dari browser (supabase-js) — TIDAK lagi
 * lewat backend FastAPI untuk hal ini. Backend cuma dipakai untuk:
 *   - POST /auth/register  -> membuat baris profil di tabel `users`
 *                              (status selalu "pending", role "user")
 *   - GET  /auth/me         -> ambil profil (nama, role, status, dst)
 *                              berdasarkan token Supabase yang sedang aktif
 * ------------------------------------------------------------------
 */
export const authService = {
  /**
   * Login ke Supabase Auth, lalu ambil profil dari backend (untuk tahu
   * role & status approval). Kalau akun masih "pending" (belum
   * di-approve admin), sesi langsung di-signOut lagi supaya user tidak
   * bisa "setengah login".
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message || "Failed to sign in.");
    }

    try {
      const { user } = await apiClient.get("/auth/me");

      if (user.status === "pending") {
        await supabase.auth.signOut();
        throw new Error("Your account is still awaiting admin approval.");
      }

      return { user, session: data.session };
    } catch (err) {
      // Kalau gagal ambil profil (mis. baris di tabel users belum ada),
      // jangan tinggalkan sesi Supabase menggantung.
      await supabase.auth.signOut();
      throw err;
    }
  },

  /**
   * Register: buat baris profil (status "pending") lewat backend.
   * Backend-lah yang membuat akun Supabase Auth-nya (pakai service_role
   * key, admin.createUser) supaya email bisa langsung dianggap
   * terverifikasi tanpa harus klik link konfirmasi dulu.
   */
  async register({ fullName, email, password, department, employeeId, phone }) {
    const missing = [];
    if (!fullName?.trim()) missing.push("Full name");
    if (!email?.trim()) missing.push("Email");
    if (!department?.trim()) missing.push("Department");
    if (!employeeId?.trim()) missing.push("Employee ID");
    if (!phone?.trim()) missing.push("Phone number");
    if (!password) missing.push("Password");
    if (missing.length > 0) {
      throw new Error(`${missing.join(", ")} ${missing.length > 1 ? "are" : "is"} required.`);
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    if (/^[A-Za-z]+$/.test(password)) {
      throw new Error("Password cannot be letters only — add a number or symbol too.");
    }

    try {
      return await apiClient.post("/auth/register", {
        fullName,
        email,
        password,
        department,
        employeeId,
        phone,
      });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("email")) {
        throw new Error("This email is already registered. Please sign in instead.");
      }
      if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("409")) {
        throw new Error("Some of the details you entered are already registered.");
      }
      throw err;
    }
  },

  async me() {
    return apiClient.get("/auth/me");
  },

  /** Kirim email berisi link reset password (Supabase yang kirim emailnya). */
  async sendResetLink({ email }) {
    if (!email) throw new Error("Email is required.");
    const redirectTo = `${window.location.origin}/update-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    if (error) throw new Error(error.message || "Failed to send reset link.");
    return { message: "Password reset link sent. Please check your email." };
  },

  /**
   * Dipanggil dari halaman /update-password SETELAH user klik link di
   * email. Supabase otomatis membuat sesi sementara dari link tsb
   * (lihat supabase.auth.onAuthStateChange -> event "PASSWORD_RECOVERY"),
   * jadi di sini kita cukup update password sesi yang sedang aktif.
   */
  async updatePassword({ password }) {
    if (!password) throw new Error("Password is required.");
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message || "Failed to reset password.");
    return { message: "Password updated successfully." };
  },

  async logout() {
    await supabase.auth.signOut();
  },
};

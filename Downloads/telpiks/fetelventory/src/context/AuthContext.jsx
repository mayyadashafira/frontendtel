import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { apiClient } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { user: profile } = await apiClient.get("/auth/me");
      if (profile.status === "pending") {
        // Jangan biarkan akun pending "nyangkut" login.
        await supabase.auth.signOut();
        setUser(null);
        return;
      }
      setUser(profile);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Cek sesi yang sedang aktif saat aplikasi pertama kali dibuka.
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await loadProfile();
      }
      if (isMounted) setIsReady(true);
    });

    // Dengarkan perubahan sesi (login, logout, token refresh, password
    // recovery) — ini yang membuat AuthContext otomatis sinkron tanpa
    // perlu manggil `login()` manual dari halaman Login.
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await loadProfile();
      }
      // event === "PASSWORD_RECOVERY" sengaja tidak memuat profil di sini;
      // ditangani sendiri di halaman /update-password.
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = useCallback((partialUser) => {
    setUser((prev) => (prev ? { ...prev, ...partialUser } : partialUser));
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin" || user?.role === "superuser",
    isSuperuser: user?.role === "superuser",
    isReady,
    logout,
    updateProfile,
    /** Dipanggil manual dari halaman Login setelah authService.login() sukses,
     * supaya UI langsung update tanpa menunggu event onAuthStateChange. */
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

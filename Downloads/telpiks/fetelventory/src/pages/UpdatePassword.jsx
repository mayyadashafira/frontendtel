import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/auth.css";
import { supabase } from "../lib/supabaseClient";
import { authService } from "../services/authService";

/**
 * UpdatePassword.jsx
 * ------------------------------------------------------------------
 * Halaman tujuan link "Reset Password" dari email Supabase (lihat
 * redirectTo di authService.sendResetLink). Supabase otomatis membuat
 * sesi sementara dari token di URL sebelum halaman ini mount (event
 * "PASSWORD_RECOVERY" di onAuthStateChange), jadi di sini kita cukup
 * tunggu sesi itu siap lalu panggil supabase.auth.updateUser().
 * ------------------------------------------------------------------
 */
export default function UpdatePassword() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Kalau user buka halaman ini tanpa lewat link email, tidak akan ada
    // sesi PASSWORD_RECOVERY yang terbentuk.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });

    // Fallback: kalau event sudah lewat sebelum listener terpasang,
    // cek langsung apakah sudah ada sesi aktif.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setIsReady(true);
      } else {
        setTimeout(() => {
          if (!isReady) setInvalidLink(true);
        }, 3000);
      }
    });

    return () => listener?.subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await authService.updatePassword({ password });
      setDone(true);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-layout page-enter">
      <div className="auth-left">
        <div className="auth-logo">
          <img src="/logoaplikasi.svg" alt="Telventory Systems" className="logo-img" />
          <div className="logo-text">
            <span className="logo-name">Telventory Systems</span>
            <span className="logo-sub">PT Tanjungenim Lestari Plup and Paper</span>
          </div>
        </div>
        <div className="auth-hero">
          <h1>Set a new password</h1>
          <p>Almost there — choose a strong password</p>
        </div>
        <div className="auth-waves" />
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {invalidLink ? (
            <div className="auth-success">
              <h2 className="auth-title">Link expired or invalid</h2>
              <p className="auth-subtitle">
                This password reset link is no longer valid. Please request a new one.
              </p>
              <Link to="/forgot" className="btn-primary" style={{ textAlign: "center", display: "block", textDecoration: "none" }}>
                Request New Link
              </Link>
            </div>
          ) : done ? (
            <div className="auth-success">
              <div className="success-icon">✓</div>
              <h2 className="auth-title">Password Reset!</h2>
              <p className="auth-subtitle">
                Your password has been changed successfully. You can now sign in with your new
                password.
              </p>
              <button type="button" className="btn-primary" onClick={() => navigate("/")}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 className="auth-title">Reset Password</h2>
              <p className="auth-subtitle">Enter your new password below.</p>

              <form className="field-group" onSubmit={handleSubmit} noValidate>
                <div className="field-wrap">
                  <label className="field-label">New Password</label>
                  <div className="input-icon-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      className="field-input"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={!isReady}
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <FaEyeSlash color="#000" /> : <FaEye color="#000" />}
                    </button>
                  </div>
                </div>

                <div className="field-wrap">
                  <label className="field-label">Confirm Password</label>
                  <div className="input-icon-wrap">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      className="field-input"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      disabled={!isReady}
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                    >
                      {showConfirmPass ? <FaEyeSlash color="#000" /> : <FaEye color="#000" />}
                    </button>
                  </div>
                </div>

                {error && <span className="field-error">{error}</span>}

                <button type="submit" className="btn-primary" disabled={!isReady || isSubmitting}>
                  {!isReady ? "Verifying link..." : isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

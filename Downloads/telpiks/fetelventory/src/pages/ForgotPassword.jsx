import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";
import { authService } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendLink(e) {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setEmailError("");
    setIsSending(true);
    try {
      await authService.sendResetLink({ email });
      setSent(true);
    } catch (err) {
      setEmailError(err.message || "Failed to send reset link.");
    } finally {
      setIsSending(false);
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
          <h1>Forgot your password?</h1>
          <p>No worries, we'll help you get back in</p>
        </div>
        <div className="auth-waves" />
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {!sent ? (
            <>
              <h2 className="auth-title">Forget Password</h2>
              <p className="auth-subtitle">
                Enter the email associated with your account and we'll send you a link to reset
                your password.
              </p>

              <form className="field-group" onSubmit={handleSendLink} noValidate>
                <div className="field-wrap">
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                  />
                  {emailError && <span className="field-error">{emailError}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={isSending}>
                  {isSending ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <p className="auth-switch">
                Remembered your password?{" "}
                <Link to="/" className="switch-link">
                  Back to Sign In
                </Link>
              </p>
            </>
          ) : (
            <div className="auth-success">
              <div className="success-icon">✓</div>
              <h2 className="auth-title">Check your email</h2>
              <p className="auth-subtitle">
                We sent a password reset link to <strong>{email}</strong>. Open it to set a new
                password. The link expires after a while, so use it soon.
              </p>

              <button
                type="button"
                className="switch-link link-button"
                onClick={() => setSent(false)}
              >
                Use a different email
              </button>

              <Link to="/" className="btn-primary" style={{ textAlign: "center", display: "block", textDecoration: "none", marginTop: "1rem" }}>
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

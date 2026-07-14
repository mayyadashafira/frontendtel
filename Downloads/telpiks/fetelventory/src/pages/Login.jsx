import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/auth.css";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const { user } = await authService.login({ email, password });
      // Set langsung ke context supaya UI update seketika. AuthContext
      // juga akan sinkron sendiri lewat onAuthStateChange, ini cuma
      // mempercepat redirect tanpa nunggu event tambahan.
      setUser(user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to sign in.");
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
          <h1>Welcome Back!</h1>
          <p>Check and update inventory stock data</p>
        </div>
        <div className="auth-waves" />
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Welcome Back</h2>

          <form className="field-group" onSubmit={handleSubmit} noValidate>
            <div className="field-wrap">
              <label className="field-label">Email</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field-wrap">
              <label className="field-label">Password</label>
              <div className="input-icon-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <FaEyeSlash color="#000" /> : <FaEye color="#000" />}
                </button>
              </div>
              <div className="forgot-row">
                <Link to="/forgot" className="forgot-link">
                  Forget Password?
                </Link>
              </div>
            </div>

            {error && <span className="field-error">{error}</span>}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
              />
              <span>Remember me on this device</span>
            </label>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="auth-switch">
            Don't Have An Account?{" "}
            <Link to="/register" className="switch-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

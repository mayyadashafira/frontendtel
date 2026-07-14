import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/auth.css";
import { authService } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("You must agree to the processing of personal data.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Sekarang semua pendaftaran baru SELALU berstatus "pending" —
      // tidak ada lagi kode rahasia untuk langsung jadi admin/superuser.
      // Kenaikan role hanya bisa dilakukan Superuser lewat menu Admin
      // setelah akun disetujui.
      const result = await authService.register({
        fullName,
        email,
        password,
        department,
        employeeId,
        phone,
      });
      setSuccessMessage(result.message);
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-layout register-layout page-enter">
      <div className="auth-right" style={{ borderRadius: "0 2rem 2rem 0" }}>
        <div className="auth-card">
          <h2 className="auth-title">Get Started</h2>

          {successMessage ? (
            <div className="field-group">
              <p style={{ lineHeight: 1.6 }}>{successMessage}</p>
              <Link to="/" className="btn-primary" style={{ textAlign: "center", display: "block", textDecoration: "none" }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
          <form className="field-group" onSubmit={handleSubmit} noValidate>
            <div className="field-wrap">
              <label className="field-label">Full Name *</label>
              <input
                type="text"
                className="field-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="field-wrap">
              <label className="field-label">Email Address *</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field-wrap">
              <label className="field-label">Department *</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. MID, IT, EGD..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>
            <div className="field-wrap">
              <label className="field-label">Employee ID *</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. EMP-059"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
              <span className="field-hint">Must be unique — this can't match another employee's ID.</span>
            </div>
            <div className="field-wrap">
              <label className="field-label">Phone Number *</label>
              <input
                type="tel"
                className="field-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="field-wrap">
              <label className="field-label">Password *</label>
              <div className="input-icon-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <FaEyeSlash color="#000" /> : <FaEye color="#000" />}
                </button>
              </div>
              <span className="field-hint">
                Min. 8 characters, and not letters-only — add at least one number or symbol.
              </span>
            </div>

            {error && <span className="field-error">{error}</span>}

            <label className="checkbox-row">
              <input type="checkbox" checked={agree} onChange={() => setAgree(!agree)} />
              <span>I agree to the processing of personal data</span>
            </label>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          )}

          {!successMessage && (
          <p className="auth-switch">
            Already Have An Account?{" "}
            <Link to="/" className="switch-link">
              Sign In
            </Link>
          </p>
          )}
        </div>
      </div>

      <div className="auth-left">
        <div className="auth-logo logo-right">
          <div className="logo-text text-right">
            <span className="logo-name">Telventory Systems</span>
            <span className="logo-sub">PT Tanjungenim Lestari Plup and Paper</span>
          </div>
          <img src="/logoaplikasi.svg" alt="Telventory Systems" className="logo-img" />
        </div>
        <div className="auth-hero">
          <h1>Join The Team!</h1>
          <p>Enter your details to create an employee account</p>
        </div>
        <div className="auth-waves" />
      </div>
    </div>
  );
}

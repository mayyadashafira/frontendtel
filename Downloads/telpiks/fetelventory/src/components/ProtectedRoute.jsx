import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * - Redirect ke halaman login bila belum authenticated.
 * - Bila `adminOnly`, redirect ke /dashboard bila user bukan admin
 *   (mencegah akses langsung lewat URL sekalipun, karena pengecekan
 *   dilakukan di setiap render, bukan hanya di Sidebar/menu).
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

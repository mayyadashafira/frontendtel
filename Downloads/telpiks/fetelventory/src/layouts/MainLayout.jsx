import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  const location = useLocation();

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="page-enter" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
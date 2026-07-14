import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Monitor,
  HardDrive,
  Cpu,
  Keyboard,
  Network,
  Printer,
  UserCog,
  LogOut,
  BrainCircuit,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "List PC & Workstation",
    path: "/list-pc",
    icon: Monitor,
  },
  {
    label: "Tel AI",
    path: "/telai",
    icon: BrainCircuit,
  },
  {
    label: "Admin",
    path: "/admin",
    icon: UserCog,
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [openStorage, setOpenStorage] = useState(
    location.pathname.startsWith("/storage")
  );

  const [openHardware, setOpenHardware] = useState(
    location.pathname.startsWith("/hardware")
  );

  const [openPeripherals, setOpenPeripherals] = useState(
    location.pathname.startsWith("/peripherals")
  );

  const [openNetwork, setOpenNetwork] = useState(
    location.pathname.startsWith("/network")
  );

  const [openDevices, setOpenDevices] = useState(
    location.pathname.startsWith("/deviceofficeoutput")
  );

  const sidebarRef = useRef(null);
  useEffect(() => {
    if (location.pathname.startsWith("/storage")) {
      setOpenStorage(true);
    }

    if (location.pathname.startsWith("/hardware")) {
      setOpenHardware(true);
    }

    if (location.pathname.startsWith("/peripherals")) {
      setOpenPeripherals(true);
    }

    if (location.pathname.startsWith("/network")) {
      setOpenNetwork(true);
    }

    if (location.pathname.startsWith("/deviceofficeoutput")) {
      setOpenDevices(true);
    }

    const savedScroll = sessionStorage.getItem(
      "sidebarScroll"
    );
    if (savedScroll && sidebarRef.current) {
      setTimeout(() => {
        sidebarRef.current.scrollTop =
          Number(savedScroll);
      }, 0);
    }
  }, [location.pathname]);

  const handleSidebarScroll = () => {
    if (!sidebarRef.current) return;
    sessionStorage.setItem(
      "sidebarScroll",
      sidebarRef.current.scrollTop
    );
  };
  return (

    <aside
      className="sidebar"
      ref={sidebarRef}
      onScroll={handleSidebarScroll}
    >

      <div className="sidebar-logo">
        <img
          src="/logoaplikasi.svg"
          alt="logo"
          className="sidebar-logo-img"
        />
        <span className="sidebar-logo-text">
          Telventory Systems
        </span>
      </div>

      <nav className="sidebar-nav">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div>
          <NavLink
            to="/storage"
            className={({ isActive }) =>
              `nav-item ${
                isActive ||
                location.pathname.startsWith("/storage")
                  ? "nav-active"
                  : ""
              }`
            }
            onClick={() =>
              setOpenStorage(!openStorage)
            }
          >
            <HardDrive size={18} />
            <span>Storage Management</span>
          </NavLink>

          {openStorage && (
            <div className="submenu">

              <NavLink
                to="/storage/ssd"
                className="submenu-item"
              >
                SSD
              </NavLink>

              <NavLink
                to="/storage/hdd"
                end
                className="submenu-item"
              >
                Storage (HDD/NAS)
              </NavLink>

              <NavLink
                to="/storage/flashdisk"
                className="submenu-item"
              >
                Flashdisk (FD)
              </NavLink>

              <NavLink
                to="/storage/hdd/health"
                className="submenu-item"
              >
                HDD Health PM
              </NavLink>
            </div>
          )}
        </div>

        <div>
          <NavLink
            to="/hardware"
            className={({ isActive }) =>
              `nav-item ${
                isActive || location.pathname.startsWith("/hardware")
                  ? "nav-active"
                  : ""
              }`
            }
            onClick={() => setOpenHardware(!openHardware)}
          >
            <Cpu size={18} />
            <span>Hardware & Components</span>
          </NavLink>

          {openHardware && (
            <div className="submenu">
              <NavLink
                to="/hardware/ram"
                className="submenu-item"
              >
                RAM
              </NavLink>

              <NavLink
                to="/hardware/battery"
                className="submenu-item"
              >
                Battery NB
              </NavLink>
            </div>
          )}
        </div>
        <div>
          <NavLink
            to="/peripherals"
            className={({ isActive }) =>
              `nav-item ${
                isActive ||
                location.pathname.startsWith("/peripherals")
                  ? "nav-active"
                  : ""
              }`
            }
            onClick={() =>
              setOpenPeripherals(!openPeripherals)
            }
          >
            <Keyboard size={18} />
            <span>Peripherals & Accessories</span>
          </NavLink>

          {openPeripherals && (
            <div className="submenu">
              <NavLink
                to="/peripherals/keyboard"
                className="submenu-item"
              >
                Keyboard
              </NavLink>

              <NavLink
                to="/peripherals/combo"
                className="submenu-item"
              >
                Combo
              </NavLink>

              <NavLink
                to="/peripherals/webcam"
                className="submenu-item"
              >
                Webcam
              </NavLink>

              <NavLink
                to="/peripherals/headphone"
                className="submenu-item"
              >
                Headphone
              </NavLink>

              <NavLink
                to="/peripherals/multiport-usb"
                className="submenu-item"
              >
                Multiport USB
              </NavLink>

              <NavLink
                to="/peripherals/hubadaptor"
                className="submenu-item"
              >
                Hub/ Adaptor
              </NavLink>

              <NavLink
                to="/peripherals/hdmi-port"
                className="submenu-item"
              >
                HDMI Port
              </NavLink>

              <NavLink 
                to="/peripherals/msw" 
                className="submenu-item"
              >
                Mouse Wireless
              </NavLink>

              <NavLink 
                to="/peripherals/mouse" 
                className="submenu-item"
              >
                Mouse
              </NavLink>
            </div>
          )}
        </div>

        <div>
          <NavLink
            to="/network"
            className={({ isActive }) =>
              `nav-item ${
                isActive || location.pathname.startsWith("/network")
                  ? "nav-active"
                  : ""
              }`
            }
            onClick={() => setOpenNetwork(!openNetwork)}
          >
            <Network size={18} />
            <span>Network Infrastructure</span>
          </NavLink>

          {openNetwork && (
            <div className="submenu">
              <NavLink to="/network/donglewifi" className="submenu-item">
                Dongle Wi-Fi
              </NavLink>

              <NavLink to="/network/port" className="submenu-item">
                Port
              </NavLink>

              <NavLink to="/network/fortiswitch" className="submenu-item">
                FortiSwitch
              </NavLink>
            </div>
          )}
        </div>

        <div>
          <NavLink
            to="/deviceofficeoutput"
            className={({ isActive }) =>
              `nav-item ${
                isActive || location.pathname.startsWith("/deviceofficeoutput")
                  ? "nav-active"
                  : ""
              }`
            }
            onClick={() => setOpenDevices(!openDevices)}
          >
            <Printer size={18} />
            <span>Devices & Office Output</span>
          </NavLink>

          {openDevices && (
            <div className="submenu">
              <NavLink to="/deviceofficeoutput/tablet" className="submenu-item">
                Tablet
              </NavLink>

              <NavLink to="/deviceofficeoutput/cast" className="submenu-item">
                Cast
              </NavLink>

              <NavLink to="/deviceofficeoutput/printer" className="submenu-item">
                Printer
              </NavLink>

              <NavLink to="/deviceofficeoutput/ups" className="submenu-item">
                UPS
              </NavLink>
            </div>
          )}
        </div>

        {navItems.slice(2).filter((item) => item.label !== "Admin" || isAdmin).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button
        className="nav-item signout"
        onClick={() => setShowLogoutModal(true)}
      >
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>

      {showLogoutModal && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <div className="logout-icon">
              <LogOut size={32} />
            </div>
            <h3 className="logout-title">
              Sign Out
            </h3>
            <p className="logout-text">
              Are you sure you want to sign out?
            </p>
            <div className="logout-buttons">
              <button
                className="logout-no"
                onClick={() => setShowLogoutModal(false)}
              >
                No
              </button>
              <button
                className="logout-yes"
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                  navigate("/");
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="sidebar-waves" />
    </aside>
  );
}

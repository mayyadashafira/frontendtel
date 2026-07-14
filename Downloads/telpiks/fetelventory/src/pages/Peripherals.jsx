import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Keyboard as KeyboardIcon,
  Layers,
  Camera,
  Headphones,
  Usb,
  Cable,
  Plug,
  Mouse as MouseIcon,
} from "lucide-react";
import "../styles/peripherals.css";
import PageHeader from "../components/PageHeader";
import NotFoundState from "../components/NotFoundState";
import { keyboardAssetService } from "../services/keyboardAssetService";
import { comboAssetService } from "../services/comboAssetService";
import { webcamAssetService } from "../services/webcamAssetService";
import { headphoneAssetService } from "../services/headphoneAssetService";
import { multiportUsbAssetService } from "../services/multiportUsbAssetService";
import { hubAdaptorAssetService } from "../services/hubAdaptorAssetService";
import { hdmiPortAssetService } from "../services/hdmiPortAssetService";
import { mswAssetService } from "../services/mswAssetService";
import { mouseAssetService } from "../services/mouseAssetService";

const CATEGORY_CONFIG = [
  { key: "keyboard", title: "Keyboard", color: "red", icon: KeyboardIcon, service: keyboardAssetService, button: "Manage Keyboard", path: "/peripherals/keyboard" },
  { key: "combo", title: "Combo", color: "yellow", icon: Layers, service: comboAssetService, button: "Manage Combo", path: "/peripherals/combo" },
  { key: "webcam", title: "Webcam", color: "green", icon: Camera, service: webcamAssetService, button: "Manage Webcam", path: "/peripherals/webcam" },
  { key: "headphone", title: "Headphone", color: "blue", icon: Headphones, service: headphoneAssetService, button: "Manage Headphone", path: "/peripherals/headphone" },
  { key: "multiportUsb", title: "Multiport USB", color: "red", icon: Usb, service: multiportUsbAssetService, button: "Manage Multiport USB", path: "/peripherals/multiport-usb" },
  { key: "hubAdaptor", title: "Hub/ Adaptor", color: "yellow", icon: Cable, service: hubAdaptorAssetService, button: "Manage Hub/ Adaptor", path: "/peripherals/hubadaptor" },
  { key: "hdmiPort", title: "HDMI Port", color: "green", icon: Plug, service: hdmiPortAssetService, button: "Manage HDMI Port", path: "/peripherals/hdmi-port" },
  { key: "msw", title: "Mouse Wireless", color: "blue", icon: MouseIcon, service: mswAssetService, button: "Manage MSW", path: "/peripherals/msw" },
  { key: "mouse", title: "Mouse", color: "red", icon: MouseIcon, service: mouseAssetService, button: "Manage Mouse", path: "/peripherals/mouse" },
];

function countInStore(items) {
  return items.filter((i) => (i.action || "").toUpperCase() === "IN STORE").length;
}

export default function Peripherals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(
    Object.fromEntries(CATEGORY_CONFIG.map((c) => [c.key, { total: 0, inStore: 0 }]))
  );

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const results = await Promise.all(CATEGORY_CONFIG.map((c) => c.service.list()));
      if (!isMounted) return;
      const next = {};
      results.forEach((items, idx) => {
        const key = CATEGORY_CONFIG[idx].key;
        next[key] = { total: items.length, inStore: countInStore(items) };
      });
      setStats(next);
    }
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = CATEGORY_CONFIG.map((cfg) => {
    const { total, inStore } = stats[cfg.key];
    return {
      key: cfg.key,
      title: cfg.title,
      total: `Total Stock: ${total} Units`,
      info1: `In Store: ${inStore} Units`,
      info2: `In Use: ${total - inStore} Units`,
      color: cfg.color,
      icon: cfg.icon,
      button: cfg.button,
      path: cfg.path,
    };
  });

  const keyword = search.toLowerCase();
  const filteredCards = categories.filter((item) =>
    item.title.toLowerCase().includes(keyword)
  );

  const peripheralsData = CATEGORY_CONFIG.map((cfg) => {
    const { total, inStore } = stats[cfg.key];
    return {
      label: cfg.title,
      percent: total === 0 ? 0 : Math.round((inStore / total) * 100),
      icon: cfg.icon,
    };
  });

  const filteredPeripherals = peripheralsData.filter((item) =>
    item.label.toLowerCase().includes(keyword)
  );

  const hasResult =
    filteredCards.length > 0 ||
    filteredPeripherals.length > 0;

  const getBarColor = (pct) => {
    if (pct <= 30) return "#E53935";
    if (pct <= 60) return "#FFD600";
    return "#32CD32";
  };

  return (
    <>
      <PageHeader search={search} onSearchChange={setSearch} placeholder="Search..." />
      {hasResult ? (
        <>
      <h1 className="peripherals-title">Peripherals & Accecories</h1>

      <div className="peripherals-grid">
        {filteredCards.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              className={`peripherals-card ${cat.color} stagger-item`}
              key={cat.key}
            >
              <div className="peripherals-header">
                <Icon size={26} />
                <h3>{cat.title}</h3>
              </div>

              <p>{cat.total}</p>
              <p>{cat.info1}</p>
              {cat.info2 && <p>{cat.info2}</p>}

              <button
                className="peripherals-btn"
                onClick={() => navigate(cat.path)}
              >
                {cat.button}
              </button>
            </div>
          );
        })}
      </div>
      <section className="section stagger-item">
        <h2 className="section-title">
          Peripherals Stock Availability Percentage
        </h2>

        <div className="bar-list">
          {filteredPeripherals.map((item) => (
            <div className="bar-row" key={item.label}>
              <div className="bar-label">
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>

              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${item.percent}%`,
                    background: getBarColor(item.percent),
                  }}
                />
              </div>

              <span
                className="bar-pct"
                style={{
                  color: getBarColor(item.percent),
                }}
              >
                {item.percent}%
              </span>
            </div>
          ))}
        </div>
    </section>
      </>
    ) : (
      <NotFoundState />
    )}
    </>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tablet as TabletIcon, Cast as CastIcon, Printer as PrinterIcon, BatteryCharging } from "lucide-react";
import "../styles/deviceofficeoutput.css";
import "../styles/animations.css";
import PageHeader from "../components/PageHeader";
import NotFoundState from "../components/NotFoundState";
import { tabletAssetService } from "../services/tabletAssetService";
import { castAssetService } from "../services/castAssetService";
import { printerAssetService } from "../services/printerAssetService";
import { upsAssetService } from "../services/upsAssetService";

export default function DeviceOfficeOutput() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState({ tablet: 0, cast: 0, printer: 0, ups: 0 });
  const [inStore, setInStore] = useState({ tablet: 0, cast: 0, printer: 0, ups: 0 });

  function countInStore(items) {
    return items.filter((i) => (i.action || "").toUpperCase() === "IN STORE").length;
  }

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const [tablet, cast, printer, ups] = await Promise.all([
        tabletAssetService.list(),
        castAssetService.list(),
        printerAssetService.list(),
        upsAssetService.list(),
      ]);
      if (isMounted) {
        setCounts({
          tablet: tablet.length,
          cast: cast.length,
          printer: printer.length,
          ups: ups.length,
        });
        setInStore({
          tablet: countInStore(tablet),
          cast: countInStore(cast),
          printer: countInStore(printer),
          ups: countInStore(ups),
        });
      }
    }
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    {
      key: "tablet",
      title: "Tablet",
      total: `Total Stock: ${counts.tablet} Units`,
      info1: `In Store: ${inStore.tablet} Units`,
      info2: `In Use: ${counts.tablet - inStore.tablet} Units`,
      color: "red",
      icon: TabletIcon,
      button: "Manage Tablet",
      path: "/deviceofficeoutput/tablet",
    },
    {
      key: "cast",
      title: "Cast",
      total: `Total Stock: ${counts.cast} Units`,
      info1: `In Store: ${inStore.cast} Units`,
      info2: `In Use: ${counts.cast - inStore.cast} Units`,
      color: "yellow",
      icon: CastIcon,
      button: "Manage Cast",
      path: "/deviceofficeoutput/cast",
    },
    {
      key: "printer",
      title: "Printer",
      total: `Total Stock: ${counts.printer} Units`,
      info1: `In Store: ${inStore.printer} Units`,
      info2: `In Use: ${counts.printer - inStore.printer} Units`,
      color: "green",
      icon: PrinterIcon,
      button: "Manage Printer",
      path: "/deviceofficeoutput/printer",
    },
    {
      key: "ups",
      title: "Uninterruptible Power Supply (UPS)",
      total: `Total Stock: ${counts.ups} Units`,
      info1: `In Store: ${inStore.ups} Units`,
      info2: `In Use: ${counts.ups - inStore.ups} Units`,
      color: "blue",
      icon: BatteryCharging,
      button: "Manage UPS",
      path: "/deviceofficeoutput/ups",
    },
  ];

  const keyword = search.toLowerCase();
  const filteredCards = categories.filter((item) =>
    item.title.toLowerCase().includes(keyword)
  );

  function pct(total, used) {
    return total === 0 ? 0 : Math.round((used / total) * 100);
  }

  const deviceData = [
    {
      label: "Tablet",
      percent: pct(counts.tablet, inStore.tablet),
      icon: TabletIcon,
    },
    {
      label: "Cast",
      percent: pct(counts.cast, inStore.cast),
      icon: CastIcon,
    },
    {
      label: "Printer",
      percent: pct(counts.printer, inStore.printer),
      icon: PrinterIcon,
    },
    {
      label: "Uninterruptible Power Supply",
      percent: pct(counts.ups, inStore.ups),
      icon: BatteryCharging,
    },
  ];

  const filteredDevice = deviceData.filter((item) =>
    item.label.toLowerCase().includes(keyword)
  );

  const hasResult =
    filteredCards.length > 0 ||
    filteredDevice.length > 0;

  const getBarColor = (pct) => {
    if (pct <= 30) return "#E53935";
    if (pct <= 60) return "#FFD600";
    return "#32CD32";
  };

  return (
    <>
      <PageHeader
        search={search}
        onSearchChange={setSearch}
        placeholder="Search..."
      />
      {hasResult ? (
        <>
      <h1 className="device-title">Device & Office Output</h1>

      <div className="device-overview-grid">
        {filteredCards.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              className={`device-card ${cat.color} stagger-item`}
              key={cat.key}
            >
              <div className="device-card-header">
                <Icon size={26} />
                <h3>{cat.title}</h3>
              </div>

              <p>{cat.total}</p>
              <p>{cat.info1}</p>
              {cat.info2 && <p>{cat.info2}</p>}

              <button
                className="device-btn"
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
          Device & Office Output Stock Availability Percentage
        </h2>

        <div className="bar-list">
          {filteredDevice.map((item) => {
            const Icon = item.icon;

            return (
              <div className="bar-row" key={item.label}>
                <div className="bar-label">
                  <Icon size={18} />
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
            );
          })}
        </div>
    </section>
      </>
    ) : (
      <NotFoundState />
    )}
    </>
  );
}

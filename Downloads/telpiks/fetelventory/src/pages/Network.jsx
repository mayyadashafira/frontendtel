import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wifi, Network as NetworkIcon, Router } from "lucide-react";
import "../styles/network.css";
import PageHeader from "../components/PageHeader";
import NotFoundState from "../components/NotFoundState";
import { dongleWifiAssetService } from "../services/dongleWifiAssetService";
import { networkPortAssetService } from "../services/networkPortAssetService";
import { fortiSwitchAssetService } from "../services/fortiSwitchAssetService";

export default function Network() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState({
    donglewifi: 0,
    port: 0,
    fortiswitch: 0,
  });
  const [inStore, setInStore] = useState({
    donglewifi: 0,
    port: 0,
    fortiswitch: 0,
  });

  function countInStore(items) {
    return items.filter((i) => (i.action || "").toUpperCase() === "IN STORE").length;
  }

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const [dongle, port, forti] = await Promise.all([
        dongleWifiAssetService.list(),
        networkPortAssetService.list(),
        fortiSwitchAssetService.list(),
      ]);
      if (isMounted) {
        setCounts({
          donglewifi: dongle.length,
          port: port.length,
          fortiswitch: forti.length,
        });
        setInStore({
          donglewifi: countInStore(dongle),
          port: countInStore(port),
          fortiswitch: countInStore(forti),
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
      key: "donglewifi",
      title: "Dongle Wi-Fi",
      total: `Total Stock: ${counts.donglewifi} Units`,
      info1: `In Store: ${inStore.donglewifi} Units`,
      info2: `In Use: ${counts.donglewifi - inStore.donglewifi} Units`,
      icon: Wifi,
      path: "/network/donglewifi",
      button: "Manage Dongle Wi-Fi",
      color: "red",
    },
    {
      key: "port",
      title: "Port",
      total: `Total Stock: ${counts.port} Units`,
      info1: `In Store: ${inStore.port} Units`,
      info2: `In Use: ${counts.port - inStore.port} Units`,
      icon: NetworkIcon,
      path: "/network/port",
      button: "Manage Port",
      color: "yellow",
    },
    {
      key: "fortiswitch",
      title: "FortiSwitch",
      total: `Total Stock: ${counts.fortiswitch} Units`,
      info1: `In Store: ${inStore.fortiswitch} Units`,
      info2: `In Use: ${counts.fortiswitch - inStore.fortiswitch} Units`,
      icon: Router,
      path: "/network/fortiswitch",
      button: "Manage FortiSwitch",
      color: "blue",
    },
  ];
  const keyword = search.toLowerCase();
  const filteredCards = categories.filter((item) =>
    item.title.toLowerCase().includes(keyword)
  );

  function pct(total, used) {
    return total === 0 ? 0 : Math.round((used / total) * 100);
  }

  const networkData = [
    {
      label: "Dongle Wi-Fi",
      percent: pct(counts.donglewifi, inStore.donglewifi),
      icon: Wifi,
    },
    {
      label: "Port",
      percent: pct(counts.port, inStore.port),
      icon: NetworkIcon,
    },
    {
      label: "FortiSwitch",
      percent: pct(counts.fortiswitch, inStore.fortiswitch),
      icon: Router,
    },
  ];

  const filteredNetwork = networkData.filter((item) =>
    item.label.toLowerCase().includes(keyword)
  );

  const hasResult =
    filteredCards.length > 0 ||
    filteredNetwork.length > 0;

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
      <h1 className="dash-title">Network Infrastructure</h1>

      <div className="network-overview-grid">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              className={`network-card ${cat.color} stagger-item`}
              key={cat.key}
            >
              <div className="network-card-header">
                <Icon size={26} />
                <h3>{cat.title}</h3>
              </div>

              <p>{cat.total}</p>
              <p>{cat.info1}</p>
              <p>{cat.info2}</p>

              <button
                className="network-btn"
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
          Network Infrastructure Stock Availability Percentage
        </h2>

        <div className="bar-list">
          {networkData.map((item) => {
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

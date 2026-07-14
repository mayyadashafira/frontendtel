import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MemoryStick, BatteryCharging } from "lucide-react";
import "../styles/hardware.css";
import PageHeader from "../components/PageHeader";
import NotFoundState from "../components/NotFoundState";
import { ramAssetService } from "../services/ramAssetService";
import { batteryAssetService } from "../services/batteryAssetService";

export default function Hardware() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [ramCount, setRamCount] = useState(0);
  const [batteryCount, setBatteryCount] = useState(0);
  const [ramInStore, setRamInStore] = useState(0);
  const [batteryInStore, setBatteryInStore] = useState(0);

  function countInStore(items) {
    return items.filter((i) => (i.action || "").toUpperCase() === "IN STORE").length;
  }

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const [ramData, batteryData] = await Promise.all([
        ramAssetService.list(),
        batteryAssetService.list(),
      ]);
      if (isMounted) {
        setRamCount(ramData.length);
        setBatteryCount(batteryData.length);
        setRamInStore(countInStore(ramData));
        setBatteryInStore(countInStore(batteryData));
      }
    }
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const hardwareCards = [
    {
      title: "Random Access Memory (RAM)",
      total: `Total Stock : ${ramCount} Units`,
      info1: `In Store: ${ramInStore} Units`,
      info2: `In Use: ${ramCount - ramInStore} Units`,
      color: "blue",
      button: "Manage RAM",
      path: "/hardware/ram",
      icon: MemoryStick,
    },
    {
      title: "Battery NB",
      total: `Total Stock : ${batteryCount} Units`,
      info1: `In Store: ${batteryInStore} Units`,
      info2: `In Use: ${batteryCount - batteryInStore} Units`,
      color: "yellow",
      button: "Manage Battery",
      path: "/hardware/battery",
      icon: BatteryCharging,
    },
  ];

  const keyword = search.toLowerCase();
  const filteredCards = hardwareCards.filter((item) =>
    item.title.toLowerCase().includes(keyword)
  );

  const hardwareData = [
    {
      label: "Random Access Memory (RAM)",
      percent: ramCount === 0 ? 0 : Math.round((ramInStore / ramCount) * 100),
      icon: MemoryStick,
    },
    {
      label: "Battery NB",
      percent: batteryCount === 0 ? 0 : Math.round((batteryInStore / batteryCount) * 100),
      icon: BatteryCharging,
    },
  ];

  const filteredHardware = hardwareData.filter((item) =>
    item.label.toLowerCase().includes(keyword)
  );

  const hasResult =
    filteredCards.length > 0 ||
    filteredHardware.length > 0;

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
      <h1 className="dash-title">Hardware & Component</h1>
      <div className="hw-overview-grid">
        {filteredCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              className={`hw-card hw-card-${card.color} stagger-item`}
              key={card.title}
            >
              <div className="hw-card-header">
                <Icon size={26} />
                <h3>{card.title}</h3>
              </div>

              <p>{card.total}</p>
              <p>{card.info1}</p>
              {card.info2 && <p>{card.info2}</p>}

              <button
                className="hw-btn"
                onClick={() => navigate(card.path)}
              >
                {card.button}
              </button>
            </div>
          );
        })}
      </div>
      <section className="section stagger-item">
        <h2 className="section-title">
          Hardware & Components Stock Availability Percentage
        </h2>

        <div className="bar-list">
          {filteredHardware.map((item) => {
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

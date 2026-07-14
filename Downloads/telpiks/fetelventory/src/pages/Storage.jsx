import "../styles/storage.css";
import "../styles/animations.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { HardDrive, Usb, Disc3 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import NotFoundState from "../components/NotFoundState";
import { ssdAssetService } from "../services/ssdAssetService";
import { hddAssetService } from "../services/hddAssetService";
import { flashdiskAssetService } from "../services/flashdiskAssetService";

export default function Storage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState({
    ssd: 0,
    hdd: 0,
    flashdisk: 0,
  });
  const [percents, setPercents] = useState({
    ssd: 0,
    hdd: 0,
    flashdisk: 0,
  });

  function availabilityPercent(items) {
    if (!items.length) return 0;
    const inStore = items.filter((i) => (i.action || "").toUpperCase() === "IN STORE").length;
    return Math.round((inStore / items.length) * 100);
  }

  useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      const [ssd, hdd, flashdisk] = await Promise.all([
        ssdAssetService.list(),
        hddAssetService.list(),
        flashdiskAssetService.list(),
      ]);
      if (isMounted) {
        setCounts({
          ssd: ssd.length,
          hdd: hdd.length,
          flashdisk: flashdisk.length,
        });
        setPercents({
          ssd: availabilityPercent(ssd),
          hdd: availabilityPercent(hdd),
          flashdisk: availabilityPercent(flashdisk),
        });
      }
    }
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  // percents.* sekarang berisi % In Store (availability), bukan % In Use.
  function inStoreCount(total, pct) {
    return Math.round((total * pct) / 100);
  }

  const storageCards = [
    {
      title: "Solid State Drive (SSD)",
      total: `Total Stock: ${counts.ssd} Units`,
      info1: `In Store: ${inStoreCount(counts.ssd, percents.ssd)} Units`,
      info2: `In Use: ${counts.ssd - inStoreCount(counts.ssd, percents.ssd)} Units`,
      color: "red",
      button: "Manage SSD",
      path: "/storage/ssd",
      icon: Disc3,
    },
    {
      title: "HDD/ NAS",
      total: `Total Stock: ${counts.hdd} Units`,
      info1: `In Store: ${inStoreCount(counts.hdd, percents.hdd)} Units`,
      info2: `In Use: ${counts.hdd - inStoreCount(counts.hdd, percents.hdd)} Units`,
      color: "yellow",
      button: "Manage Storage",
      // "HDD/ NAS" adalah tingkat sub_category — di dalamnya masih ada
      // 2 turunan (sub_sub): unit fisik & HDD Health. Jadi arahnya ke
      // halaman hub dulu, bukan langsung ke daftar unit.
      path: "/storage/hdd",
      icon: HardDrive,
    },
    {
      title: "Flashdisk",
      total: `Total Stock: ${counts.flashdisk} Units`,
      info1: `Available: ${inStoreCount(counts.flashdisk, percents.flashdisk)} Units`,
      info2: "",
      color: "green",
      button: "Manage Flashdisk",
      path: "/storage/flashdisk",
      icon: Usb,
    },
  ];

  const storageData = [
    {
      label: "Solid State Drive (SSD)",
      percent: percents.ssd,
      icon: Disc3,
    },
    {
      label: "HDD/ NAS",
      percent: percents.hdd,
      icon: HardDrive,
    },
    {
      label: "Flashdisk",
      percent: percents.flashdisk,
      icon: Usb,
    },
  ];

  const getBarColor = (pct) => {
    if (pct <= 30) return "#E53935";
    if (pct <= 60) return "#FFD600";
    return "#32CD32";
  };

  const keyword = search.toLowerCase();
  const filteredCards = storageCards.filter((item) =>
    item.title.toLowerCase().includes(keyword)
  );
  const filteredStorage = storageData.filter((item) =>
    item.label.toLowerCase().includes(keyword)
  );
  const hasResult = filteredCards.length > 0 || filteredStorage.length > 0;

  return (
    <>
      <PageHeader search={search} onSearchChange={setSearch} />

      {hasResult ? (
        <>
          <h1 className="dash-title">Storage Management</h1>

          <div className="storage-overview-grid">
            {filteredCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  className={`storage-card ${card.color} stagger-item`}
                  key={card.title}
                >
                  <div className="storage-card-header">
                    <Icon size={26} />
                    <h3>{card.title}</h3>
                  </div>

                  <p>{card.total}</p>
                  <p>{card.info1}</p>
                  {card.info2 && <p>{card.info2}</p>}

                  <button className="storage-btn" onClick={() => navigate(card.path)}>
                    {card.button}
                  </button>
                </div>
              );
            })}
          </div>

          <section className="section stagger-item">
            <h2 className="section-title">Storage Management Stock Availability Percentage</h2>

            <div className="bar-list">
              {filteredStorage.map((item) => {
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
                      style={{ color: getBarColor(item.percent) }}
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

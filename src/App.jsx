import React, { useState } from "react";
import {
  Sprout,
  LayoutDashboard,
  Wheat,
  ScanSearch,
  Droplets,
  CloudSun,
  ChartNoAxesCombined,
  Store,
  MapPinned,
  Bot,
  Bell,
  Settings,
  UserRound,
  Search,
  ChevronDown,
  Menu,
  X,
  Sun,
  CloudRain,
  Wind,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CalendarDays,
  Clock3,
  Leaf,
  ThermometerSun,
  CloudLightning,
  CircleHelp,
  Plus,
  MoreHorizontal,
  MapPin,
  CheckCircle2,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Crop Advisory", icon: Wheat },
  { label: "Disease Detection", icon: ScanSearch },
  { label: "Smart Irrigation", icon: Droplets },
  { label: "Weather & Risk", icon: CloudSun },
  { label: "Yield & Profit", icon: ChartNoAxesCombined },
  { label: "Market Prices", icon: Store },
  { label: "Soil & Satellite", icon: MapPinned },
  { label: "AI Farming Assistant", icon: Bot },
  { label: "Notifications", icon: Bell, count: 3 },
];

const weather = [
  { day: "Today", icon: Sun, temp: "31°", condition: "Sunny" },
  { day: "Tue", icon: CloudSun, temp: "29°", condition: "Partly cloudy" },
  { day: "Wed", icon: CloudRain, temp: "27°", condition: "Light rain" },
  { day: "Thu", icon: CloudRain, temp: "26°", condition: "Rain" },
  { day: "Fri", icon: Sun, temp: "30°", condition: "Sunny" },
];

const alerts = [
  {
    type: "warning",
    title: "Irrigation recommended",
    detail:
      "Soil moisture is below the preferred range for your selected crop.",
    time: "Today · 9:15 AM",
  },
  {
    type: "info",
    title: "Rain expected tomorrow",
    detail: "Check your irrigation schedule to avoid unnecessary watering.",
    time: "Today · 8:30 AM",
  },
  {
    type: "success",
    title: "Crop health check",
    detail: "Your latest crop health observation is marked as healthy.",
    time: "Yesterday · 5:40 PM",
  },
];

function Sidebar({ active, setActive, open, close }) {
  return (
    <>
      {open && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={close}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Sprout size={25} strokeWidth={2.3} />
          </div>
          <div>
            <div className="brand-name">AgriGuard</div>
            <div className="brand-caption">SMART FARMING PLATFORM</div>
          </div>
          <button
            className="icon-button close-menu"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon, count }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                setActive(label);
                close();
              }}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
            <div>
              <strong>Need a hand?</strong>
              <p>Visit the farmer help center.</p>
            </div>
            <ArrowUpRight size={15} className="help-arrow" />
          </div>
          <button className="nav-item secondary-nav">
            <Settings size={19} />
            <span>Settings</span>
          </button>
          <button className="profile-mini">
            <div className="avatar">RK</div>
            <div className="profile-copy">
              <strong>Rajesh Kumar</strong>
              <span>Farmer account</span>
            </div>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, unit, note, trend, tone }) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <div className={`metric-icon ${tone}`}>
          <Icon size={19} />
        </div>
        <span
          className={`trend ${trend?.startsWith("+") ? "trend-up" : "trend-neutral"}`}
        >
          {trend}
        </span>
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

function WeatherCard() {
  return (
    <section className="panel weather-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">LOCAL CONDITIONS</div>
          <h2>Weather forecast</h2>
        </div>
        <button className="text-link">
          7-day forecast <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="weather-current">
        <div className="weather-main">
          <Sun size={39} />
          <div>
            <strong>31°C</strong>
            <span>Mostly sunny</span>
          </div>
        </div>
        <div className="weather-details">
          <div>
            <Droplets size={16} />
            <span>Humidity</span>
            <strong>62%</strong>
          </div>
          <div>
            <Wind size={16} />
            <span>Wind</span>
            <strong>12 km/h</strong>
          </div>
          <div>
            <CloudRain size={16} />
            <span>Rain chance</span>
            <strong>20%</strong>
          </div>
        </div>
      </div>
      <div className="forecast-row">
        {weather.map(({ day, icon: Icon, temp, condition }) => (
          <div className="forecast-day" key={day}>
            <span>{day}</span>
            <Icon size={21} />
            <strong>{temp}</strong>
            <small>{condition}</small>
          </div>
        ))}
      </div>
      <div className="weather-foot">
        <MapPin size={14} /> Weather data for your farm location <span>·</span>{" "}
        Demo preview
      </div>
    </section>
  );
}

function FarmStatus() {
  return (
    <section className="panel farm-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">YOUR FARM</div>
          <h2>Farm overview</h2>
        </div>
        <button className="icon-button">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="farm-visual">
        <div className="farm-visual-overlay">
          <span className="farm-tag">
            <Leaf size={13} /> Farm status
          </span>
          <strong>Looking healthy</strong>
          <span>Based on the latest recorded observations</span>
        </div>
      </div>
      <div className="farm-facts">
        <div>
          <span>Farm location</span>
          <strong>
            <MapPin size={14} /> Nashik, Maharashtra
          </strong>
        </div>
        <div>
          <span>Total farm area</span>
          <strong>4.5 acres</strong>
        </div>
        <div>
          <span>Current crop</span>
          <strong>Wheat</strong>
        </div>
        <div>
          <span>Growing stage</span>
          <strong>Vegetative</strong>
        </div>
      </div>
      <button className="outline-button">
        View farm details <ArrowUpRight size={15} />
      </button>
    </section>
  );
}

function RecommendationCard() {
  return (
    <section className="recommendation">
      <div className="recommendation-symbol">
        <Sprout size={22} />
      </div>
      <div className="recommendation-content">
        <div className="recommendation-kicker">AGRI-GUARD RECOMMENDATION</div>
        <h3>Review your irrigation schedule</h3>
        <p>
          Check soil moisture before the next watering cycle. Rain is possible
          in the coming days, so adjust irrigation based on actual field
          conditions.
        </p>
        <button className="recommendation-link">
          View irrigation guidance <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="recommendation-art">
        <Sprout size={88} strokeWidth={1} />
      </div>
    </section>
  );
}

function AlertsPanel() {
  return (
    <section className="panel alerts-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">STAY INFORMED</div>
          <h2>Recent alerts</h2>
        </div>
        <button className="text-link">
          View all <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="alert-list">
        {alerts.map((alert, index) => (
          <div className="alert-row" key={alert.title}>
            <div className={`alert-symbol ${alert.type}`}>
              {alert.type === "warning" ? (
                <AlertTriangle size={17} />
              ) : alert.type === "success" ? (
                <CheckCircle2 size={17} />
              ) : (
                <CloudRain size={17} />
              )}
            </div>
            <div className="alert-copy">
              <strong>{alert.title}</strong>
              <p>{alert.detail}</p>
              <span>
                <Clock3 size={12} /> {alert.time}
              </span>
            </div>
            {index === 0 && <span className="new-dot" />}
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketPanel() {
  const prices = [
    {
      crop: "Wheat",
      market: "Nashik APMC",
      price: "₹2,425",
      change: "+1.8%",
      up: true,
    },
    {
      crop: "Onion",
      market: "Lasalgaon APMC",
      price: "₹1,850",
      change: "-0.6%",
      up: false,
    },
    {
      crop: "Soybean",
      market: "Nashik APMC",
      price: "₹4,620",
      change: "+0.9%",
      up: true,
    },
  ];
  return (
    <section className="panel market-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">MARKET SNAPSHOT</div>
          <h2>Nearby mandi prices</h2>
        </div>
        <button className="text-link">
          Explore market <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="market-table">
        {prices.map((item) => (
          <div className="market-row" key={item.crop}>
            <div className="crop-badge">
              <Wheat size={17} />
            </div>
            <div className="market-crop">
              <strong>{item.crop}</strong>
              <span>{item.market}</span>
            </div>
            <div className="market-price">
              <strong>{item.price}</strong>
              <span className={item.up ? "price-up" : "price-down"}>
                {item.up ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="data-note">
        Illustrative values · Connect a verified mandi data source for live
        prices.
      </div>
    </section>
  );
}

function PlaceholderPage({ title }) {
  const selected = navigation.find((item) => item.label === title);
  const Icon = selected?.icon || Sprout;
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Icon size={28} />
      </div>
      <div className="eyebrow">AGRIGUARD WORKSPACE</div>
      <h1>{title}</h1>
      <p>
        This section is ready for its feature module and backend integration.
      </p>
      <div className="placeholder-note">
        <CircleHelp size={17} /> Connect the relevant API or model to display
        live, farm-specific information here.
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        open={menuOpen}
        close={() => setMenuOpen(false)}
      />
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <div className="breadcrumb">
              Workspace <span>/</span> <strong>{active}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="date-chip">
              <CalendarDays size={15} /> Monday, 09 November 2026
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>
            <button className="top-profile">
              <div className="avatar">RK</div>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        {active === "Dashboard" ? (
          <div className="page-content">
            <section className="welcome-row">
              <div>
                <div className="welcome-kicker">
                  <span className="live-dot" /> YOUR FARM AT A GLANCE
                </div>
                <h1>
                  Good morning, Rajesh <span>🌱</span>
                </h1>
                <p>
                  Here's what's happening on your farm today. Let's grow
                  smarter.
                </p>
              </div>
              <button className="farm-selector">
                <MapPin size={16} />
                <span>
                  <small>SELECTED FARM</small>
                  <strong>My Farm · Nashik</strong>
                </span>
                <ChevronDown size={16} />
              </button>
            </section>

            <section className="metrics-grid">
              <MetricCard
                icon={ThermometerSun}
                label="Temperature"
                value="31"
                unit="°C"
                note="Feels like 33°C today"
                trend="Normal"
                tone="orange"
              />
              <MetricCard
                icon={Droplets}
                label="Soil moisture"
                value="28"
                unit="%"
                note="Check irrigation needs"
                trend="Needs attention"
                tone="blue"
              />
              <MetricCard
                icon={Leaf}
                label="Crop health"
                value="Good"
                unit=""
                note="Latest observation"
                trend="Healthy"
                tone="green"
              />
              <MetricCard
                icon={CloudLightning}
                label="Weather risk"
                value="Low"
                unit=""
                note="No severe alert currently"
                trend="Stable"
                tone="purple"
              />
            </section>

            <div className="content-grid top-content-grid">
              <WeatherCard />
              <FarmStatus />
            </div>

            <RecommendationCard />

            <div className="content-grid bottom-content-grid">
              <AlertsPanel />
              <MarketPanel />
            </div>

            <footer className="page-footer">
              <span>© 2026 AgriGuard · Climate-smart farming support</span>
              <span>
                <span className="footer-dot" /> Demo dashboard · Sample data
              </span>
            </footer>
          </div>
        ) : (
          <div className="page-content">
            <PlaceholderPage title={active} />
          </div>
        )}
      </main>
    </div>
  );
}

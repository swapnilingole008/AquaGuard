import React, { useState, useEffect } from "react";
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

import CropAdvisoryTab from "./components/CropAdvisoryTab";
import DiseaseDetectionTab from "./components/DiseaseDetectionTab";
import SmartIrrigationTab from "./components/SmartIrrigationTab";
import WeatherRiskTab from "./components/WeatherRiskTab";
import YieldProfitTab from "./components/YieldProfitTab";
import MarketPricesTab from "./components/MarketPricesTab";
import SoilSatelliteTab from "./components/SoilSatelliteTab";
import AIAssistantTab from "./components/AIAssistantTab";
import NotificationsTab from "./components/NotificationsTab";
import LanguageSelector from "./components/LanguageSelector";
import { useTranslation } from "./i18n";
import { api } from "./components/api";

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Tab rendering error:", error, info);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.active !== this.props.active && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="tab-container" style={{ padding: "28px" }}>
          <div className="alert-banner error-banner">
            <AlertTriangle size={20} />
            <div>
              <strong>Section Display Exception</strong>
              <p style={{ margin: "4px 0 0", fontSize: "12.5px" }}>
                {this.state.error?.message || "An unexpected error occurred while rendering this module."}
              </p>
            </div>
          </div>
          <button
            className="action-button primary-button"
            style={{ width: "220px", marginTop: "16px" }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry Loading Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const navItems = [
  { id: "Dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "Crop Advisory", labelKey: "nav.crop_advisory", icon: Wheat },
  { id: "Disease Detection", labelKey: "nav.disease_detection", icon: ScanSearch },
  { id: "Smart Irrigation", labelKey: "nav.smart_irrigation", icon: Droplets },
  { id: "Weather & Risk", labelKey: "nav.weather_risk", icon: CloudSun },
  { id: "Yield & Profit", labelKey: "nav.yield_profit", icon: ChartNoAxesCombined },
  { id: "Market Prices", labelKey: "nav.market_prices", icon: Store },
  { id: "Soil & Satellite", labelKey: "nav.soil_satellite", icon: MapPinned },
  { id: "AI Farming Assistant", labelKey: "nav.ai_assistant", icon: Bot },
  { id: "Notifications", labelKey: "nav.notifications", icon: Bell },
];

function Sidebar({ active, setActive, open, close, unreadCount }) {
  const { t } = useTranslation();

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
            <div className="brand-name">{t("common.brand_name")}</div>
            <div className="brand-caption">{t("common.brand_caption")}</div>
          </div>
          <button
            className="icon-button close-menu"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="workspace-label">{t("common.workspace")}</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ id, labelKey, icon: Icon }) => {
            const count = id === "Notifications" ? unreadCount : null;
            const label = t(labelKey);
            return (
              <button
                key={id}
                className={`nav-item ${active === id ? "active" : ""}`}
                onClick={() => {
                  setActive(id);
                  close();
                }}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{label}</span>
                {count > 0 && <span className="nav-count">{count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div
            className="help-card"
            onClick={() => {
              setActive("AI Farming Assistant");
              close();
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="help-icon">
              <CircleHelp size={18} />
            </div>
            <div>
              <strong>{t("common.need_hand")}</strong>
              <p>{t("common.ask_kisan_mitra")}</p>
            </div>
            <ArrowUpRight size={15} className="help-arrow" />
          </div>
          <button
            className="nav-item secondary-nav"
            onClick={() => {
              setActive("Weather & Risk");
              close();
            }}
          >
            <Settings size={19} />
            <span>{t("common.settings")}</span>
          </button>
          <button className="profile-mini">
            <div className="avatar">RK</div>
            <div className="profile-copy">
              <strong>{t("common.farmer_name")}</strong>
              <span>{t("common.farmer_account")}</span>
            </div>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>
    </>
  );
}

function MetricCard({ icon: Icon, label, value, unit, note, trend, tone, onClick }) {
  return (
    <article
      className="metric-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
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
        {unit && <span>{unit}</span>}
      </div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

function WeatherCard({ onNavigate, liveData }) {
  const { t } = useTranslation();
  const currentTemp = liveData?.current?.temperature_c ?? 31;
  const currentCondition = liveData?.current?.condition ?? t("dashboard.normal");
  const humidity = liveData?.current?.humidity_pct ?? 62;
  const wind = liveData?.current?.wind_speed_kmh ?? 12;
  const rainChance = liveData?.current?.rain_chance ?? 20;

  const defaultWeather = [
    { day: t("common.today"), icon: Sun, temp: "31°", condition: "Sunny" },
    { day: "Tue", icon: CloudSun, temp: "29°", condition: "Partly cloudy" },
    { day: "Wed", icon: CloudRain, temp: "27°", condition: "Light rain" },
    { day: "Thu", icon: CloudRain, temp: "26°", condition: "Rain" },
    { day: "Fri", icon: Sun, temp: "30°", condition: "Sunny" },
  ];

  return (
    <section className="panel weather-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">{t("dashboard.local_conditions")}</div>
          <h2>{t("dashboard.weather_forecast")}</h2>
        </div>
        <button className="text-link" onClick={() => onNavigate("Weather & Risk")}>
          {t("dashboard.seven_day_forecast")} <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="weather-current">
        <div className="weather-main">
          <Sun size={39} />
          <div>
            <strong>{currentTemp}°C</strong>
            <span>{currentCondition}</span>
          </div>
        </div>
        <div className="weather-details">
          <div>
            <Droplets size={16} />
            <span>{t("dashboard.humidity")}</span>
            <strong>{humidity}%</strong>
          </div>
          <div>
            <Wind size={16} />
            <span>{t("dashboard.wind")}</span>
            <strong>{wind} km/h</strong>
          </div>
          <div>
            <CloudRain size={16} />
            <span>{t("dashboard.rain_chance")}</span>
            <strong>{rainChance}%</strong>
          </div>
        </div>
      </div>
      <div className="forecast-row">
        {defaultWeather.map(({ day, icon: Icon, temp, condition }) => (
          <div
            className="forecast-day"
            key={day}
            onClick={() => onNavigate("Weather & Risk")}
            style={{ cursor: "pointer" }}
          >
            <span>{day}</span>
            <Icon size={21} />
            <strong>{temp}</strong>
            <small>{condition}</small>
          </div>
        ))}
      </div>
      <div className="weather-foot">
        <MapPin size={14} /> {t("dashboard.weather_foot")}
      </div>
    </section>
  );
}

function FarmStatus({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <section className="panel farm-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">{t("dashboard.your_farm")}</div>
          <h2>{t("dashboard.farm_overview")}</h2>
        </div>
        <button className="icon-button" onClick={() => onNavigate("Soil & Satellite")}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="farm-visual">
        <div className="farm-visual-overlay">
          <span className="farm-tag">
            <Leaf size={13} /> {t("dashboard.farm_status")}
          </span>
          <strong>{t("dashboard.looking_healthy")}</strong>
          <span>{t("dashboard.looking_healthy_desc")}</span>
        </div>
      </div>
      <div className="farm-facts">
        <div>
          <span>{t("dashboard.farm_location")}</span>
          <strong>
            <MapPin size={14} /> {t("dashboard.farm_location_val")}
          </strong>
        </div>
        <div>
          <span>{t("dashboard.total_area")}</span>
          <strong>4.5 {t("common.acres")}</strong>
        </div>
        <div>
          <span>{t("dashboard.current_crop")}</span>
          <strong>{t("dashboard.current_crop_val")}</strong>
        </div>
        <div>
          <span>{t("dashboard.growing_stage")}</span>
          <strong>{t("dashboard.growing_stage_val")}</strong>
        </div>
      </div>
      <button className="outline-button" onClick={() => onNavigate("Soil & Satellite")}>
        {t("dashboard.view_farm_details")} <ArrowUpRight size={15} />
      </button>
    </section>
  );
}

function RecommendationCard({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <section className="recommendation">
      <div className="recommendation-symbol">
        <Sprout size={22} />
      </div>
      <div className="recommendation-content">
        <div className="recommendation-kicker">{t("dashboard.recommendation_kicker")}</div>
        <h3>{t("dashboard.recommendation_title")}</h3>
        <p>{t("dashboard.recommendation_desc")}</p>
        <button
          className="recommendation-link"
          onClick={() => onNavigate("Smart Irrigation")}
        >
          {t("dashboard.recommendation_link")} <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="recommendation-art">
        <Sprout size={88} strokeWidth={1} />
      </div>
    </section>
  );
}

function AlertsPanel({ onNavigate, alerts }) {
  const { t } = useTranslation();

  const defaultAlerts = [
    {
      type: "warning",
      title: "Irrigation recommended",
      detail: "Soil moisture is below the preferred range for your selected crop.",
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

  const displayAlerts = alerts && alerts.length > 0 ? alerts.slice(0, 3) : defaultAlerts;

  return (
    <section className="panel alerts-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">{t("dashboard.stay_informed")}</div>
          <h2>{t("dashboard.recent_alerts")}</h2>
        </div>
        <button className="text-link" onClick={() => onNavigate("Notifications")}>
          {t("common.view_all")} <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="alert-list">
        {displayAlerts.map((alert, index) => (
          <div
            className="alert-row"
            key={index}
            onClick={() => onNavigate("Notifications")}
            style={{ cursor: "pointer" }}
          >
            <div className={`alert-symbol ${alert.type}`}>
              {alert.type === "warning" || alert.type === "danger" ? (
                <AlertTriangle size={17} />
              ) : alert.type === "success" ? (
                <CheckCircle2 size={17} />
              ) : (
                <CloudRain size={17} />
              )}
            </div>
            <div className="alert-copy">
              <strong>{alert.title}</strong>
              <p>{alert.detail || alert.message}</p>
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

function MarketPanel({ onNavigate }) {
  const { t } = useTranslation();

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
          <div className="eyebrow">{t("dashboard.market_snapshot")}</div>
          <h2>{t("dashboard.nearby_mandi")}</h2>
        </div>
        <button className="text-link" onClick={() => onNavigate("Market Prices")}>
          {t("dashboard.explore_market")} <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="market-table">
        {prices.map((item) => (
          <div
            className="market-row"
            key={item.crop}
            onClick={() => onNavigate("Market Prices")}
            style={{ cursor: "pointer" }}
          >
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
        {t("dashboard.mandi_data_note")}
      </div>
    </section>
  );
}

export default function App() {
  const { t, language } = useTranslation();
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);

  // Sync baseline live data on app load
  useEffect(() => {
    async function initData() {
      try {
        const wData = await api.getWeather("Nashik");
        if (wData) setLiveWeather(wData);
      } catch (e) {
        // Fallback gracefully to default weather
      }

      try {
        const nData = await api.getNotifications();
        if (nData?.notifications) {
          setLiveAlerts(nData.notifications);
          setUnreadCount(nData.unread_count ?? nData.notifications.length);
        }
      } catch (e) {
        // Fallback to default alerts
      }
    }
    initData();
  }, []);

  const currentTab = navItems.find((n) => n.id === active);
  const activeLabel = currentTab ? t(currentTab.labelKey) : active;

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        open={menuOpen}
        close={() => setMenuOpen(false)}
        unreadCount={unreadCount}
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
              {t("common.workspace")} <span>/</span> <strong>{activeLabel}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            {/* Multilingual Selector */}
            <LanguageSelector />

            <div className="date-chip">
              <CalendarDays size={15} /> Monday, 09 November 2026
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setActive("Notifications")}
            >
              <Bell size={19} />
              {unreadCount > 0 && <i />}
            </button>
            <button className="top-profile" onClick={() => setActive("Soil & Satellite")}>
              <div className="avatar">RK</div>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        {/* Tab Route Switching */}
        <TabErrorBoundary active={active}>
        {active === "Dashboard" && (
          <div className="page-content">
            <section className="welcome-row">
              <div>
                <div className="welcome-kicker">
                  <span className="live-dot" /> {t("dashboard.glance_eyebrow")}
                </div>
                <h1>
                  {t("dashboard.greeting")} <span>🌱</span>
                </h1>
                <p>{t("dashboard.subtitle")}</p>
              </div>
              <button
                className="farm-selector"
                onClick={() => setActive("Soil & Satellite")}
              >
                <MapPin size={16} />
                <span>
                  <small>{t("common.selected_farm")}</small>
                  <strong>My Farm · Nashik</strong>
                </span>
                <ChevronDown size={16} />
              </button>
            </section>

            <section className="metrics-grid">
              <MetricCard
                icon={ThermometerSun}
                label={t("dashboard.temp_label")}
                value={liveWeather?.current?.temperature_c ?? "31"}
                unit="°C"
                note={t("dashboard.temp_note")}
                trend={t("common.normal")}
                tone="orange"
                onClick={() => setActive("Weather & Risk")}
              />
              <MetricCard
                icon={Droplets}
                label={t("dashboard.soil_moisture_label")}
                value="28"
                unit="%"
                note={t("dashboard.soil_moisture_note")}
                trend={t("common.attention")}
                tone="blue"
                onClick={() => setActive("Smart Irrigation")}
              />
              <MetricCard
                icon={Leaf}
                label={t("dashboard.crop_health_label")}
                value={t("dashboard.crop_health_val")}
                unit=""
                note={t("dashboard.crop_health_note")}
                trend={t("common.healthy")}
                tone="green"
                onClick={() => setActive("Disease Detection")}
              />
              <MetricCard
                icon={CloudLightning}
                label={t("dashboard.weather_risk_label")}
                value={t("dashboard.weather_risk_val")}
                unit=""
                note={t("dashboard.weather_risk_note")}
                trend={t("common.stable")}
                tone="purple"
                onClick={() => setActive("Weather & Risk")}
              />
            </section>

            <div className="content-grid top-content-grid">
              <WeatherCard onNavigate={setActive} liveData={liveWeather} />
              <FarmStatus onNavigate={setActive} />
            </div>

            <RecommendationCard onNavigate={setActive} />

            <div className="content-grid bottom-content-grid">
              <AlertsPanel onNavigate={setActive} alerts={liveAlerts} />
              <MarketPanel onNavigate={setActive} />
            </div>

            <footer className="page-footer">
              <span>{t("common.footer_rights")}</span>
              <span>
                <span className="footer-dot" /> {t("common.demo_dashboard")}
              </span>
            </footer>
          </div>
        )}

        {active === "Crop Advisory" && (
          <div className="page-content">
            <CropAdvisoryTab />
          </div>
        )}

        {active === "Disease Detection" && (
          <div className="page-content">
            <DiseaseDetectionTab />
          </div>
        )}

        {active === "Smart Irrigation" && (
          <div className="page-content">
            <SmartIrrigationTab />
          </div>
        )}

        {active === "Weather & Risk" && (
          <div className="page-content">
            <WeatherRiskTab />
          </div>
        )}

        {active === "Yield & Profit" && (
          <div className="page-content">
            <YieldProfitTab />
          </div>
        )}

        {active === "Market Prices" && (
          <div className="page-content">
            <MarketPricesTab />
          </div>
        )}

        {active === "Soil & Satellite" && (
          <div className="page-content">
            <SoilSatelliteTab />
          </div>
        )}

        {active === "AI Farming Assistant" && (
          <div className="page-content">
            <AIAssistantTab />
          </div>
        )}

        {active === "Notifications" && (
          <div className="page-content">
            <NotificationsTab />
          </div>
        )}
        </TabErrorBoundary>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Droplets,
  Store,
  RefreshCw,
  Clock,
  Check
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

export default function NotificationsTab() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNotifications();
      if (data && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      setError(err.message || "Failed to load active notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const filteredList = notifications.filter((item) => {
    if (filter === "unread") return item.unread;
    if (filter === "warnings") return item.type === "warning" || item.type === "danger";
    if (filter === "irrigation") return item.category === "Irrigation";
    if (filter === "weather") return item.category === "Weather";
    return true;
  });

  const getCategoryIcon = (category, type) => {
    if (type === "danger" || type === "warning") {
      return <AlertTriangle size={18} />;
    }
    switch (category) {
      case "Irrigation":
        return <Droplets size={18} />;
      case "Weather":
        return <CloudRain size={18} />;
      case "Market Opportunity":
        return <Store size={18} />;
      default:
        return <CheckCircle2 size={18} />;
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="tab-container">
      <div className="tab-header notifications-header">
        <div>
          <div className="eyebrow">{t("notifications.eyebrow")}</div>
          <h1>{t("notifications.title")}</h1>
          <p>{t("notifications.desc")}</p>
        </div>
        <div className="notification-actions">
          <button
            type="button"
            className="outline-button"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spinner" : ""} /> {t("common.refresh")}
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="outline-button mark-all-read-btn"
              onClick={markAllAsRead}
            >
              <Check size={15} /> {t("notifications.mark_all_read")}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notification-filter-bar">
        <button
          className={`filter-chip ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          {t("notifications.all_alerts")} ({notifications.length})
        </button>
        <button
          className={`filter-chip ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          {t("notifications.unread")} ({unreadCount})
        </button>
        <button
          className={`filter-chip ${filter === "warnings" ? "active" : ""}`}
          onClick={() => setFilter("warnings")}
        >
          {t("notifications.warnings_critical")}
        </button>
        <button
          className={`filter-chip ${filter === "irrigation" ? "active" : ""}`}
          onClick={() => setFilter("irrigation")}
        >
          {t("notifications.irrigation")}
        </button>
        <button
          className={`filter-chip ${filter === "weather" ? "active" : ""}`}
          onClick={() => setFilter("weather")}
        >
          {t("notifications.weather")}
        </button>
      </div>

      {error && (
        <div className="alert-banner error-banner">
          <AlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      {loading && notifications.length === 0 ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spinner" />
          <h3>Aggregating Active Alerts...</h3>
          <p>Scanning sensor thresholds and agronomic risk status.</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="empty-state">
          <CheckCircle2 size={42} strokeWidth={1.3} className="empty-icon text-green" />
          <h3>{t("notifications.empty_title")}</h3>
          <p>{t("notifications.empty_desc")}</p>
        </div>
      ) : (
        <div className="notifications-feed">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className={`notification-feed-item ${item.type} ${item.unread ? "unread-item" : ""}`}
              onClick={() => toggleRead(item.id)}
            >
              <div className={`feed-item-icon ${item.type}`}>
                {getCategoryIcon(item.category, item.type)}
              </div>

              <div className="feed-item-content">
                <div className="feed-item-top">
                  <div className="feed-item-title-row">
                    <span className="feed-category-tag">{item.category}</span>
                    <strong className="feed-title">{item.title}</strong>
                    {item.unread && <span className="feed-unread-dot" />}
                  </div>
                  <div className="feed-time">
                    <Clock size={12} />
                    <span>{item.time}</span>
                  </div>
                </div>

                <p className="feed-message">{item.message}</p>

                {item.action_required && (
                  <div className="feed-action-box">
                    <span className="action-tag">{t("notifications.action_recommended")}</span>
                    <p>{item.action_required}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

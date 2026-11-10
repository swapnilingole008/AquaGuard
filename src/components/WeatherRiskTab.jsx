import React, { useState, useEffect } from "react";
import {
  CloudSun,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Wind,
  Droplets,
  ThermometerSun,
  CloudRain,
  Flame,
  CheckCircle2,
  AlertCircle,
  MapPin,
  ShieldCheck
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

export default function WeatherRiskTab() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    location: "Nashik, Maharashtra",
    temperature_c: 31,
    rainfall_mm_24h: 0,
    humidity_pct: 62,
    soil_moisture_pct: 28,
    wind_speed_kmh: 12,
    consecutive_dry_days: 14,
    crop: "Wheat"
  });

  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLiveWeather();
    runRiskAssessment({
      location: "Nashik, Maharashtra",
      temperature_c: 31,
      rainfall_mm_24h: 0,
      humidity_pct: 62,
      soil_moisture_pct: 28,
      wind_speed_kmh: 12,
      consecutive_dry_days: 14,
      crop: "Wheat"
    });
  }, []);

  const fetchLiveWeather = async () => {
    setWeatherLoading(true);
    try {
      const data = await api.getWeather("Nashik");
      setLiveWeather(data);
      if (data.current) {
        setFormData((prev) => ({
          ...prev,
          temperature_c: data.current.temperature_c ?? prev.temperature_c,
          humidity_pct: data.current.humidity_pct ?? prev.humidity_pct,
          wind_speed_kmh: data.current.wind_speed_kmh ?? prev.wind_speed_kmh,
          rainfall_mm_24h: data.current.rain_chance > 60 ? 15 : 0
        }));
      }
    } catch (e) {
      console.warn("Live weather fetch fallback:", e);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value
    }));
  };

  const runRiskAssessment = async (overrideData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.analyzeRisk(overrideData || formData);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to analyze agricultural risk.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runRiskAssessment();
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "risk-critical";
      case "high":
        return "risk-high";
      case "moderate":
        return "risk-moderate";
      default:
        return "risk-low";
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("risk.eyebrow")}</div>
        <h1>{t("risk.title")}</h1>
        <p>{t("risk.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Panel */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("risk.eyebrow")}</div>
              <h2>{t("risk.inputs_title")}</h2>
            </div>
            <button
              type="button"
              className="sync-weather-btn"
              onClick={fetchLiveWeather}
              title="Sync with local weather API"
            >
              <RefreshCw size={14} className={weatherLoading ? "spinner" : ""} /> {t("risk.sync_weather")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="feature-form">
            <div className="form-row">
              <div className="form-group">
                <label>Farm Location</label>
                <div className="input-with-icon">
                  <MapPin size={16} />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t("risk.target_crop")}</label>
                <select name="crop" value={formData.crop} onChange={handleChange}>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Tomato">Tomato / Horticulture</option>
                  <option value="Tea">Tea</option>
                  <option value="Rubber">Rubber</option>
                  <option value="Cinnamon">Cinnamon</option>
                </select>
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("risk.temperature")}</label>
                <input
                  type="number"
                  name="temperature_c"
                  value={formData.temperature_c}
                  onChange={handleChange}
                  min="-5"
                  max="55"
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("risk.humidity")}</label>
                <input
                  type="number"
                  name="humidity_pct"
                  value={formData.humidity_pct}
                  onChange={handleChange}
                  min="5"
                  max="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("risk.wind_speed")}</label>
                <input
                  type="number"
                  name="wind_speed_kmh"
                  value={formData.wind_speed_kmh}
                  onChange={handleChange}
                  min="0"
                  max="140"
                  required
                />
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("risk.rainfall_24h")}</label>
                <input
                  type="number"
                  name="rainfall_mm_24h"
                  value={formData.rainfall_mm_24h}
                  onChange={handleChange}
                  min="0"
                  max="500"
                  step="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("risk.soil_moisture")}</label>
                <input
                  type="number"
                  name="soil_moisture_pct"
                  value={formData.soil_moisture_pct}
                  onChange={handleChange}
                  min="5"
                  max="70"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("risk.dry_days")}</label>
                <input
                  type="number"
                  name="consecutive_dry_days"
                  value={formData.consecutive_dry_days}
                  onChange={handleChange}
                  min="0"
                  max="120"
                  required
                />
              </div>
            </div>

            {/* Quick Test Scenarios */}
            <div className="scenario-presets">
              <span className="field-label">{t("risk.test_stress")}</span>
              <div className="scenario-buttons">
                <button
                  type="button"
                  className="scenario-btn"
                  onClick={() => {
                    const heatData = {
                      ...formData,
                      temperature_c: 42.5,
                      humidity_pct: 22,
                      rainfall_mm_24h: 0,
                      soil_moisture_pct: 16,
                      consecutive_dry_days: 21
                    };
                    setFormData(heatData);
                    runRiskAssessment(heatData);
                  }}
                >
                  {t("risk.heatwave_drought")}
                </button>
                <button
                  type="button"
                  className="scenario-btn"
                  onClick={() => {
                    const floodData = {
                      ...formData,
                      temperature_c: 24,
                      humidity_pct: 95,
                      rainfall_mm_24h: 110,
                      soil_moisture_pct: 55,
                      wind_speed_kmh: 42,
                      consecutive_dry_days: 0
                    };
                    setFormData(floodData);
                    runRiskAssessment(floodData);
                  }}
                >
                  {t("risk.flood_storm")}
                </button>
                <button
                  type="button"
                  className="scenario-btn"
                  onClick={() => {
                    const optimalData = {
                      ...formData,
                      temperature_c: 26,
                      humidity_pct: 60,
                      rainfall_mm_24h: 10,
                      soil_moisture_pct: 35,
                      wind_speed_kmh: 10,
                      consecutive_dry_days: 2
                    };
                    setFormData(optimalData);
                    runRiskAssessment(optimalData);
                  }}
                >
                  {t("risk.optimal_cond")}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-banner error-banner">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="action-button primary-button full-width"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spinner" /> {t("risk.btn_loading")}
                </>
              ) : (
                <>
                  <ShieldAlert size={18} /> {t("risk.btn_submit")}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("risk.eyebrow")}</div>
              <h2>{t("risk.results_title")}</h2>
            </div>
            {result && (
              <span className={`status-pill ${getRiskColor(result.overall_risk_level)}`}>
                Overall: {result.overall_risk_level}
              </span>
            )}
          </div>

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("risk.btn_loading")}</h3>
            </div>
          )}

          {result && !loading && (
            <div className="risk-results">
              {/* Overall status banner */}
              <div className={`risk-banner-card ${getRiskColor(result.overall_risk_level)}`}>
                <div className="risk-banner-left">
                  <div className="risk-icon-circle">
                    {result.overall_risk_level === "Low" ? (
                      <ShieldCheck size={28} />
                    ) : (
                      <AlertTriangle size={28} />
                    )}
                  </div>
                  <div>
                    <span className="risk-badge-label">{t("risk.overall_status")}</span>
                    <h3 className="risk-headline">
                      {result.farm_status === "STABLE"
                        ? "Conditions Stable & Favorable"
                        : result.farm_status === "ATTENTION_REQUIRED"
                        ? "Attention Required – Stress Detected"
                        : "Critical Hazard Detected – Immediate Action"}
                    </h3>
                  </div>
                </div>
                <div className="risk-score-badge">
                  <span className="severity-text">{result.overall_risk_level}</span>
                  <span className="severity-lbl">Severity</span>
                </div>
              </div>

              {/* Hazard categories grid */}
              <div className="hazard-categories-grid">
                <div className="hazard-card">
                  <div className="hazard-header">
                    <Flame size={16} />
                    <span>{t("risk.drought_hazard")}</span>
                  </div>
                  <strong className={`hazard-level ${getRiskColor(result.drought_risk)}`}>
                    {result.drought_risk}
                  </strong>
                </div>

                <div className="hazard-card">
                  <div className="hazard-header">
                    <CloudRain size={16} />
                    <span>{t("risk.flood_hazard")}</span>
                  </div>
                  <strong className={`hazard-level ${getRiskColor(result.flood_risk)}`}>
                    {result.flood_risk}
                  </strong>
                </div>

                <div className="hazard-card">
                  <div className="hazard-header">
                    <ThermometerSun size={16} />
                    <span>{t("risk.thermal_stress")}</span>
                  </div>
                  <strong className={`hazard-level ${getRiskColor(result.heat_stress_risk)}`}>
                    {result.heat_stress_risk}
                  </strong>
                </div>

                <div className="hazard-card">
                  <div className="hazard-header">
                    <Droplets size={16} />
                    <span>{t("risk.disease_microclimate")}</span>
                  </div>
                  <strong className={`hazard-level ${getRiskColor(result.disease_risk)}`}>
                    {result.disease_risk}
                  </strong>
                </div>
              </div>

              {/* Triggered Rules Explanation */}
              {result.active_rules && result.active_rules.length > 0 && (
                <div className="triggered-rules-box">
                  <h4>{t("risk.risk_factors")}</h4>
                  <ul className="rules-list">
                    {result.active_rules.map((rule, idx) => (
                      <li key={idx}>
                        <AlertCircle size={15} className="rule-icon" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable Recommendations */}
              {result.actionable_recommendations && result.actionable_recommendations.length > 0 && (
                <div className="actionable-recs-box">
                  <h4>{t("risk.preventive_actions")}</h4>
                  <ul className="actions-list">
                    {result.actionable_recommendations.map((rec, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={15} className="action-check" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

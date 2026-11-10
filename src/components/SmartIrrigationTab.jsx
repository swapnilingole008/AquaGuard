import React, { useState } from "react";
import {
  Droplets,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CloudSun,
  Lightbulb
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

export default function SmartIrrigationTab() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    crop: "Wheat",
    farm_area_acres: 4.5,
    soil_type: "Loamy",
    soil_moisture_pct: 28,
    temperature_c: 31,
    humidity_pct: 62,
    rainfall_mm: 0,
    crop_stage: "Vegetative",
    irrigation_type: "Drip Irrigation"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.recommendIrrigation(formData);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to calculate smart irrigation schedule.");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "URGENT":
        return <span className="status-pill status-danger">Urgent Watering Required</span>;
      case "SCHEDULED":
        return <span className="status-pill status-warning">Scheduled Watering Needed</span>;
      default:
        return <span className="status-pill status-success">Soil Moisture Sufficient</span>;
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("irrigation.eyebrow")}</div>
        <h1>{t("irrigation.title")}</h1>
        <p>{t("irrigation.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Panel */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("irrigation.eyebrow")}</div>
              <h2>{t("irrigation.inputs_title")}</h2>
            </div>
            <Droplets size={20} className="panel-icon-accent" />
          </div>

          <form onSubmit={handleSubmit} className="feature-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t("irrigation.current_crop")}</label>
                <select name="crop" value={formData.crop} onChange={handleChange}>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Soybean">Soybean</option>
                  <option value="Tomato">Tomato / Vegetables</option>
                  <option value="Maize">Maize (Corn)</option>
                  <option value="Tea">Tea</option>
                  <option value="Rubber">Rubber</option>
                  <option value="Cinnamon">Cinnamon</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t("irrigation.farm_area")}</label>
                <input
                  type="number"
                  name="farm_area_acres"
                  value={formData.farm_area_acres}
                  onChange={handleChange}
                  min="0.1"
                  max="1000"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("irrigation.growth_stage")}</label>
                <select name="crop_stage" value={formData.crop_stage} onChange={handleChange}>
                  <option value="Nursery / Emergence">Nursery / Emergence</option>
                  <option value="Vegetative">Vegetative (Active Growth)</option>
                  <option value="Flowering">Flowering / Booting</option>
                  <option value="Grain Formation">Grain / Fruit Formation</option>
                  <option value="Ripening">Ripening / Pre-harvest</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t("irrigation.irrigation_system")}</label>
                <select name="irrigation_type" value={formData.irrigation_type} onChange={handleChange}>
                  <option value="Drip Irrigation">Drip Irrigation (90% eff.)</option>
                  <option value="Sprinkler">Sprinkler (75% eff.)</option>
                  <option value="Furrow / Basin">Furrow / Basin (60% eff.)</option>
                  <option value="Flood Irrigation">Flood Irrigation (45% eff.)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("irrigation.soil_type")}</label>
                <select name="soil_type" value={formData.soil_type} onChange={handleChange}>
                  <option value="Loamy">Loamy Soil</option>
                  <option value="Sandy Loam">Sandy Loam (Quick draining)</option>
                  <option value="Clay">Clayey Soil (High retention)</option>
                  <option value="Black Cotton">Black Cotton Soil</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t("irrigation.moisture_sensor")}: {formData.soil_moisture_pct}%</label>
                <input
                  type="range"
                  name="soil_moisture_pct"
                  min="5"
                  max="60"
                  step="1"
                  value={formData.soil_moisture_pct}
                  onChange={handleChange}
                  className="range-slider"
                />
                <div className="slider-ticks">
                  <span>Critical &lt; 20%</span>
                  <span>Adequate 30-40%</span>
                  <span>Saturated &gt; 50%</span>
                </div>
              </div>
            </div>

            <div className="form-section-title">
              <CloudSun size={15} /> Micro-Climate Conditions
            </div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("irrigation.temp_c")}</label>
                <input
                  type="number"
                  name="temperature_c"
                  value={formData.temperature_c}
                  onChange={handleChange}
                  min="0"
                  max="52"
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("irrigation.humidity")}</label>
                <input
                  type="number"
                  name="humidity_pct"
                  value={formData.humidity_pct}
                  onChange={handleChange}
                  min="10"
                  max="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("irrigation.rainfall_24h")}</label>
                <input
                  type="number"
                  name="rainfall_mm"
                  value={formData.rainfall_mm}
                  onChange={handleChange}
                  min="0"
                  max="300"
                  step="0.5"
                  required
                />
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
                  <RefreshCw size={18} className="spinner" /> {t("irrigation.btn_loading")}
                </>
              ) : (
                <>
                  <Droplets size={18} /> {t("irrigation.btn_submit")}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("irrigation.eyebrow")}</div>
              <h2>{t("irrigation.results_title")}</h2>
            </div>
            {result && getUrgencyBadge(result.urgency)}
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <Droplets size={42} strokeWidth={1.3} className="empty-icon" />
              <h3>{t("irrigation.awaiting")}</h3>
              <p>{t("irrigation.awaiting_desc")}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("irrigation.btn_loading")}</h3>
            </div>
          )}

          {result && !loading && (
            <div className="irrigation-results">
              {/* Primary Key Metric Tiles */}
              <div className="metric-cards-row">
                <div className="stat-card">
                  <span className="stat-label">{t("irrigation.water_needed")}</span>
                  <div className="stat-main">
                    <strong>{((result.water_amount_liters ?? result.daily_water_volume_litres) ?? 0).toLocaleString()}</strong>
                    <small>{t("common.liters")}</small>
                  </div>
                  <span className="stat-sub">{result.water_depth_mm ?? 0} mm depth</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("irrigation.pump_duration")}</span>
                  <div className="stat-main">
                    <strong>{result.pump_runtime_hours ?? result.recommended_pump_run_time_hours ?? 0}</strong>
                    <small>{t("common.hours")}</small>
                  </div>
                  <span className="stat-sub">5 HP standard pump</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("irrigation.etc_label")}</span>
                  <div className="stat-main">
                    <strong>{result.etc_mm_per_day ?? result.crop_water_requirement_etc_mm ?? 0}</strong>
                    <small>mm/{t("common.day")}</small>
                  </div>
                  <span className="stat-sub">Crop demand (ETc)</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("irrigation.root_depletion")}</span>
                  <div className="stat-main">
                    <strong>{result.soil_depletion_pct ?? 0}%</strong>
                    <small>%</small>
                  </div>
                  <span className="stat-sub">Soil reservoir capacity</span>
                </div>
              </div>

              {/* Schedule and Weather Context */}
              <div className="schedule-box">
                <div className="schedule-header">
                  <Clock size={18} />
                  <strong>{t("irrigation.schedule_title")}</strong>
                </div>
                <p className="schedule-time">{result.recommended_schedule}</p>
                <div className="weather-insight-note">
                  <CloudSun size={15} />
                  <span>{result.weather_context}</span>
                </div>
              </div>

              {/* Water Saving Strategies */}
              {result.water_saving_tips && result.water_saving_tips.length > 0 && (
                <div className="tips-box">
                  <div className="tips-header">
                    <Lightbulb size={16} />
                    <span>{t("irrigation.conservation_title")}</span>
                  </div>
                  <ul className="tips-list">
                    {result.water_saving_tips.map((tip, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={14} className="tip-check" />
                        <span>{tip}</span>
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

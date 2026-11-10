import React, { useState } from "react";
import {
  Wheat,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Clock,
  Droplets,
  Layers,
  MapPin
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

const PRESETS = [
  {
    label: "Kharif Season (Monsoon)",
    location: "Nashik, Maharashtra",
    soil_type: "Black Cotton",
    ph: 6.8,
    n: 90,
    p: 45,
    k: 40,
    temperature: 28,
    rainfall: 220,
    season: "Kharif"
  },
  {
    label: "Rabi Season (Winter Wheat)",
    location: "Punjab Plains",
    soil_type: "Alluvial / Loamy",
    ph: 7.2,
    n: 110,
    p: 50,
    k: 45,
    temperature: 19,
    rainfall: 45,
    season: "Rabi"
  },
  {
    label: "Plantation / Highlands",
    location: "Central Highlands",
    soil_type: "Red Laterite",
    ph: 5.5,
    n: 70,
    p: 30,
    k: 50,
    temperature: 22,
    rainfall: 280,
    season: "Annual"
  }
];

export default function CropAdvisoryTab() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    location: "Nashik, Maharashtra",
    soil_type: "Black Cotton",
    ph: 6.8,
    n: 90,
    p: 45,
    k: 40,
    temperature: 28,
    rainfall: 220,
    season: "Kharif",
    organic_matter: 0.75
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

  const applyPreset = (preset) => {
    setFormData((prev) => ({ ...prev, ...preset }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.recommendCrop(formData);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate crop recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("crop_advisory.eyebrow")}</div>
        <h1>{t("crop_advisory.title")}</h1>
        <p>{t("crop_advisory.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Panel */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("crop_advisory.field_profile")}</div>
              <h2>{t("crop_advisory.inputs_title")}</h2>
            </div>
            <Wheat size={20} className="panel-icon-accent" />
          </div>

          {/* Quick Presets */}
          <div className="preset-strip">
            <span className="preset-label">{t("crop_advisory.quick_scenarios")}</span>
            <div className="preset-buttons">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="preset-pill"
                  onClick={() => applyPreset(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="feature-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t("crop_advisory.location_label")}</label>
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
                <label>{t("crop_advisory.season_label")}</label>
                <select name="season" value={formData.season} onChange={handleChange}>
                  <option value="Kharif">Kharif (Monsoon / Autumn)</option>
                  <option value="Rabi">Rabi (Winter / Spring)</option>
                  <option value="Zaid">Zaid (Summer)</option>
                  <option value="Annual">Annual / Perennial</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("crop_advisory.soil_type_label")}</label>
                <select name="soil_type" value={formData.soil_type} onChange={handleChange}>
                  <option value="Black Cotton">Black Cotton / Vertisol</option>
                  <option value="Alluvial / Loamy">Alluvial / Loamy</option>
                  <option value="Red Laterite">Red Laterite</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                  <option value="Clayey">Clayey Soil</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t("crop_advisory.ph_label")} ({formData.ph})</label>
                <input
                  type="range"
                  name="ph"
                  min="4.5"
                  max="8.5"
                  step="0.1"
                  value={formData.ph}
                  onChange={handleChange}
                  className="range-slider"
                />
                <div className="slider-ticks">
                  <span>4.5 Acidic</span>
                  <span>6.5 Ideal</span>
                  <span>8.5 Alkaline</span>
                </div>
              </div>
            </div>

            <div className="form-section-title">
              <Layers size={15} /> {t("crop_advisory.nutrients_label")}
            </div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("crop_advisory.nitrogen")}</label>
                <input
                  type="number"
                  name="n"
                  value={formData.n}
                  onChange={handleChange}
                  min="10"
                  max="300"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("crop_advisory.phosphorus")}</label>
                <input
                  type="number"
                  name="p"
                  value={formData.p}
                  onChange={handleChange}
                  min="5"
                  max="150"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("crop_advisory.potassium")}</label>
                <input
                  type="number"
                  name="k"
                  value={formData.k}
                  onChange={handleChange}
                  min="10"
                  max="300"
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <Droplets size={15} /> {t("crop_advisory.climate_label")}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t("crop_advisory.temperature")}</label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  min="5"
                  max="50"
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("crop_advisory.rainfall")}</label>
                <input
                  type="number"
                  name="rainfall"
                  value={formData.rainfall}
                  onChange={handleChange}
                  min="0"
                  max="1200"
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
                  <RefreshCw size={18} className="spinner" /> {t("crop_advisory.btn_loading")}
                </>
              ) : (
                <>
                  <Sparkles size={18} /> {t("crop_advisory.btn_submit")}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("crop_advisory.recs_title")}</div>
              <h2>{t("crop_advisory.recs_title")}</h2>
            </div>
            {result && (
              <span className="status-pill status-success">
                {result.recommended_crops?.length || 0} Crops
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <Wheat size={42} strokeWidth={1.3} className="empty-icon" />
              <h3>{t("crop_advisory.title")}</h3>
              <p>{t("crop_advisory.desc")}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("crop_advisory.btn_loading")}</h3>
            </div>
          )}

          {result && !loading && (
            <div className="advisory-results">
              {/* Primary match banner */}
              <div className="primary-crop-card">
                <div className="primary-crop-header">
                  <div>
                    <span className="crop-tag">{t("crop_advisory.top_recommendation")}</span>
                    <h3 className="primary-crop-name">{result.primary_recommendation}</h3>
                  </div>
                  <div className="match-score-badge">
                    <span className="score-val">
                      {result.recommended_crops?.[0]?.suitability_score}%
                    </span>
                    <span className="score-lbl">{t("crop_advisory.match_index")}</span>
                  </div>
                </div>
                <p className="crop-rationale">
                  {result.recommended_crops?.[0]?.key_benefits}
                </p>
              </div>

              {/* Soil Diagnostics Quick Grid */}
              {result.field_diagnostics && (
                <div className="diagnostics-summary">
                  <h4>{t("crop_advisory.soil_chemistry")}</h4>
                  <div className="diagnostics-grid">
                    <div className="diag-item">
                      <span className="diag-label">pH</span>
                      <strong className="diag-val">{result.field_diagnostics.ph_assessment}</strong>
                    </div>
                    <div className="diag-item">
                      <span className="diag-label">N</span>
                      <strong className="diag-val">{result.field_diagnostics.nitrogen_status}</strong>
                    </div>
                    <div className="diag-item">
                      <span className="diag-label">P</span>
                      <strong className="diag-val">{result.field_diagnostics.phosphorus_status}</strong>
                    </div>
                    <div className="diag-item">
                      <span className="diag-label">K</span>
                      <strong className="diag-val">{result.field_diagnostics.potassium_status}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranked Crops List */}
              <div className="ranked-crops-list">
                <h4>{t("crop_advisory.ranked_alternatives")}</h4>
                {result.recommended_crops?.map((c, i) => (
                  <div key={c.crop} className="crop-rank-card">
                    <div className="crop-rank-top">
                      <div className="crop-rank-title">
                        <span className="rank-num">#{i + 1}</span>
                        <div>
                          <strong>{c.crop}</strong>
                          <span className="tier-tag">{c.match_tier}</span>
                        </div>
                      </div>
                      <div className="suitability-progress">
                        <div className="progress-bar-bg">
                          <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.min(100, c.suitability_score)}%` }}
                          />
                        </div>
                        <span className="score-percent">{c.suitability_score}%</span>
                      </div>
                    </div>

                    <div className="crop-meta-row">
                      <span>
                        <Calendar size={13} /> {c.sowing_window}
                      </span>
                      <span>
                        <Clock size={13} /> {c.harvest_duration}
                      </span>
                      <span>
                        <Droplets size={13} /> {c.water_need}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gemini Agronomic Guidance */}
              {result.gemini_advisory && (
                <div className="gemini-advisory-box">
                  <div className="gemini-header">
                    <Sparkles size={16} />
                    <span>{t("crop_advisory.gemini_guidance")}</span>
                  </div>
                  <p>{result.gemini_advisory}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

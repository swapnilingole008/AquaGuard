import React, { useState } from "react";
import {
  MapPinned,
  Satellite,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  MapPin
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

const PRESET_COORDS = [
  { name: "My Farm - Nashik, MH", lat: 19.9975, lng: 73.7898 },
  { name: "Punjab Alluvial Belt", lat: 30.901, lng: 75.8573 },
  { name: "Highland Tea Slopes", lat: 6.9497, lng: 80.7891 }
];

export default function SoilSatelliteTab() {
  const { t } = useTranslation();
  const [location, setLocation] = useState("My Farm - Nashik, Maharashtra");
  const [latitude, setLatitude] = useState(19.9975);
  const [longitude, setLongitude] = useState(73.7898);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePreset = (p) => {
    setLocation(p.name);
    setLatitude(p.lat);
    setLongitude(p.lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.analyzeSoil({
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to retrieve soil & Sentinel-2 satellite data.");
    } finally {
      setLoading(false);
    }
  };

  const getNdviStatusColor = (ndvi) => {
    if (ndvi > 0.6) return "var(--green)";
    if (ndvi > 0.4) return "#84a938";
    if (ndvi > 0.2) return "#d49e24";
    return "#c2410c";
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("soil.eyebrow")}</div>
        <h1>{t("soil.title")}</h1>
        <p>{t("soil.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Panel */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("soil.eyebrow")}</div>
              <h2>{t("soil.inputs_title")}</h2>
            </div>
            <MapPinned size={20} className="panel-icon-accent" />
          </div>

          {/* Quick presets */}
          <div className="preset-strip">
            <span className="preset-label">{t("soil.coordinates_presets")}</span>
            <div className="preset-buttons">
              {PRESET_COORDS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="preset-pill"
                  onClick={() => handlePreset(p)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="feature-form">
            <div className="form-group">
              <label>{t("soil.location_desc")}</label>
              <div className="input-with-icon">
                <MapPin size={16} />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("soil.latitude")}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("soil.longitude")}</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="satellite-info-note">
              <Satellite size={16} />
              <div>
                <strong>Constellation: Sentinel-2A / 2B MSI</strong>
                <p>10m resolution bands: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR) calibrated at Level-2A BOA.</p>
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
                  <RefreshCw size={18} className="spinner" /> {t("soil.btn_loading")}
                </>
              ) : (
                <>
                  <Satellite size={18} /> {t("soil.btn_submit")}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("soil.eyebrow")}</div>
              <h2>{t("soil.results_title")}</h2>
            </div>
            {result && (
              <span className="status-pill status-success">
                NDVI: {result.ndvi_index} ({result.canopy_health})
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <Satellite size={42} strokeWidth={1.3} className="empty-icon" />
              <h3>{t("soil.awaiting")}</h3>
              <p>{t("soil.awaiting_desc")}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("soil.btn_loading")}</h3>
            </div>
          )}

          {result && !loading && (
            <div className="satellite-results">
              {/* NDVI Visual Gauge Card */}
              <div className="ndvi-overview-card">
                <div className="ndvi-visual-preview">
                  <svg viewBox="0 0 240 140" className="ndvi-map-svg">
                    <defs>
                      <linearGradient id="ndviGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#287a45" />
                        <stop offset="35%" stopColor="#43a047" />
                        <stop offset="70%" stopColor="#7cb342" />
                        <stop offset="100%" stopColor="#c0ca33" />
                      </linearGradient>
                      <pattern id="gridPat" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff1c" strokeWidth="0.8" />
                      </pattern>
                    </defs>
                    <rect width="240" height="140" rx="10" fill="url(#ndviGrad)" />
                    <rect width="240" height="140" rx="10" fill="url(#gridPat)" />
                    <ellipse cx="120" cy="70" rx="75" ry="45" fill="#1b5e20" opacity="0.4" />
                    <circle cx="120" cy="70" r="5" fill="#fff" />
                    <circle cx="120" cy="70" r="14" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 3" />
                    <text x="12" y="125" fill="#ffffff" fontSize="9" fontWeight="700">
                      SENTINEL-2 NDVI FIELD RASTER
                    </text>
                  </svg>
                </div>

                <div className="ndvi-stats-block">
                  <div className="ndvi-val-large">
                    <strong>{result.ndvi_index}</strong>
                    <span>{t("soil.ndvi_index")}</span>
                  </div>
                  <div className="ndvi-health-label">
                    <span
                      className="ndvi-dot"
                      style={{ background: getNdviStatusColor(result.ndvi_index) }}
                    />
                    <strong>{result.canopy_health}</strong>
                  </div>
                  <p className="ndvi-desc">{result.canopy_description}</p>
                </div>
              </div>

              {/* Spectral Reflectance Bands */}
              {result.sentinel_band_reflectance && (
                <div className="spectral-bands-card">
                  <h4>{t("soil.spectral_title")}</h4>
                  <div className="bands-grid">
                    <div className="band-chip">
                      <span>B2 Blue (490nm)</span>
                      <strong>{result.sentinel_band_reflectance.B2_Blue}</strong>
                    </div>
                    <div className="band-chip">
                      <span>B3 Green (560nm)</span>
                      <strong>{result.sentinel_band_reflectance.B3_Green}</strong>
                    </div>
                    <div className="band-chip">
                      <span>B4 Red (665nm)</span>
                      <strong>{result.sentinel_band_reflectance.B4_Red}</strong>
                    </div>
                    <div className="band-chip">
                      <span>B8 NIR (842nm)</span>
                      <strong>{result.sentinel_band_reflectance.B8_NIR}</strong>
                    </div>
                    <div className="band-chip">
                      <span>NDWI (Moisture)</span>
                      <strong>{result.sentinel_band_reflectance.NDWI}</strong>
                    </div>
                    <div className="band-chip highlight-band">
                      <span>NDVI (Vigor)</span>
                      <strong>{result.sentinel_band_reflectance.NDVI}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Soil Health Card */}
              {result.soil_health_card && (
                <div className="soil-card-box">
                  <div className="soil-card-header">
                    <h4>{t("soil.soil_card_title")}</h4>
                    <span className="soil-status-badge">{result.soil_health_card.overall_status}</span>
                  </div>
                  <div className="soil-card-grid">
                    <div className="soil-metric">
                      <span>Texture</span>
                      <strong>{result.soil_health_card.texture}</strong>
                    </div>
                    <div className="soil-metric">
                      <span>pH Level</span>
                      <strong>{result.soil_health_card.ph}</strong>
                    </div>
                    <div className="soil-metric">
                      <span>Organic Carbon</span>
                      <strong>{result.soil_health_card.organic_carbon_pct}%</strong>
                    </div>
                    <div className="soil-metric">
                      <span>Available Nitrogen</span>
                      <strong>{result.soil_health_card.nitrogen_kg_ha} kg/ha</strong>
                    </div>
                    <div className="soil-metric">
                      <span>Available Phosphorus</span>
                      <strong>{result.soil_health_card.phosphorus_kg_ha} kg/ha</strong>
                    </div>
                    <div className="soil-metric">
                      <span>Available Potassium</span>
                      <strong>{result.soil_health_card.potassium_kg_ha} kg/ha</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Agronomic Recommendations */}
              {result.recommendations && (
                <div className="recommendations-box">
                  <h4>{t("soil.action_plan")}</h4>
                  <ul className="actions-list">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>
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

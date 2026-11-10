import React, { useState } from "react";
import {
  ChartNoAxesCombined,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Sparkles,
  MapPin,
  Lightbulb,
  ShieldCheck
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

// Available crops with benchmark pricing defaults
const AVAILABLE_CROPS = [
  { name: "Wheat", trained: false, defaultMandi: 2425, defaultSeed: 2500, defaultFert: 4500, defaultLabour: 5500, defaultIrrig: 2500 },
  { name: "Rice (Paddy)", trained: true, value: "Rice", defaultMandi: 2450, defaultSeed: 2200, defaultFert: 5000, defaultLabour: 6500, defaultIrrig: 3000 },
  { name: "Sugarcane", trained: true, value: "Sugarcane", defaultMandi: 320, defaultSeed: 8000, defaultFert: 9000, defaultLabour: 12000, defaultIrrig: 6000 },
  { name: "Cotton", trained: false, defaultMandi: 7150, defaultSeed: 3200, defaultFert: 5500, defaultLabour: 7000, defaultIrrig: 2800 },
  { name: "Soybean", trained: false, defaultMandi: 4620, defaultSeed: 2800, defaultFert: 4000, defaultLabour: 5000, defaultIrrig: 2000 },
  { name: "Maize", trained: false, defaultMandi: 2150, defaultSeed: 2600, defaultFert: 4800, defaultLabour: 5200, defaultIrrig: 2200 },
  { name: "Tomato", trained: false, defaultMandi: 1850, defaultSeed: 4500, defaultFert: 7500, defaultLabour: 11000, defaultIrrig: 4500 },
  { name: "Onion", trained: false, defaultMandi: 1850, defaultSeed: 4000, defaultFert: 6500, defaultLabour: 9500, defaultIrrig: 3500 },
  { name: "Tea", trained: true, value: "Tea", defaultMandi: 8500, defaultSeed: 6000, defaultFert: 8500, defaultLabour: 14000, defaultIrrig: 3500 },
  { name: "Rubber", trained: true, value: "Rubber", defaultMandi: 17200, defaultSeed: 9000, defaultFert: 7000, defaultLabour: 12000, defaultIrrig: 2500 },
  { name: "Cinnamon", trained: true, value: "Cinnamon", defaultMandi: 34500, defaultSeed: 7500, defaultFert: 6500, defaultLabour: 10000, defaultIrrig: 2000 }
];

// Error Boundary wrapper to guarantee page NEVER turns white
class YieldErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("YieldProfitTab rendering caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="tab-container">
          <div className="alert-banner error-banner">
            <AlertTriangle size={18} />
            <div>
              <strong>Yield & Profit module encountered a rendering exception.</strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px" }}>
                {this.state.error?.message || "Internal error"}. Please reset inputs and recalculate.
              </p>
            </div>
          </div>
          <button
            className="action-button primary-button"
            style={{ width: "200px", marginTop: "12px" }}
            onClick={() => this.setState({ hasError: false })}
          >
            Reset Form
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function YieldProfitContent() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    crop: "Wheat",
    district: "Nashik, Maharashtra",
    area_acres: 4.5,
    soil_type: "Loamy",
    temperature_c: 28.5,
    rainfall_mm: 350.0,
    humidity_pct: 62.0,
    n: 90.0,
    p: 45.0,
    k: 40.0,
    year: 2026,
    month: 11,
    seed_cost: 2500,
    fertilizer_cost: 4500,
    labour_cost: 5500,
    irrigation_cost: 2500,
    mandi_price_per_quintal: 2425
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCropSelect = (cropName) => {
    const item = AVAILABLE_CROPS.find((c) => c.name === cropName);
    if (item) {
      setFormData((prev) => ({
        ...prev,
        crop: item.value || item.name,
        mandi_price_per_quintal: item.defaultMandi,
        seed_cost: item.defaultSeed,
        fertilizer_cost: item.defaultFert,
        labour_cost: item.defaultLabour,
        irrigation_cost: item.defaultIrrig
      }));
    } else {
      setFormData((prev) => ({ ...prev, crop: cropName }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsed = type === "number" ? (parseFloat(value) || 0) : value;
    setFormData((prev) => ({ ...prev, [name]: parsed }));
  };

  const totalCostPerAcre =
    (parseFloat(formData.seed_cost) || 0) +
    (parseFloat(formData.fertilizer_cost) || 0) +
    (parseFloat(formData.labour_cost) || 0) +
    (parseFloat(formData.irrigation_cost) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        crop: formData.crop,
        district: formData.district,
        location: formData.district,
        area_acres: parseFloat(formData.area_acres) || 4.5,
        soil_type: formData.soil_type,
        temperature_c: parseFloat(formData.temperature_c) || 28.0,
        rainfall_mm: parseFloat(formData.rainfall_mm) || 350.0,
        humidity_pct: parseFloat(formData.humidity_pct) || 62.0,
        n: parseFloat(formData.n) || 80.0,
        p: parseFloat(formData.p) || 40.0,
        k: parseFloat(formData.k) || 40.0,
        year: parseInt(formData.year, 10) || 2026,
        month: parseInt(formData.month, 10) || 7,
        seed_cost: parseFloat(formData.seed_cost) || 2500,
        fertilizer_cost: parseFloat(formData.fertilizer_cost) || 4500,
        labour_cost: parseFloat(formData.labour_cost) || 6000,
        irrigation_cost: parseFloat(formData.irrigation_cost) || 2500,
        cost_per_acre: totalCostPerAcre,
        mandi_price_per_quintal: parseFloat(formData.mandi_price_per_quintal) || 2450
      };

      const data = await api.predictYield(payload);
      setResult(data);
    } catch (err) {
      console.error("predictYield error:", err);
      setError(err.message || "Failed to calculate yield and profit forecast.");
    } finally {
      setLoading(false);
    }
  };

  // Safe numerical extraction
  const predYieldTonnes = result?.predicted_yield_tonnes_per_ha ?? result?.prediction?.predicted_yield_tonnes_per_ha ?? 0;
  const predYieldQuintals = result?.predicted_yield_quintals_per_ha ?? result?.prediction?.predicted_yield_quintals_per_ha ?? 0;
  const predYieldKgAcre = result?.predicted_yield_kg_per_acre ?? 0;
  const totalProductionQ = result?.total_production_quintals ?? result?.prediction?.total_production_quintals ?? 0;
  const totalProductionT = result?.total_production_tonnes ?? result?.prediction?.total_production_tonnes ?? 0;
  const totalCost = result?.total_cultivation_cost ?? result?.prediction?.total_cultivation_cost ?? 0;
  const grossRev = result?.gross_revenue ?? result?.prediction?.gross_revenue ?? 0;
  const netProf = result?.net_profit ?? result?.prediction?.net_profit ?? 0;
  const marginPct = result?.profit_margin_pct ?? result?.prediction?.profit_margin_pct ?? 0;
  const breakEven = result?.breakeven_price_per_quintal ?? result?.prediction?.breakeven_price_per_quintal ?? 0;
  const isProfitable = netProf >= 0;

  // Chart rendering for Financial Visualization
  const renderFinancialChart = () => {
    if (!result) return null;
    const maxVal = Math.max(totalCost, grossRev, 1);
    const costWidth = Math.min(100, Math.max(8, (totalCost / maxVal) * 100));
    const revWidth = Math.min(100, Math.max(8, (grossRev / maxVal) * 100));
    const profitWidth = Math.min(100, Math.max(6, (Math.abs(netProf) / maxVal) * 100));

    return (
      <div className="forecast-chart-container" style={{ marginTop: "16px" }}>
        <div className="chart-header">
          <strong>{t("yield_profit.financial_comparison")}</strong>
          <span className="trend-badge-sub">
            {isProfitable ? `Margin: +${marginPct}%` : `Loss Margin: ${marginPct}%`}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "10px 0" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
              <span>{t("yield_profit.total_cultivation_exp")}</span>
              <strong>₹{totalCost.toLocaleString()}</strong>
            </div>
            <div style={{ width: "100%", height: "16px", background: "#f0f4ef", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ width: `${costWidth}%`, height: "100%", background: "#d97706", borderRadius: "8px", transition: "width 0.4s ease" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
              <span>{t("yield_profit.gross_revenue")}</span>
              <strong>₹{grossRev.toLocaleString()}</strong>
            </div>
            <div style={{ width: "100%", height: "16px", background: "#f0f4ef", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ width: `${revWidth}%`, height: "100%", background: "#287a45", borderRadius: "8px", transition: "width 0.4s ease" }} />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
              <span>{t("yield_profit.estimated_net_return")}</span>
              <strong style={{ color: isProfitable ? "#287a45" : "#ad3021" }}>
                ₹{netProf.toLocaleString()}
              </strong>
            </div>
            <div style={{ width: "100%", height: "16px", background: "#f0f4ef", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ width: `${profitWidth}%`, height: "100%", background: isProfitable ? "#287a45" : "#ad3021", borderRadius: "8px", transition: "width 0.4s ease" }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("yield_profit.eyebrow")}</div>
        <h1>{t("yield_profit.title")}</h1>
        <p>{t("yield_profit.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Panel */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("yield_profit.eyebrow")}</div>
              <h2>{t("yield_profit.inputs_title")}</h2>
            </div>
            <ChartNoAxesCombined size={20} className="panel-icon-accent" />
          </div>

          {/* Quick Crop Selector */}
          <div className="preset-strip">
            <span className="preset-label">{t("yield_profit.quick_crops")}</span>
            <div className="preset-buttons">
              {AVAILABLE_CROPS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`preset-pill ${formData.crop === (c.value || c.name) ? "active" : ""}`}
                  onClick={() => handleCropSelect(c.name)}
                >
                  {c.name} {c.trained ? "⭐" : ""}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="feature-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t("yield_profit.crop_name")}</label>
                <input
                  type="text"
                  name="crop"
                  value={formData.crop}
                  onChange={handleChange}
                  placeholder="e.g. Wheat, Rice, Cotton..."
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.location_district")}</label>
                <div className="input-with-icon">
                  <MapPin size={16} />
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("yield_profit.farm_area")}</label>
                <input
                  type="number"
                  name="area_acres"
                  value={formData.area_acres}
                  onChange={handleChange}
                  min="0.1"
                  max="5000"
                  step="0.1"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.soil_type")}</label>
                <select name="soil_type" value={formData.soil_type} onChange={handleChange}>
                  <option value="Loamy">Loamy Soil</option>
                  <option value="Black Cotton">Black Cotton Soil</option>
                  <option value="Alluvial">Alluvial Soil</option>
                  <option value="Clayey">Clayey Soil</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t("yield_profit.selling_price")}</label>
                <input
                  type="number"
                  name="mandi_price_per_quintal"
                  value={formData.mandi_price_per_quintal}
                  onChange={handleChange}
                  min="50"
                  max="100000"
                  step="25"
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <Sparkles size={15} /> {t("yield_profit.microclimate_title")}
            </div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("yield_profit.temperature")}</label>
                <input
                  type="number"
                  name="temperature_c"
                  value={formData.temperature_c}
                  onChange={handleChange}
                  min="5"
                  max="52"
                  step="0.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.rainfall")}</label>
                <input
                  type="number"
                  name="rainfall_mm"
                  value={formData.rainfall_mm}
                  onChange={handleChange}
                  min="0"
                  max="2000"
                  step="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.humidity")}</label>
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
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>{t("yield_profit.nitrogen")}</label>
                <input
                  type="number"
                  name="n"
                  value={formData.n}
                  onChange={handleChange}
                  min="5"
                  max="300"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.phosphorus")}</label>
                <input
                  type="number"
                  name="p"
                  value={formData.p}
                  onChange={handleChange}
                  min="5"
                  max="200"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.potassium")}</label>
                <input
                  type="number"
                  name="k"
                  value={formData.k}
                  onChange={handleChange}
                  min="5"
                  max="300"
                  required
                />
              </div>
            </div>

            <div className="form-section-title">
              <DollarSign size={15} /> {t("yield_profit.cost_breakdown_title")}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t("yield_profit.seed_cost")}</label>
                <input
                  type="number"
                  name="seed_cost"
                  value={formData.seed_cost}
                  onChange={handleChange}
                  min="0"
                  max="50000"
                  step="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.fert_cost")}</label>
                <input
                  type="number"
                  name="fertilizer_cost"
                  value={formData.fertilizer_cost}
                  onChange={handleChange}
                  min="0"
                  max="50000"
                  step="100"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>{t("yield_profit.labour_cost")}</label>
                <input
                  type="number"
                  name="labour_cost"
                  value={formData.labour_cost}
                  onChange={handleChange}
                  min="0"
                  max="50000"
                  step="100"
                  required
                />
              </div>
              <div className="form-group">
                <label>{t("yield_profit.irrig_cost")}</label>
                <input
                  type="number"
                  name="irrigation_cost"
                  value={formData.irrigation_cost}
                  onChange={handleChange}
                  min="0"
                  max="50000"
                  step="100"
                  required
                />
              </div>
            </div>

            <div style={{ background: "#f7faf6", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
              <span>{t("yield_profit.total_cost_per_acre")}</span>
              <strong style={{ color: "#1e3e26" }}>₹{totalCostPerAcre.toLocaleString()} / {t("common.acres")}</strong>
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
                  <RefreshCw size={18} className="spinner" /> {t("yield_profit.btn_loading")}
                </>
              ) : (
                <>
                  <ChartNoAxesCombined size={18} /> {t("yield_profit.btn_submit")}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("yield_profit.eyebrow")}</div>
              <h2>{t("yield_profit.results_title")}</h2>
            </div>
            {result && (
              <span className={`status-pill ${isProfitable ? "status-success" : "status-danger"}`}>
                {isProfitable ? t("yield_profit.profitable_cycle") : t("yield_profit.loss_alert")}
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <ChartNoAxesCombined size={42} strokeWidth={1.3} className="empty-icon" />
              <h3>{t("yield_profit.awaiting")}</h3>
              <p>{t("yield_profit.awaiting_desc")}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("yield_profit.btn_loading")}</h3>
            </div>
          )}

          {result && !loading && (
            <div className="yield-results">
              {/* Model Source Badge */}
              <div className="ml-badge-banner">
                {result.is_ml_model ? <Sparkles size={16} /> : <ShieldCheck size={16} />}
                <span>
                  <strong>{result.model_type || result.model || "Predictive Yield Model"}</strong>
                </span>
              </div>

              {result.model_note && (
                <p style={{ margin: "4px 0 10px", fontSize: "11.5px", color: "#5a705e", fontStyle: "italic" }}>
                  {result.model_note}
                </p>
              )}

              {/* Primary Yield Metric Grid */}
              <div className="metric-cards-row">
                <div className="stat-card">
                  <span className="stat-label">{t("yield_profit.predicted_yield")}</span>
                  <div className="stat-main">
                    <strong>{predYieldTonnes}</strong>
                    <small>{t("common.tonnes")} / Ha</small>
                  </div>
                  <span className="stat-sub">
                    {predYieldQuintals} {t("common.quintals")}/ha ({predYieldKgAcre} kg/{t("common.acres")})
                  </span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("yield_profit.total_harvest")}</span>
                  <div className="stat-main">
                    <strong>{totalProductionQ.toLocaleString()}</strong>
                    <small>{t("common.quintals")}</small>
                  </div>
                  <span className="stat-sub">
                    {formData.area_acres} {t("common.acres")} ({totalProductionT} {t("common.tonnes")})
                  </span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("yield_profit.gross_revenue")}</span>
                  <div className="stat-main">
                    <strong>₹{grossRev.toLocaleString()}</strong>
                  </div>
                  <span className="stat-sub">₹{formData.mandi_price_per_quintal}/{t("common.quintals")}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("yield_profit.net_profit_loss")}</span>
                  <div className="stat-main">
                    <strong className={isProfitable ? "profit-positive" : "profit-negative"}>
                      ₹{netProf.toLocaleString()}
                    </strong>
                  </div>
                  <span className="stat-sub">
                    {t("yield_profit.profit_margin")}: {marginPct}%
                  </span>
                </div>
              </div>

              {/* SVG Financial Visualization */}
              {renderFinancialChart()}

              {/* Financial Breakdown Table */}
              <div className="financial-card">
                <h4>{t("yield_profit.financial_table_title")}</h4>
                <div className="financial-row">
                  <span>{t("yield_profit.seed_cost")} ({formData.area_acres} {t("common.acres")})</span>
                  <strong>₹{((result?.cost_breakdown?.total_seed_cost) ?? (formData.seed_cost * formData.area_acres)).toLocaleString()}</strong>
                </div>
                <div className="financial-row">
                  <span>{t("yield_profit.fert_cost")}</span>
                  <strong>₹{((result?.cost_breakdown?.total_fertilizer_cost) ?? (formData.fertilizer_cost * formData.area_acres)).toLocaleString()}</strong>
                </div>
                <div className="financial-row">
                  <span>{t("yield_profit.labour_cost")}</span>
                  <strong>₹{((result?.cost_breakdown?.total_labour_cost) ?? (formData.labour_cost * formData.area_acres)).toLocaleString()}</strong>
                </div>
                <div className="financial-row">
                  <span>{t("yield_profit.irrig_cost")}</span>
                  <strong>₹{((result?.cost_breakdown?.total_irrigation_cost) ?? (formData.irrigation_cost * formData.area_acres)).toLocaleString()}</strong>
                </div>
                <div className="financial-row highlight-row">
                  <span>{t("yield_profit.total_cultivation_exp")}</span>
                  <strong>₹{totalCost.toLocaleString()}</strong>
                </div>
                <div className="financial-row highlight-row">
                  <span>{t("yield_profit.estimated_net_return")}</span>
                  <strong className={isProfitable ? "profit-positive" : "profit-negative"}>
                    ₹{netProf.toLocaleString()} ({marginPct}%)
                  </strong>
                </div>
                <div className="financial-row break-even-row">
                  <span>{t("yield_profit.breakeven_mandi")}</span>
                  <strong>₹{breakEven} / {t("common.quintals")}</strong>
                </div>
              </div>

              {/* Gemini / AI Suggestions */}
              {result.ai_suggestions && result.ai_suggestions.length > 0 && (
                <div className="insights-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <Lightbulb size={16} color="#d97706" />
                    <h4 style={{ margin: 0 }}>{t("yield_profit.ai_suggestions_title")}</h4>
                  </div>
                  <ul className="insights-list">
                    {result.ai_suggestions.map((suggestion, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={15} className="insight-check" />
                        <span>{suggestion}</span>
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

export default function YieldProfitTab() {
  return (
    <YieldErrorBoundary>
      <YieldProfitContent />
    </YieldErrorBoundary>
  );
}

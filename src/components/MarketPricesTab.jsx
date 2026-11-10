import React, { useState, useEffect } from "react";
import {
  Store,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

const COMMODITIES = [
  { name: "Cinnamon", trained: true, defaultMarket: "Central Market", defaultPrice: 34500 },
  { name: "Tea", trained: true, defaultMarket: "Highland Auction", defaultPrice: 8500 },
  { name: "Rubber", trained: true, defaultMarket: "Terminal Mandi", defaultPrice: 17200 },
  { name: "Wheat", trained: false, defaultMarket: "Nashik APMC", defaultPrice: 2425 },
  { name: "Rice (Paddy)", trained: false, defaultMarket: "APMC Yard", defaultPrice: 2280 },
  { name: "Soybean", trained: false, defaultMarket: "Nashik APMC", defaultPrice: 4620 },
  { name: "Onion", trained: false, defaultMarket: "Lasalgaon APMC", defaultPrice: 1850 }
];

export default function MarketPricesTab() {
  const { t } = useTranslation();
  const [commodity, setCommodity] = useState("Cinnamon");
  const [market, setMarket] = useState("Central Market");
  const [days, setDays] = useState(14);
  const [modelType, setModelType] = useState("prophet"); // 'prophet' or 'lstm'

  const [loading, setLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState(null);
  const [lstmResult, setLstmResult] = useState(null);
  const [spotPrices, setSpotPrices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSpotPrices();
    runMarketForecast();
  }, [commodity, modelType]);

  const fetchSpotPrices = async () => {
    try {
      const data = await api.getMarketPrices();
      if (data?.prices) {
        setSpotPrices(data.prices);
      }
    } catch (e) {
      console.warn("Spot prices fetch note:", e);
    }
  };

  const handleCommodityChange = (e) => {
    const val = e.target.value;
    setCommodity(val);
    const item = COMMODITIES.find((c) => c.name === val);
    if (item) {
      setMarket(item.defaultMarket);
    }
  };

  const runMarketForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      if (modelType === "prophet") {
        const data = await api.forecastMarket({
          commodity,
          market,
          days: parseInt(days, 10)
        });
        setForecastResult(data);
      } else {
        const data = await api.predictMarketLSTM({
          commodity,
          market
        });
        setLstmResult(data);
      }
    } catch (err) {
      setError(err.message || "Failed to execute price prediction model.");
    } finally {
      setLoading(false);
    }
  };

  // Chart rendering helpers
  const renderProphetChart = () => {
    if (!forecastResult || !forecastResult.predictions || forecastResult.predictions.length === 0) {
      return null;
    }

    const pts = forecastResult.predictions;
    const lowers = pts.map((p) => p.lower_bound || p.predicted_price * 0.95);
    const uppers = pts.map((p) => p.upper_bound || p.predicted_price * 1.05);

    const minVal = Math.min(...lowers) * 0.98;
    const maxVal = Math.max(...uppers) * 1.02;
    const range = maxVal - minVal || 1;

    const width = 600;
    const height = 220;
    const pad = 35;

    const getX = (idx) => pad + (idx / (pts.length - 1 || 1)) * (width - pad * 2);
    const getY = (val) => height - pad - ((val - minVal) / range) * (height - pad * 2);

    const mainLine = pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)},${getY(p.predicted_price)}`).join(" ");

    const upperPoints = pts.map((p, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx)},${getY(p.upper_bound)}`).join(" ");
    const lowerPoints = pts.slice().reverse().map((p, idx) => `L ${getX(pts.length - 1 - idx)},${getY(p.lower_bound)}`).join(" ");
    const areaPath = `${upperPoints} ${lowerPoints} Z`;

    return (
      <div className="forecast-chart-container">
        <div className="chart-header">
          <strong>Prophet Multi-Day Price Trajectory & 80% Uncertainty Range</strong>
          <span className="trend-badge-sub">
            Trend: {forecastResult.trend_direction}
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="forecast-svg">
          {[0.25, 0.5, 0.75].map((pct, i) => {
            const y = pad + pct * (height - pad * 2);
            const val = Math.round(maxVal - pct * range);
            return (
              <g key={i}>
                <line x1={pad} y1={y} x2={width - pad} y2={y} stroke="#e4ece2" strokeDasharray="4 4" />
                <text x={pad - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#88988a">
                  ₹{val.toLocaleString()}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="#287a45" fillOpacity="0.12" />
          <path d={mainLine} fill="none" stroke="#287a45" strokeWidth="2.5" strokeLinecap="round" />

          {pts.map((p, idx) => (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(p.predicted_price)}
              r="4"
              fill="#287a45"
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}

          {pts.filter((_, i) => i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1).map((p, idx) => (
            <text
              key={idx}
              x={getX(pts.indexOf(p))}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7c6e"
            >
              {p.date}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("market.eyebrow")}</div>
        <h1>{t("market.title")}</h1>
        <p>{t("market.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Panel */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("market.selection_title")}</div>
              <h2>{t("market.selection_title")}</h2>
            </div>
            <Store size={20} className="panel-icon-accent" />
          </div>

          {/* Model Toggle */}
          <div className="model-toggle-row">
            <button
              type="button"
              className={`model-pill ${modelType === "prophet" ? "active" : ""}`}
              onClick={() => setModelType("prophet")}
            >
              <Calendar size={14} /> {t("market.prophet_pill")}
            </button>
            <button
              type="button"
              className={`model-pill ${modelType === "lstm" ? "active" : ""}`}
              onClick={() => setModelType("lstm")}
            >
              <Sparkles size={14} /> {t("market.lstm_pill")}
            </button>
          </div>

          <div className="feature-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t("market.commodity_label")}</label>
                <select value={commodity} onChange={handleCommodityChange}>
                  {COMMODITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.trained ? "⭐ (Trained ML Weights)" : "(Spot APMC)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t("market.target_mandi")}</label>
                <input
                  type="text"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  required
                />
              </div>
            </div>

            {modelType === "prophet" && (
              <div className="form-group">
                <label>{t("market.horizon")}</label>
                <div className="horizon-chips">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`horizon-pill ${days === d ? "active" : ""}`}
                      onClick={() => setDays(d)}
                    >
                      {d} {t("market.days_forward")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="model-context-card">
              <div className="context-card-top">
                <Info size={16} />
                <strong>Model Verification Note</strong>
              </div>
              <p>
                {modelType === "prophet"
                  ? "Prophet decomposes multi-year seasonal periodicity, holiday shocks, and changepoints with exact Bayesian parameters."
                  : "LSTM recurrent layers evaluate 30-day sequential sliding windows to predict next-day modal trading settlement prices."}
              </p>
            </div>

            {error && (
              <div className="alert-banner error-banner">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="action-button primary-button full-width"
              onClick={runMarketForecast}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spinner" /> {t("market.btn_loading")}
                </>
              ) : (
                <>
                  <TrendingUp size={18} /> {t("market.btn_submit")}
                </>
              )}
            </button>
          </div>

          {/* Spot prices sidebar */}
          <div className="live-spot-prices-card">
            <h4>{t("market.spot_prices_title")}</h4>
            <div className="spot-price-list">
              {spotPrices.map((sp) => (
                <div key={sp.crop} className="spot-price-row">
                  <div>
                    <strong>{sp.crop}</strong>
                    <small>{sp.market}</small>
                  </div>
                  <div className="spot-price-val">
                    <span>{sp.price}</span>
                    <span className={sp.up ? "trend-up-chip" : "trend-down-chip"}>
                      {sp.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("market.results_title")}</div>
              <h2>
                {modelType === "prophet" ? "Prophet Econometric Forecast" : "LSTM Neural Prediction"}
              </h2>
            </div>
            {forecastResult && modelType === "prophet" && (
              <span className="status-pill status-success">
                {forecastResult.days_forecasted}-Day Projection
              </span>
            )}
            {lstmResult && modelType === "lstm" && (
              <span className={`status-pill ${lstmResult.trend === "UP" ? "status-success" : "status-warning"}`}>
                Trend: {lstmResult.trend}
              </span>
            )}
          </div>

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("market.btn_loading")}</h3>
            </div>
          )}

          {!loading && modelType === "prophet" && forecastResult && (
            <div className="forecast-output-body">
              {/* Top Summary Stat */}
              <div className="metric-cards-row">
                <div className="stat-card">
                  <span className="stat-label">{t("market.avg_projected")}</span>
                  <div className="stat-main">
                    <strong>₹{forecastResult.average_predicted_price?.toLocaleString()}</strong>
                    <small>/ {t("common.quintals")}</small>
                  </div>
                  <span className="stat-sub">{forecastResult.commodity} ({forecastResult.market})</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">{t("market.momentum")}</span>
                  <div className="stat-main">
                    <strong className={forecastResult.trend_direction === "UPWARD" ? "profit-positive" : "profit-negative"}>
                      {forecastResult.trend_direction}
                    </strong>
                  </div>
                  <span className="stat-sub">Prophet Trend Vector</span>
                </div>
              </div>

              {/* Chart */}
              {renderProphetChart()}

              {/* Market advisory */}
              {forecastResult.market_advisory && (
                <div className="market-advice-box">
                  <div className="advice-header">
                    <Sparkles size={16} />
                    <strong>{t("market.advisory_title")}</strong>
                  </div>
                  <p>{forecastResult.market_advisory}</p>
                </div>
              )}

              {/* Forecast Table */}
              <div className="forecast-table-container">
                <h4>{t("market.daily_expectations")}</h4>
                <div className="forecast-table-scroll">
                  <table className="forecast-table">
                    <thead>
                      <tr>
                        <th>{t("market.date")}</th>
                        <th>{t("market.forecast_price")}</th>
                        <th>{t("market.confidence_interval")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastResult.predictions?.map((row, i) => (
                        <tr key={i}>
                          <td>{row.date}</td>
                          <td>
                            <strong>₹{(row.predicted_price ?? 0).toLocaleString()}</strong>
                          </td>
                          <td className="interval-cell">
                            <span>₹{(row.lower_bound ?? 0).toLocaleString()}</span>
                            {" - "}
                            <span>₹{(row.upper_bound ?? 0).toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && modelType === "lstm" && lstmResult && (
            <div className="forecast-output-body">
              <div className="primary-crop-card">
                <div className="primary-crop-header">
                  <div>
                    <span className="crop-tag">LSTM NEXT-SETTLEMENT PREDICTION</span>
                    <h3 className="primary-crop-name">{lstmResult.commodity}</h3>
                    <small>{lstmResult.market}</small>
                  </div>
                  <div className="match-score-badge">
                    <span className="score-val">₹{(lstmResult.predicted_next_price ?? 0).toLocaleString()}</span>
                    <span className="score-lbl">Predicted Next Day</span>
                  </div>
                </div>
                <div className="lstm-comparison-strip">
                  <div>
                    <span>Prior 30-Day Benchmark</span>
                    <strong>₹{(lstmResult.latest_historical_price ?? 0).toLocaleString()} / quintal</strong>
                  </div>
                  <div>
                    <span>Expected Shift</span>
                    <strong className={lstmResult.trend === "UP" ? "profit-positive" : "profit-negative"}>
                      {lstmResult.predicted_change_pct > 0 ? "+" : ""}
                      {lstmResult.predicted_change_pct}% ({lstmResult.trend})
                    </strong>
                  </div>
                </div>
                <p className="crop-rationale">{lstmResult.advisory}</p>
              </div>

              <div className="model-context-card">
                <div className="context-card-top">
                  <ShieldCheck size={16} />
                  <strong>LSTM Architecture Information</strong>
                </div>
                <p>
                  Evaluated with <code>mandi_price_lstm.keras</code> using 30 historical time steps scaled with MinMax transform. Model captures short-term auto-regressive momentum and volume shifts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

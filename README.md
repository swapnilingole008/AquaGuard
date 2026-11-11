# AgriGuard - AI-Powered Climate-Smart Agriculture Platform

AgriGuard is a precision agriculture and climate intelligence platform combining deep learning, time-series forecasting, machine learning economics, and multilingual agronomic advisories across 23 regional Indian languages.

---

## Quickstart

### 1. Install Dependencies
```bash
# Frontend dependencies
npm install

# Python backend & ML dependencies
pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
WEATHER_PROVIDER=openweathermap
HOST=127.0.0.1
PORT=8000
```
> **Note:** The application includes full offline agronomic fallbacks and calibrated agro-meteorological station telemetry, so it works seamlessly even without third-party API keys configured.

### 3. Run the Servers
Open two terminal tabs:

**Backend Server (FastAPI):**
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
# or
npm run server
```

**Frontend Dev Server (Vite):**
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Integrated Machine Learning & AI Models

| # | Model | Framework | Purpose | Files in `models/` |
|---|---|---|---|---|
| **1** | **CNN** | TensorFlow / Keras 3 | Identifies 38 distinct crop diseases from leaf photos | `crop_disease_cnn.h5`, `crop_disease_classes.json` |
| **2** | **XGBoost** | XGBoost + Scikit-Learn | Predicts crop yield (tonnes/ha), production, costs, revenue & net profit | `xgboost_crop_yield.json`, `crop_yield_feature_scaler.json` |
| **3** | **LSTM** | TensorFlow / Keras 3 | Sequential short-term mandi price & market trend forecasting from 30-day windows | `mandi_price_lstm.keras`, `mandi_lstm_scaler.json` |
| **4** | **Prophet** | Meta Prophet | Multi-day time-series forecasting with agricultural harvest seasonality and confidence bands | `prophet_mandi_forecast.json`, `prophet_mandi_forecast.pkl` |
| **5** | **Risk Engine** | Agronomic Rule Engine | Real-time evaluations for irrigation deficit, drought, flood, storm, and heatwave alerts | `risk_engine.py`, `risk_engine_rules.json` |
| **6** | **Gemini / LLM** | Google Gemini + Kisan Mitra | Multilingual farmer advisory, query understanding, and ML model explainability | `gemini_config.json`, `gemini_advisory_engine.py` |

---

## Verification & Test Suites

You can run direct validation tests across all features, models, endpoints, and language dictionaries:

```bash
# 1. Test all 6 Machine Learning models directly
python test_models.py

# 2. Test all 11 FastAPI backend REST endpoints
python test_api.py

# 3. Test all 23 language dictionaries and RTL scripts
python test_multilingual.py

# 4. End-to-end full-stack test through Vite (:5173) and proxy (:8000)
python test_e2e_vite.py
```

---

## Full-Stack Architecture

```
BitSparx/
├── backend/
│   ├── main.py              # FastAPI application (11 REST endpoints)
│   ├── gemini_service.py    # Gemini LLM advisory & agronomic knowledge engine
│   └── weather_service.py   # Live & calibrated ag-weather telemetry
├── models/
│   ├── model_loader.py      # Unified ModelHub singleton loader
│   ├── crop_disease_cnn.h5  # TensorFlow CNN leaf disease model (82.5 MB)
│   ├── xgboost_crop_yield.json # Precision agriculture XGBoost regressor
│   ├── mandi_price_lstm.keras  # Keras sequential LSTM mandi price predictor
│   ├── prophet_mandi_forecast.json # Serialized Prophet time-series model
│   └── risk_engine.py       # Rule-based threshold risk engine
├── src/
│   ├── components/          # 10 React Dashboard tabs & Vite proxy API client
│   ├── i18n/                # 23 regional language dictionaries with RTL support
│   ├── App.jsx              # Main responsive layout with quick KPI stats
│   └── dashboard.css        # Clean responsive styles
├── vite.config.js           # Vite dev server configuration with /api proxy
├── package.json             # React 18 + Lucide + Vite
├── requirements.txt         # Python ML dependencies
└── test_e2e_vite.py         # Full-stack automated verification suite
```

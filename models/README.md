# BitSparx Agri-AI Model Suite

This directory contains the production-ready machine learning, deep learning, time-series forecasting, rule-based reasoning, and LLM advisory models for the agricultural intelligence platform.

---

## Model Inventory & Specification

| # | Model | Files | Source / Framework | Purpose |
|---|---|---|---|---|
| **1** | **CNN (TensorFlow/Keras)** | `crop_disease_cnn.h5`<br>`crop_disease_classes.json` | Hugging Face (`rishabh914/leaf-disease-detection`) / Keras 3 | Identifies 38 distinct crop leaf diseases from uploaded images with high confidence scores. |
| **2** | **XGBoost Regressor** | `xgboost_crop_yield.json`<br>`xgboost_crop_yield.pkl`<br>`crop_yield_feature_scaler.json` | AgriSense / Precision Agriculture XGBoost | Predicts crop yield (kg/ha, tonnes/ha), estimated total production, cultivation cost, and projected net profit. |
| **3** | **LSTM (Deep Learning)** | `mandi_price_lstm.keras`<br>`mandi_price_lstm.h5`<br>`mandi_lstm_scaler.json` | Sequential 2-layer LSTM trained on Agmarknet Mandi timeseries | Forecasts next-day/short-term mandi modal prices and market trend direction from rolling 30-day windows. |
| **4** | **Prophet (Meta)** | `prophet_mandi_forecast.json`<br>`prophet_mandi_forecast.pkl` | Meta Prophet with weekly & yearly agricultural seasonality | Multi-day forward time-series forecasting of mandi prices, upper/lower uncertainty bounds, and demand trends. |
| **5** | **Rule-Based Risk Engine** | `risk_engine_rules.json`<br>`risk_engine.py` | Agronomic Expert System | Evaluates sensor & weather telemetry against calibrated thresholds to issue irrigation, drought, flood, and weather alerts. |
| **6** | **Gemini / LLM Advisory** | `gemini_config.json`<br>`gemini_advisory_engine.py` | Google Gemini API + Prompt Synthesis | Understands farmer queries in regional languages, translates ML predictions into step-by-step agronomy advice, and provides explainability. |

---

## Quickstart Usage

You can load and run inference on any of the models using the unified `hub` in `model_loader.py`:

```python
from models import hub

# 1. Leaf Disease Detection (CNN)
results = hub.predict_leaf_disease("sample_leaf.jpg", top_k=3)
print(results)
# Output: [{'crop': 'Tomato', 'disease': 'Late blight', 'confidence_pct': 96.4}, ...]

# 2. Crop Yield & Profitability (XGBoost)
yield_data = hub.predict_crop_yield({
    'crop': 'Rice',
    'rainfall': 350.0,
    'temperature': 27.5,
    'nitrogen': 80.0,
    'phosphorus': 40.0,
    'potassium': 40.0,
    'area_acres': 3.0,
    'cost_per_acre': 15000.0,
    'mandi_rate_per_quintal': 2600.0
})
print(yield_data)

# 3. Mandi Price Sequential Forecast (LSTM)
lstm_forecast = hub.predict_next_mandi_price(last_30_days_prices)
print(lstm_forecast)

# 4. Long-Range Trend Forecast (Prophet)
prophet_forecast = hub.forecast_mandi_prices_prophet(horizon_days=14)
print(prophet_forecast)

# 5. Risk & Disaster Alert Assessment
risk_engine = hub.get_risk_engine()
alerts = risk_engine.evaluate({
    'soil_type': 'loamy',
    'soil_moisture_pct': 18.0,
    'rainfall_24h_mm': 80.0,
    'consecutive_dry_days': 12,
    'temp_c': 32.0,
    'humidity_pct': 88.0,
    'wind_speed_kmh': 16.0
})
print(alerts)

# 6. Farmer Conversational Advisory (Gemini)
advisor = hub.get_gemini_advisor()
advisory_text = advisor.explain_disease('Tomato___Late_blight', 96.4, crop='Tomato')
print(advisory_text)
```

---

## Verification Test

To verify all 6 models in one command:

```bash
python test_models.py
```


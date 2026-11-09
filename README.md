# AgriGuard Farmer Dashboard

A responsive React + Vite dashboard concept based on the AgriGuard hackathon proposal.

## Run locally

1. Install Node.js (18+ recommended).
2. Extract this folder and open it in VS Code.
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite.

## Included

- Green agricultural visual theme.
- Responsive left sidebar with all 10 AgriGuard modules.
- Farmer dashboard landing page.
- Weather summary and forecast preview.
- Farm overview and crop status.
- Soil moisture, crop health and risk metric cards.
- Irrigation recommendation panel.
- Recent alerts.
- Mandi price snapshot.
- Responsive mobile sidebar.

## Important integration notes

This is a frontend starter with illustrative demo data. It does not yet connect to live services or trained ML models.

Replace sample values in `src/App.jsx` with API responses from your FastAPI backend. Suggested integration points:

- Weather: IMD / Open-Meteo.
- Mandi prices: Agmarknet or another verified market data provider.
- Disease detection: TensorFlow CNN inference endpoint.
- Yield and profit: XGBoost inference endpoint.
- Price forecasting: LSTM / Prophet inference endpoint.
- AI assistant: Gemini API through your backend (do not expose API keys in React).
- Authentication: Firebase Authentication.
- Farm and geospatial data: PostgreSQL + PostGIS.

The farmer name, farm location, crop, metrics, alerts and market prices are placeholders for UI demonstration. Verify live data and predictions before presenting them as real advice.

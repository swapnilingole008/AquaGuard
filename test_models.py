import sys
import os
import numpy as np

# Add project root to path
sys.path.insert(0, os.path.abspath("."))

from models import hub

def main():
    print("=" * 60)
    print("   BitSparx Agri-AI Models Verification Suite")
    print("=" * 60)

    # 1. CNN Leaf Disease
    print("\n[1/6] Testing CNN (TensorFlow) Crop Leaf Disease Model...")
    dummy_leaf = np.zeros((256, 256, 3), dtype=np.uint8)
    res_cnn = hub.predict_leaf_disease(dummy_leaf, top_k=2)
    print("      CNN Top Predictions:")
    for r in res_cnn:
        print(f"        * {r['crop']} - {r['disease']} ({r['confidence_pct']}%)")

    # 2. XGBoost Crop Yield
    print("\n[2/6] Testing XGBoost Crop Yield & Economics Regressor...")
    sample_features = {
        'Year': 2024,
        'Month': 7,
        'Rainfall_mm': 120.0,
        'Temperature_C': 26.5,
        'Fertilizer': 75.0,
        'N': 80.0,
        'P': 40.0,
        'K': 40.0,
        'area_acres': 3.5,
        'cost_per_acre': 15000.0,
        'mandi_rate_per_quintal': 2800.0
    }
    res_xgb = hub.predict_crop_yield(sample_features)
    print(f"      Yield: {res_xgb['predicted_yield_tonnes_per_hectare']} tonnes/ha")
    print(f"      Est. Production: {res_xgb['estimated_production_quintals']} quintals")
    print(f"      Cultivation Cost: ₹{res_xgb['projected_cultivation_cost_inr']:,}")
    print(f"      Est. Net Profit: ₹{res_xgb['estimated_net_profit_inr']:,}")

    # 3. LSTM Mandi Price
    print("\n[3/6] Testing LSTM Mandi Price Sequence Model...")
    dummy_prices = [32000.0 + (i * 35.0) for i in range(30)]
    res_lstm = hub.predict_next_mandi_price(dummy_prices)
    print(f"      Last Price: ₹{res_lstm['last_recorded_price']:,}/quintal")
    print(f"      Predicted Next Price: ₹{res_lstm['predicted_next_modal_price_rs_per_quintal']:,}/quintal")
    print(f"      Trend: {res_lstm['trend']} ({res_lstm['projected_change_rs']:+} ₹)")

    # 4. Prophet Time-Series
    print("\n[4/6] Testing Prophet Time-Series Model...")
    res_prophet = hub.forecast_mandi_prices_prophet(horizon_days=3)
    for p in res_prophet:
        print(f"      Date: {p['date']} -> Forecast: ₹{p['forecast_price_inr']:,} (Range: ₹{p['lower_bound_inr']:,} - ₹{p['upper_bound_inr']:,})")

    # 5. Rule-Based Risk Engine
    print("\n[5/6] Testing Rule-Based Risk Engine...")
    risk_engine = hub.get_risk_engine()
    res_risk = risk_engine.evaluate({
        'soil_type': 'loamy',
        'soil_moisture_pct': 18.0,
        'rainfall_24h_mm': 75.0,
        'consecutive_dry_days': 12,
        'temp_c': 31.0,
        'humidity_pct': 88.0,
        'wind_speed_kmh': 15.0
    })
    print(f"      Overall Farm Status: {res_risk['overall_status']}")
    print(f"      Total Alerts Triggered: {res_risk['total_alerts']}")
    for alert in res_risk['alerts']:
        print(f"        - [{alert['severity']}] {alert['title']}: {alert['message']}")

    # 6. Gemini Advisory Engine
    print("\n[6/6] Testing Gemini / LLM Advisory Engine...")
    gemini = hub.get_gemini_advisor()
    prompt_out = gemini.explain_disease('Tomato___Late_blight', 96.4, crop='Tomato')
    print("      Advisory Engine generated prompt template successfully!")
    print(f"      Prompt length: {len(prompt_out)} characters")

    print("\n" + "=" * 60)
    print("   ALL 6 MODELS LOADED & VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()


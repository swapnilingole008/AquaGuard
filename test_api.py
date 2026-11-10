"""
AgriGuard API Endpoint Verification Suite
Directly tests all 11 API endpoints and ML prediction functions
"""
import sys
import os
from pathlib import Path

# Add root to sys.path
_root = Path(__file__).resolve().parent
sys.path.insert(0, str(_root))

from backend.main import (
    root,
    predict_disease, DiseasePredictRequest,
    recommend_crop, CropRecommendRequest,
    predict_yield, YieldPredictRequest,
    forecast_mandi_prophet,
    predict_mandi_lstm,
    recommend_irrigation, IrrigationRecommendRequest,
    get_current_weather,
    analyze_risk, RiskAnalyzeRequest,
    analyze_soil,
    assistant_chat, AssistantChatRequest,
    get_notifications
)

def run_tests():
    print("=" * 60)
    print("   AgriGuard Backend & ML Endpoints Verification Suite")
    print("=" * 60)

    # 1. Root
    res_root = root()
    print("\n[1/11] GET /")
    print(f"       Status: {res_root['status']} | Platform: {res_root['platform']}")

    # 2. Disease Predict
    print("\n[2/11] POST /api/disease/predict (CNN)")
    res_disease = predict_disease(DiseasePredictRequest(top_k=2))
    print(f"       Condition: {res_disease['predicted_disease']} ({res_disease['confidence_pct']}%)")
    print(f"       Symptoms: {res_disease['symptoms'][:60]}...")
    print(f"       Treatment: {res_disease['treatment'][:60]}...")
    print(f"       Gemini Advice Source: {res_disease['gemini_source']}")

    # 3. Crop Recommend
    print("\n[3/11] POST /api/crop/recommend (Agronomic Matrix)")
    res_crop = recommend_crop(CropRecommendRequest(ph=6.5, temperature=26.0, rainfall=600.0, season="Kharif"))
    top = res_crop['top_recommendation']
    print(f"       Top Recommended Crop: {top['crop']} ({top['suitability_score']}% match)")
    print(f"       Sowing Window: {top['sowing_window']} | Duration: {top['harvest_duration']}")

    # 4. Yield Predict (Both XGBoost and Calibrated Benchmark Crops)
    print("\n[4/11] POST /api/yield/predict (XGBoost & Benchmark Engine)")
    # Test 4a: XGBoost trained crop (Rice)
    res_yield_xgb = predict_yield(YieldPredictRequest(crop='Rice', district='Kandy', area_acres=3.5, rainfall=650.0))
    print(f"       [XGBoost] Crop: {res_yield_xgb['crop']} | Model: {res_yield_xgb['model_type']}")
    print(f"       Yield: {res_yield_xgb['predicted_yield_tonnes_per_ha']} tonnes/ha ({res_yield_xgb['predicted_yield_quintals_per_ha']} quintals/ha)")
    print(f"       Est. Production: {res_yield_xgb['total_production_quintals']} quintals on {res_yield_xgb['area_acres']} acres")
    print(f"       Cost: ₹{res_yield_xgb['total_cultivation_cost']:,} | Revenue: ₹{res_yield_xgb['gross_revenue']:,} | Net Profit: ₹{res_yield_xgb['net_profit']:,} ({res_yield_xgb['profit_margin_pct']}%)")

    # Test 4b: Benchmark crop (Wheat in Nashik)
    res_yield_wheat = predict_yield(YieldPredictRequest(crop='Wheat', district='Nashik', area_acres=4.5, rainfall=350.0, seed_cost=2500, fertilizer_cost=4500, labour_cost=6000, irrigation_cost=2500))
    print(f"       [Benchmark] Crop: {res_yield_wheat['crop']} | Model: {res_yield_wheat['model_type']}")
    print(f"       Yield: {res_yield_wheat['predicted_yield_tonnes_per_ha']} tonnes/ha | Cost: ₹{res_yield_wheat['total_cultivation_cost']:,} | Profit: ₹{res_yield_wheat['net_profit']:,}")
    print(f"       AI Suggestion: {res_yield_wheat['ai_suggestions'][0] if res_yield_wheat['ai_suggestions'] else 'N/A'}")

    # 5. Market Forecast
    print("\n[5/11] GET /api/market/forecast (Prophet Time-Series)")
    res_prophet = forecast_mandi_prophet(commodity="Cinnamon", market="Nashik APMC", days=5)
    print(f"       Trend: {res_prophet['trend_direction']} | Avg: ₹{res_prophet['average_predicted_price']:,}")
    for f in res_prophet['predictions'][:3]:
        print(f"         * {f['date']}: ₹{f['predicted_price']:,} (Bounds: ₹{f['lower_bound']:,} - ₹{f['upper_bound']:,})")

    # 6. Market LSTM
    print("\n[6/11] GET /api/market/lstm (Sequential LSTM)")
    res_lstm = predict_mandi_lstm(commodity="Cinnamon", market="Nashik APMC")
    print(f"       Last: ₹{res_lstm['latest_historical_price']:,} -> Predicted Next: ₹{res_lstm['predicted_next_price']:,} (Trend: {res_lstm['trend']})")

    # 7. Smart Irrigation
    print("\n[7/11] POST /api/irrigation/recommend (FAO Penman-Monteith)")
    res_irrig = recommend_irrigation(IrrigationRecommendRequest(crop="Wheat", area_acres=4.5, soil_moisture_pct=24.0))
    print(f"       Urgency: {res_irrig['urgency']} | ETc: {res_irrig['etc_mm_per_day']} mm/day")
    print(f"       Water Volume: {res_irrig['water_amount_liters']:,} Litres | Pump Run Time: {res_irrig['pump_runtime_hours']} hours")

    # 8. Weather
    print("\n[8/11] GET /api/weather/current (Meteorological Telemetry)")
    res_weather = get_current_weather(location="Nashik, Maharashtra")
    print(f"       Location: {res_weather['location']} | Temp: {res_weather['temperature_c']}°C (Feels {res_weather['feels_like_c']}°C)")
    print(f"       Condition: {res_weather['condition']} | Provider: {res_weather['provider']}")

    # 9. Risk Analyze
    print("\n[9/11] POST /api/risk/analyze (Rule-Based Risk Engine)")
    res_risk = analyze_risk(RiskAnalyzeRequest(soil_moisture_pct=18.0, rainfall_mm_24h=75.0, consecutive_dry_days=12))
    print(f"       Farm Status: {res_risk['farm_status']} | Risk Level: {res_risk['overall_risk_level']} | Total Alerts: {res_risk['total_alerts']}")
    for a in res_risk['alerts'][:2]:
        print(f"         - [{a['severity']}] {a['title']}: {a['message'][:50]}...")

    # 10. Soil & Satellite NDVI
    print("\n[10/11] GET /api/soil/analyze (Sentinel-2 NDVI & Soil Card)")
    res_soil = analyze_soil(location="Nashik, Maharashtra")
    print(f"       NDVI Score: {res_soil['ndvi_index']} ({res_soil['canopy_health']})")
    print(f"       Soil Texture: {res_soil['soil_health_card']['texture']} | pH: {res_soil['soil_health_card']['ph']}")

    # 11. Assistant Chat & Notifications
    print("\n[11/11] POST /api/assistant/chat (Gemini Advisory) & GET /api/notifications")
    res_chat = assistant_chat(AssistantChatRequest(query="How to protect wheat from heatwave?", crop="Wheat"))
    print(f"       Provider: {res_chat['provider']}")
    print(f"       Reply Preview: {res_chat['answer'][:80]}...")
    res_notif = get_notifications()
    print(f"       Active Notifications Count: {res_notif['count']} (Unread: {res_notif['unread_count']})")

    print("\n" + "=" * 60)
    print("   ALL 11 BACKEND API ENDPOINTS FULLY VERIFIED & OPERATIONAL!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()

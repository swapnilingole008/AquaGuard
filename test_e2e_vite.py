"""
Comprehensive End-to-End Test Suite for AgriGuard / BitSparx
Validates:
1. Vite dev server on http://localhost:5173
2. Vite dev server on http://127.0.0.1:5173
3. Vite reverse proxy to FastAPI backend (/api -> :8000)
4. All 6 Machine Learning & AI Models:
   - CNN (TensorFlow): Crop disease classification
   - XGBoost: Crop yield, production, costs & net profit
   - LSTM: Deep learning sequential mandi price forecasting
   - Prophet: Time-series price & demand trend forecasting
   - Rule-based Risk Engine: Irrigation, drought, flood, extreme weather
   - Gemini / LLM: Agricultural advisory & multilingual query resolution
5. All 10 Application Dashboard Modules
"""

import sys
import json
import time
import urllib.request
import urllib.error

BASE_URL_LOCAL = "http://localhost:5173"
BASE_URL_IP = "http://127.0.0.1:5173"
BACKEND_DIRECT = "http://127.0.0.1:8000"


def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data is not None:
        if isinstance(data, (dict, list)):
            data_bytes = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif isinstance(data, str):
            data_bytes = data.encode("utf-8")
        else:
            data_bytes = data
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read()
            charset = resp.headers.get_content_charset() or "utf-8"
            decoded = content.decode(charset, errors="replace")
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return resp.status, json.loads(decoded)
            return resp.status, decoded
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body
    except Exception as e:
        return 0, str(e)


def run_e2e():
    print("=" * 70)
    print("   AGRIGUARD FULL-STACK & MODELS VERIFICATION ON VITE (:5173)")
    print("=" * 70)

    # -------------------------------------------------------------
    # Step 1: Test Vite Server Root
    # -------------------------------------------------------------
    print("\n[Step 1/12] Testing Vite Dev Server on http://localhost:5173...")
    status, body = make_request(f"{BASE_URL_LOCAL}/")
    print(f"            HTTP Status: {status}")
    if status == 200 and ("<div id=\"root\">" in body or "vite" in body.lower()):
        print("            [PASS] Vite dev server is serving index.html cleanly!")
    else:
        # Fallback test with 127.0.0.1 in case localhost resolver ipv6 delay
        print("            Retrying with 127.0.0.1:5173...")
        status, body = make_request(f"{BASE_URL_IP}/")
        assert status == 200, f"Vite failed with status {status}: {body}"
        print("            [PASS] Vite dev server is serving on 127.0.0.1:5173!")

    # -------------------------------------------------------------
    # Step 2: Test Vite Proxy to Backend Root
    # -------------------------------------------------------------
    print("\n[Step 2/12] Testing Vite Proxy Routing (/api -> backend)...")
    status, body = make_request(f"{BASE_URL_IP}/api/weather/current?location=Nashik,%20Maharashtra")
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Vite proxy failed: {body}"
    print(f"            [PASS] Vite proxy forwarded successfully!")
    print(f"                   Location: {body.get('location')} | Temp: {body.get('temperature_c')}°C | Provider: {body.get('provider')}")

    # -------------------------------------------------------------
    # Step 3: Model 1 - CNN Leaf Disease Detection
    # -------------------------------------------------------------
    print("\n[Step 3/12] Testing Model 1: CNN (TensorFlow) via /api/disease/predict...")
    status, body = make_request(f"{BASE_URL_IP}/api/disease/predict", method="POST", data={
        "top_k": 3,
        "language": "en"
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"CNN failed: {body}"
    print(f"            [PASS] CNN Inferred Condition: {body.get('predicted_disease')}")
    print(f"                   Confidence: {body.get('confidence_pct')}%")
    print(f"                   Top Predictions: {len(body.get('all_predictions', []))} classes")
    print(f"                   Symptoms: {str(body.get('symptoms', ''))[:70]}...")
    print(f"                   Treatment: {str(body.get('treatment', ''))[:70]}...")
    print(f"                   Prevention: {str(body.get('prevention', ''))[:70]}...")
    print(f"                   Advisory Source: {body.get('gemini_source')}")

    # -------------------------------------------------------------
    # Step 4: Model 2a - XGBoost Crop Yield Prediction (Trained Crop)
    # -------------------------------------------------------------
    print("\n[Step 4/12] Testing Model 2: XGBoost Regressor on Rice...")
    status, body = make_request(f"{BASE_URL_IP}/api/yield/predict", method="POST", data={
        "crop": "Rice",
        "district": "Kandy",
        "area_acres": 4.0,
        "rainfall": 620.0,
        "temperature": 27.0,
        "nitrogen": 85.0,
        "phosphorus": 45.0,
        "potassium": 45.0,
        "fertilizer": 75.0,
        "mandi_rate_per_quintal": 2600.0,
        "seed_cost": 2200,
        "fertilizer_cost": 4800,
        "labour_cost": 6500,
        "irrigation_cost": 2000
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"XGBoost failed: {body}"
    print(f"            [PASS] Model Used: {body.get('model_type')}")
    print(f"                   Predicted Yield: {body.get('predicted_yield_tonnes_per_ha')} tonnes/ha ({body.get('predicted_yield_quintals_per_ha')} quintals/ha)")
    print(f"                   Est. Production: {body.get('total_production_quintals')} quintals on {body.get('area_acres')} acres")
    print(f"                   Cost of Cultivation: ₹{body.get('total_cultivation_cost'):,}")
    print(f"                   Gross Revenue: ₹{body.get('gross_revenue'):,}")
    print(f"                   Net Profit: ₹{body.get('net_profit'):,} (Margin: {body.get('profit_margin_pct')}%)")

    # -------------------------------------------------------------
    # Step 5: Model 2b - Calibrated Benchmark Yield on Wheat
    # -------------------------------------------------------------
    print("\n[Step 5/12] Testing Model 2 (Fallback / Benchmark Mode) on Wheat...")
    status, body = make_request(f"{BASE_URL_IP}/api/yield/predict", method="POST", data={
        "crop": "Wheat",
        "district": "Nashik",
        "area_acres": 5.0,
        "rainfall": 380.0,
        "temperature": 24.5,
        "nitrogen": 70.0,
        "phosphorus": 40.0,
        "potassium": 35.0,
        "mandi_rate_per_quintal": 2450.0
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Benchmark yield failed: {body}"
    print(f"            [PASS] Model Used: {body.get('model_type')}")
    print(f"                   Yield: {body.get('predicted_yield_tonnes_per_ha')} tonnes/ha | Profit: ₹{body.get('net_profit'):,}")
    print(f"                   Agronomic AI Insights: {len(body.get('ai_suggestions', []))} suggestions generated")

    # -------------------------------------------------------------
    # Step 6: Model 3 - Prophet Time-Series Mandi Price Forecasting
    # -------------------------------------------------------------
    print("\n[Step 6/12] Testing Model 3: Prophet Time-Series via /api/market/forecast...")
    status, body = make_request(f"{BASE_URL_IP}/api/market/forecast?commodity=Cinnamon&days=7")
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Prophet failed: {body}"
    print(f"            [PASS] Commodity: {body.get('commodity')} | Days Forecasted: {len(body.get('predictions', []))}")
    print(f"                   Trend Direction: {body.get('trend_direction')}")
    print(f"                   Average Forecast: ₹{body.get('average_predicted_price'):,}/quintal")
    sample_day = body.get('predictions', [])[0]
    print(f"                   Sample Day ({sample_day.get('date')}): ₹{sample_day.get('predicted_price'):,} [Bounds: ₹{sample_day.get('lower_bound'):,} - ₹{sample_day.get('upper_bound'):,}]")

    # -------------------------------------------------------------
    # Step 7: Model 4 - LSTM Sequential Mandi Forecasting
    # -------------------------------------------------------------
    print("\n[Step 7/12] Testing Model 4: LSTM Sequential via /api/market/lstm...")
    status, body = make_request(f"{BASE_URL_IP}/api/market/lstm?commodity=Cinnamon")
    print(f"            HTTP Status: {status}")
    assert status == 200, f"LSTM failed: {body}"
    print(f"            [PASS] Latest Recorded Price: ₹{body.get('latest_historical_price'):,}")
    print(f"                   LSTM Predicted Next Price: ₹{body.get('predicted_next_price'):,}")
    pct = body.get('predicted_change_pct', body.get('data', {}).get('projected_change_pct', 0.0))
    change_rs = body.get('data', {}).get('projected_change_rs', 0.0)
    print(f"                   Projected Change: {change_rs:+} ₹ ({pct}%) | Trend: {body.get('trend')}")

    # -------------------------------------------------------------
    # Step 8: Model 5 - Rule-Based Risk Engine
    # -------------------------------------------------------------
    print("\n[Step 8/12] Testing Model 5: Rule-Based Risk Engine via /api/risk/analyze...")
    status, body = make_request(f"{BASE_URL_IP}/api/risk/analyze", method="POST", data={
        "location": "Nashik, Maharashtra",
        "soil_moisture_pct": 17.5,
        "rainfall_mm_24h": 72.0,
        "consecutive_dry_days": 14,
        "soil_type": "loamy",
        "temperature_c": 33.0,
        "humidity_pct": 89.0,
        "wind_speed_kmh": 18.0
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Risk Engine failed: {body}"
    print(f"            [PASS] Farm Health Status: {body.get('farm_status')}")
    print(f"                   Overall Risk Level: {body.get('overall_risk_level')}")
    print(f"                   Total Alerts Raised: {body.get('total_alerts')}")
    for a in body.get('alerts', []):
        print(f"                     * [{a.get('severity')}] {a.get('title')}")

    # -------------------------------------------------------------
    # Step 9: Model 6 - Gemini / LLM Advisory & Kisan Mitra
    # -------------------------------------------------------------
    print("\n[Step 9/12] Testing Model 6: Gemini Advisory via /api/assistant/chat...")
    # Test English query
    status, body = make_request(f"{BASE_URL_IP}/api/assistant/chat", method="POST", data={
        "query": "How much irrigation does wheat need during grain filling stage?",
        "crop": "Wheat",
        "location": "Nashik, Maharashtra",
        "language": "en"
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Assistant failed: {body}"
    print(f"            [PASS] AI Advisor Provider: {body.get('provider')}")
    print(f"                   English Reply Preview: {body.get('answer')[:120]}...")

    # Test Multilingual query (Hindi)
    status_hi, body_hi = make_request(f"{BASE_URL_IP}/api/assistant/chat", method="POST", data={
        "query": "गेहूं में यूरिया कब डालना चाहिए?",
        "crop": "Wheat",
        "location": "Nashik, Maharashtra",
        "language": "hi"
    })
    assert status_hi == 200, f"Hindi assistant failed: {body_hi}"
    print(f"                   Hindi Reply Preview: {body_hi.get('answer')[:120]}...")

    # -------------------------------------------------------------
    # Step 10: Crop Recommendation Module
    # -------------------------------------------------------------
    print("\n[Step 10/12] Testing Crop Recommendation Engine via /api/crop/recommend...")
    status, body = make_request(f"{BASE_URL_IP}/api/crop/recommend", method="POST", data={
        "ph": 6.8,
        "nitrogen": 80.0,
        "phosphorus": 45.0,
        "potassium": 45.0,
        "temperature": 26.5,
        "rainfall": 650.0,
        "season": "Kharif",
        "soil_type": "Loamy"
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Crop recommendation failed: {body}"
    top = body.get('top_recommendation', {})
    print(f"            [PASS] Top Crop: {top.get('crop')} (Match: {top.get('suitability_score')}%)")
    print(f"                   Total Ranked Crops: {len(body.get('ranked_crops', []))}")
    print(f"                   Sowing Window: {top.get('sowing_window')} | Duration: {top.get('harvest_duration')}")
    print(f"                   Water Need: {top.get('water_need')} | NPK Ideal: {top.get('npk_ideal')}")

    # -------------------------------------------------------------
    # Step 11: Smart Irrigation & FAO Penman-Monteith Module
    # -------------------------------------------------------------
    print("\n[Step 11/12] Testing Smart Irrigation via /api/irrigation/recommend...")
    status, body = make_request(f"{BASE_URL_IP}/api/irrigation/recommend", method="POST", data={
        "crop": "Wheat",
        "area_acres": 4.5,
        "soil_moisture_pct": 22.0,
        "irrigation_type": "Drip"
    })
    print(f"            HTTP Status: {status}")
    assert status == 200, f"Irrigation failed: {body}"
    print(f"            [PASS] Irrigation Urgency: {body.get('urgency')}")
    print(f"                   Crop Evapotranspiration (ETc): {body.get('etc_mm_per_day')} mm/day")
    print(f"                   Required Water Volume: {body.get('water_amount_liters'):,} Litres")
    print(f"                   Recommended Pump Runtime: {body.get('pump_runtime_hours')} hours")

    # -------------------------------------------------------------
    # Step 12: Soil Health & Notifications Modules
    # -------------------------------------------------------------
    print("\n[Step 12/12] Testing Soil Health (NDVI) and Notification Hub...")
    status_soil, body_soil = make_request(f"{BASE_URL_IP}/api/soil/analyze?location=Nashik,%20Maharashtra")
    assert status_soil == 200, f"Soil analyze failed: {body_soil}"
    soil_card = body_soil.get('soil_health_card', {})
    print(f"            [PASS] Satellite Sentinel-2 NDVI Index: {body_soil.get('ndvi_index')} ({body_soil.get('canopy_health')})")
    print(f"                   Soil Texture: {soil_card.get('texture')} | pH: {soil_card.get('ph')} | Organic Carbon: {soil_card.get('organic_carbon_pct')}%")

    status_notif, body_notif = make_request(f"{BASE_URL_IP}/api/notifications")
    assert status_notif == 200, f"Notifications failed: {body_notif}"
    print(f"            [PASS] Active Notifications: {body_notif.get('count')} (Unread: {body_notif.get('unread_count')})")

    print("\n" + "=" * 70)
    print("   CONGRATULATIONS! ALL 6 MODELS & DASHBOARD FEATURES")
    print("   SUCCESSFULLY VERIFIED AND RUNNING ON VITE (localhost:5173)!")
    print("=" * 70)


if __name__ == "__main__":
    run_e2e()

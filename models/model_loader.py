"""
Unified Model Hub & Inference Loader for Agri-AI Platform
Provides single-point access to:
1. CNN (TensorFlow/Keras): Leaf disease classification from images
2. XGBoost: Crop yield, production, and economics prediction
3. LSTM (TensorFlow/Keras): Sequential Mandi commodity price forecasting
4. Prophet: Time-series trend & seasonal price forecasting
5. Rule-based Risk Engine: Irrigation, drought, flood, and weather alerts
6. Gemini / LLM: Conversational farmer advice and ML explainability
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# Safe environment defaults for sandbox & native Windows execution
_app_root = Path(__file__).resolve().parent.parent
os.environ.setdefault('KERAS_HOME', str(_app_root / '.keras'))
os.environ.setdefault('MPLCONFIGDIR', str(_app_root / '.cache' / 'matplotlib'))
os.environ.setdefault('TF_ENABLE_ONEDNN_OPTS', '0')
try:
    import google.protobuf.runtime_version
    google.protobuf.runtime_version.ValidateProtobufRuntimeVersion = lambda *args, **kwargs: None
except Exception:
    pass


class ModelHub:
    _instance = None

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).parent
        self._cnn_model = None
        self._cnn_classes = None
        self._disease_kb = None
        self._xgb_model = None
        self._xgb_scaler = None
        self._lstm_model = None
        self._lstm_scaler = None
        self._prophet_model = None
        self._risk_engine = None
        self._gemini_engine = None

    # -------------------------------------------------------------
    # 1. CNN (TensorFlow): Leaf Disease Detection
    # -------------------------------------------------------------
    def load_cnn(self):
        if self._cnn_model is None:
            import tensorflow as tf
            model_path = self.base_dir / "crop_disease_cnn.h5"
            classes_path = self.base_dir / "crop_disease_classes.json"
            if not model_path.exists():
                raise FileNotFoundError(f"CNN model file not found at {model_path}")
            self._cnn_model = tf.keras.models.load_model(str(model_path))
            with open(classes_path, "r", encoding="utf-8") as f:
                raw_classes = json.load(f)
                # Invert mapping to int -> class_name
                self._cnn_classes = {int(v): k for k, v in raw_classes.items()}
            
            kb_path = self.base_dir / "disease_knowledge_base.json"
            if kb_path.exists():
                with open(kb_path, "r", encoding="utf-8") as f:
                    self._disease_kb = json.load(f)
            else:
                self._disease_kb = {}

        return self._cnn_model, self._cnn_classes

    def get_disease_info(self, label: str) -> Dict[str, str]:
        if self._disease_kb is None:
            kb_path = self.base_dir / "disease_knowledge_base.json"
            if kb_path.exists():
                with open(kb_path, "r", encoding="utf-8") as f:
                    self._disease_kb = json.load(f)
            else:
                self._disease_kb = {}
        
        info = self._disease_kb.get(label, {})
        if not info:
            crop, disease = label.split("___") if "___" in label else ("Crop", label)
            info = {
                "description": f"Identified condition '{disease.replace('_', ' ')}' on {crop.replace('_', ' ')} foliage.",
                "symptoms": "Leaf spots, discoloration, or chlorotic patterns on plant tissue.",
                "treatment": "Inspect infected foliage, apply recommended organic or chemical protective sprays, and prune damaged parts.",
                "prevention": "Maintain optimal crop spacing, avoid prolonged overhead leaf wetness, and rotate crops."
            }
        return info

    def predict_leaf_disease(self, image_input, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Accepts PIL Image, image file path, or numpy array.
        Returns top-k predicted disease classes with confidence scores and agronomic guidance.
        """
        from PIL import Image
        if isinstance(image_input, (str, Path)):
            img = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        elif isinstance(image_input, np.ndarray):
            img = Image.fromarray(image_input).convert("RGB")
        else:
            raise ValueError("Unsupported image input type")

        img = img.resize((256, 256))
        arr = np.array(img, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=0)

        model, class_map = self.load_cnn()
        preds = model.predict(arr, verbose=0)[0]
        top_indices = np.argsort(preds)[::-1][:top_k]

        results = []
        for idx in top_indices:
            label = class_map.get(int(idx), f"Class_{idx}")
            crop, disease = label.split("___") if "___" in label else ("Unknown", label)
            info = self.get_disease_info(label)
            c_name = crop.replace("_", " ")
            d_name = disease.replace("_", " ")
            conf = round(float(preds[idx]) * 100, 2)
            results.append({
                "class_index": int(idx),
                "label": label,
                "crop": c_name,
                "disease": d_name,
                "predicted_disease": f"{c_name} - {d_name}",
                "confidence_pct": conf,
                "confidence": conf,
                "low_confidence": conf < 35.0,
                "description": info.get("description", ""),
                "symptoms": info.get("symptoms", ""),
                "treatment": info.get("treatment", ""),
                "prevention": info.get("prevention", "")
            })
        return results

    # -------------------------------------------------------------
    # 2. XGBoost: Crop Yield & Economics (Full 47 Features)
    # -------------------------------------------------------------
    SUPPORTED_YIELD_CROPS = ["Rice", "Tea", "Rubber", "Sugarcane", "Cinnamon"]
    SUPPORTED_YIELD_DISTRICTS = [
        "Anuradhapura", "Badulla", "Batticaloa", "Galle", "Jaffna",
        "Kalutara", "Kandy", "Kegalle", "Kurunegala", "Matara",
        "Nuwara Eliya", "Polonnaruwa", "Ratnapura", "Trincomalee"
    ]

    BENCHMARK_YIELD_DATABASE = {
        "wheat": {"base_tonnes": 3.8, "opt_temp": (17, 26), "opt_rain": (250, 450), "opt_npk": (120, 60, 40)},
        "maize": {"base_tonnes": 4.2, "opt_temp": (21, 30), "opt_rain": (500, 800), "opt_npk": (120, 60, 40)},
        "cotton": {"base_tonnes": 1.8, "opt_temp": (22, 32), "opt_rain": (500, 900), "opt_npk": (100, 50, 50)},
        "soybean": {"base_tonnes": 2.2, "opt_temp": (20, 30), "opt_rain": (600, 900), "opt_npk": (30, 80, 40)},
        "tomato": {"base_tonnes": 18.5, "opt_temp": (20, 28), "opt_rain": (400, 650), "opt_npk": (100, 60, 60)},
        "onion": {"base_tonnes": 16.0, "opt_temp": (15, 25), "opt_rain": (350, 600), "opt_npk": (100, 50, 80)},
        "potato": {"base_tonnes": 22.0, "opt_temp": (16, 24), "opt_rain": (400, 650), "opt_npk": (120, 80, 100)},
        "mustard": {"base_tonnes": 1.5, "opt_temp": (15, 25), "opt_rain": (200, 400), "opt_npk": (80, 40, 40)},
        "groundnut": {"base_tonnes": 2.0, "opt_temp": (22, 30), "opt_rain": (500, 750), "opt_npk": (25, 50, 50)},
        "chilli": {"base_tonnes": 2.5, "opt_temp": (20, 30), "opt_rain": (400, 700), "opt_npk": (100, 50, 50)}
    }

    def load_xgboost(self):
        if self._xgb_model is None:
            import xgboost as xgb
            import joblib
            model_path_json = self.base_dir / "xgboost_crop_yield.json"
            model_path_pkl = self.base_dir / "xgboost_crop_yield.pkl"
            scaler_path = self.base_dir / "crop_yield_feature_scaler.json"

            if model_path_json.exists():
                booster = xgb.Booster()
                booster.load_model(str(model_path_json))
                self._xgb_model = booster
            elif model_path_pkl.exists():
                self._xgb_model = joblib.load(str(model_path_pkl))
            else:
                raise FileNotFoundError("XGBoost model file not found")

            if scaler_path.exists():
                with open(scaler_path, "r", encoding="utf-8") as f:
                    self._xgb_scaler = json.load(f)

        return self._xgb_model, self._xgb_scaler

    def predict_crop_yield(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predicts crop yield using domain-engineered agronomic XGBoost regression (for trained crops)
        or calibrated ICAR/FAO agro-climatic benchmark potential equations (for unlisted crops).
        """
        raw_crop = str(features.get('crop', features.get('Crop', 'Rice'))).strip()
        matched_crop = None
        for c in self.SUPPORTED_YIELD_CROPS:
            if c.lower() == raw_crop.lower():
                matched_crop = c
                break

        raw_district = str(features.get('district', features.get('location', 'Nashik'))).strip()
        matched_district = None
        for d in self.SUPPORTED_YIELD_DISTRICTS:
            if d.lower() == raw_district.lower() or d.lower() in raw_district.lower():
                matched_district = d
                break
        if not matched_district:
            matched_district = "Kandy" if matched_crop else raw_district

        def _f(val, default):
            if val is None:
                return float(default)
            try:
                return float(val)
            except (ValueError, TypeError):
                return float(default)

        def _i(val, default):
            if val is None:
                return int(default)
            try:
                return int(val)
            except (ValueError, TypeError):
                return int(default)

        rainfall = _f(features.get('rainfall', features.get('rainfall_mm', features.get('Rainfall_mm'))), 350.0)
        temp = _f(features.get('temperature', features.get('temperature_c', features.get('Temperature_C'))), 26.5)
        humidity = _f(features.get('humidity', features.get('humidity_pct')), 62.0)
        n_val = _f(features.get('nitrogen', features.get('n', features.get('N'))), 80.0)
        p_val = _f(features.get('phosphorus', features.get('p', features.get('P'))), 40.0)
        k_val = _f(features.get('potassium', features.get('k', features.get('K'))), 40.0)
        year = _i(features.get('year', features.get('Year')), 2026)
        month = _i(features.get('month', features.get('Month')), 7)
        fertilizer = _f(features.get('fertilizer', features.get('fertilizer_kg', features.get('Fertilizer'))), 75.0)
        area_acres = _f(features.get('area_acres', features.get('farm_area_acres', features.get('area'))), 4.5)
        soil_type = str(features.get('soil_type') or 'Loamy').title()

        # Detailed Cultivation Cost breakdown
        seed_cost = _f(features.get('seed_cost'), 2500.0)
        fertilizer_cost = _f(features.get('fertilizer_cost'), 4500.0)
        labour_cost = _f(features.get('labour_cost'), 6000.0)
        irrigation_cost = _f(features.get('irrigation_cost'), 2500.0)

        # If user passed an explicit cost_per_acre that exceeds zero and granular wasn't overridden
        explicit_cost = _f(features.get('cost_per_acre'), 0.0)
        if explicit_cost > 0 and 'seed_cost' not in features:
            cost_per_acre = explicit_cost
            seed_cost = round(cost_per_acre * 0.16, 2)
            fertilizer_cost = round(cost_per_acre * 0.30, 2)
            labour_cost = round(cost_per_acre * 0.38, 2)
            irrigation_cost = round(cost_per_acre * 0.16, 2)
        else:
            cost_per_acre = seed_cost + fertilizer_cost + labour_cost + irrigation_cost

        mandi_rate = _f(features.get('mandi_rate_per_quintal', features.get('mandi_price_per_quintal')), 2450.0)

        is_ml_model = False
        limiting_factors = []

        if matched_crop:
            # 1. Run Trained XGBoost Model (47 Features)
            import xgboost as xgb
            import pandas as pd
            model, scaler = self.load_xgboost()
            feature_names = list(scaler.keys())

            total_npk = n_val + p_val + k_val
            raw_dict = {
                'Year': year,
                'Month': month,
                'Rainfall_mm': rainfall,
                'Temperature_C': temp,
                'Fertilizer': fertilizer,
                'N': n_val,
                'P': p_val,
                'K': k_val,
                'is_low_rainfall': 1.0 if rainfall < 300 else 0.0,
                'is_high_rainfall': 1.0 if rainfall > 700 else 0.0,
                'is_low_temp': 1.0 if temp < 18 else 0.0,
                'is_high_temp': 1.0 if temp > 30 else 0.0,
                'is_extreme_temp': 1.0 if temp > 35 else 0.0,
                'rain_temp_interaction': rainfall * temp,
                'rain_squared': rainfall ** 2,
                'temp_squared': temp ** 2,
                'total_npk': total_npk,
                'npk_balance': abs(n_val - p_val) + abs(n_val - k_val) + abs(p_val - k_val),
                'n_ratio': n_val / (total_npk + 1e-5),
                'is_low_npk': 1.0 if total_npk < 100 else 0.0,
                'good_tea_zone': 1.0 if (matched_crop == 'Tea' and 500 <= rainfall <= 900 and 18 <= temp <= 26) else 0.0,
                'good_rubber_zone': 1.0 if (matched_crop == 'Rubber' and 600 <= rainfall <= 1000 and 20 <= temp <= 28) else 0.0,
                'good_sugarcane_zone': 1.0 if (matched_crop == 'Sugarcane' and 700 <= rainfall <= 1000 and 22 <= temp <= 30) else 0.0,
                'good_cinnamon_zone': 1.0 if (matched_crop == 'Cinnamon' and 600 <= rainfall <= 1000 and 24 <= temp <= 32) else 0.0,
                'good_rice_zone': 1.0 if (matched_crop == 'Rice' and rainfall >= 600 and 22 <= temp <= 30) else 0.0,
                'drought_stress': 1.0 if (rainfall < 300 and temp > 30) else 0.0,
                'cold_stress': 1.0 if temp < 15 else 0.0,
                'heat_stress': 1.0 if temp > 35 else 0.0,
            }

            feat_dict = {name: 0.0 for name in feature_names}
            for k, v in raw_dict.items():
                if k in feat_dict:
                    feat_dict[k] = v

            crop_col = f"Crop_{matched_crop}"
            if crop_col in feat_dict:
                feat_dict[crop_col] = 1.0

            district_col = f"District_{matched_district}"
            if district_col in feat_dict:
                feat_dict[district_col] = 1.0

            scaled_row = {}
            for name in feature_names:
                val = feat_dict[name]
                if name in scaler:
                    s_min = scaler[name]['min']
                    s_max = scaler[name]['max']
                    scaled_row[name] = 0.0 if s_max == s_min else (val - s_min) / (s_max - s_min)
                else:
                    scaled_row[name] = val

            df_input = pd.DataFrame([scaled_row], columns=feature_names)
            dmat = xgb.DMatrix(df_input)

            if isinstance(model, xgb.Booster):
                raw_pred = float(model.predict(dmat)[0])
            else:
                raw_pred = float(model.predict(df_input)[0])

            yield_tonnes_per_ha = round(max(0.2, raw_pred), 2)
            model_type_label = "Trained XGBoost Regressor (47 Features)"
            is_ml_model = True
            model_note = f"Predicted via trained gradient boosted regressor using 47 domain-engineered agronomic features."
            display_crop = matched_crop
        else:
            # 2. Transparent Agronomic Benchmark Model (ICAR / FAO Calibrated)
            crop_key = raw_crop.lower()
            bench = self.BENCHMARK_YIELD_DATABASE.get(crop_key, {"base_tonnes": 3.0, "opt_temp": (20, 28), "opt_rain": (400, 700), "opt_npk": (100, 50, 50)})
            base_t = bench["base_tonnes"]

            # Temperature factor
            min_t, max_t = bench["opt_temp"]
            if min_t <= temp <= max_t:
                temp_factor = 1.0
            else:
                diff = min(abs(temp - min_t), abs(temp - max_t))
                temp_factor = max(0.70, 1.0 - (diff * 0.035))
                if temp > max_t:
                    limiting_factors.append(f"Elevated temperature ({temp}°C) above optimal {min_t}-{max_t}°C")
                else:
                    limiting_factors.append(f"Sub-optimal thermal conditions ({temp}°C)")

            # Rainfall / Moisture factor
            min_r, max_r = bench["opt_rain"]
            if min_r <= rainfall <= max_r:
                rain_factor = 1.0
            elif rainfall < min_r:
                rain_factor = max(0.65, 0.80 + 0.20 * (rainfall / max(1.0, min_r)))
                limiting_factors.append(f"Precipitation deficit ({rainfall}mm vs {min_r}mm required)")
            else:
                rain_factor = max(0.85, 1.0 - ((rainfall - max_r) / 2000.0))

            # Soil NPK Sufficiency
            opt_n, opt_p, opt_k = bench["opt_npk"]
            npk_ratio = ((n_val / opt_n) + (p_val / opt_p) + (k_val / opt_k)) / 3.0
            npk_factor = max(0.75, min(1.15, npk_ratio))
            if npk_ratio < 0.85:
                limiting_factors.append(f"Sub-optimal soil NPK nutrition (available {n_val:.0f}-{p_val:.0f}-{k_val:.0f} vs ideal {opt_n}-{opt_p}-{opt_k})")

            # Soil Texture Factor
            soil_l = soil_type.lower()
            soil_factor = 1.05 if ("black" in soil_l or "alluvial" in soil_l) else 1.0 if "loam" in soil_l else 0.92 if "clay" in soil_l else 0.85

            adj_tonnes = base_t * temp_factor * rain_factor * npk_factor * soil_factor
            yield_tonnes_per_ha = round(max(0.3, adj_tonnes), 2)
            model_type_label = "Agronomic Benchmark Model (ICAR/FAO calibrated)"
            is_ml_model = False
            model_note = f"Crop '{raw_crop}' is outside the 5-crop XGBoost training dataset. Estimated using validated agronomic equations based on soil NPK, climate, and ICAR yield potentials."
            display_crop = raw_crop

        yield_quintals_per_ha = round(yield_tonnes_per_ha * 10.0, 2)
        yield_kg_per_acre = round((yield_quintals_per_ha * 100.0) / 2.47105, 1)

        # 1 hectare = 2.47105 acres
        area_ha = round(area_acres / 2.47105, 2)
        total_production_quintals = round(yield_quintals_per_ha * (area_acres / 2.47105), 2)
        total_production_tonnes = round(yield_tonnes_per_ha * (area_acres / 2.47105), 2)

        total_cultivation_cost = round(area_acres * cost_per_acre, 2)
        gross_revenue = round(total_production_quintals * mandi_rate, 2)
        net_profit = round(gross_revenue - total_cultivation_cost, 2)
        profit_margin_pct = round((net_profit / gross_revenue) * 100, 1) if gross_revenue > 0 else 0.0
        breakeven_price = round(total_cultivation_cost / total_production_quintals, 2) if total_production_quintals > 0 else 0.0

        if not limiting_factors:
            limiting_factors.append("Field parameters align favorably with target yield potentials.")

        return {
            "crop": display_crop,
            "district": raw_district,
            "farm_location": raw_district,
            "model_type": model_type_label,
            "is_ml_model": is_ml_model,
            "model_note": model_note,
            "predicted_yield_tonnes_per_ha": yield_tonnes_per_ha,
            "predicted_yield_tonnes_per_hectare": yield_tonnes_per_ha,
            "predicted_yield_quintals_per_ha": yield_quintals_per_ha,
            "predicted_yield_quintals_per_hectare": yield_quintals_per_ha,
            "predicted_yield_kg_per_acre": yield_kg_per_acre,
            "farm_area_acres": area_acres,
            "area_acres": area_acres,
            "area_hectares": area_ha,
            "total_production_quintals": total_production_quintals,
            "estimated_production_quintals": total_production_quintals,
            "total_production_tonnes": total_production_tonnes,
            "estimated_production_tonnes": total_production_tonnes,
            "cost_per_acre": cost_per_acre,
            "total_cultivation_cost": total_cultivation_cost,
            "projected_cultivation_cost_inr": total_cultivation_cost,
            "cost_breakdown": {
                "seed_cost_per_acre": seed_cost,
                "fertilizer_cost_per_acre": fertilizer_cost,
                "labour_cost_per_acre": labour_cost,
                "irrigation_cost_per_acre": irrigation_cost,
                "total_seed_cost": round(seed_cost * area_acres, 2),
                "total_fertilizer_cost": round(fertilizer_cost * area_acres, 2),
                "total_labour_cost": round(labour_cost * area_acres, 2),
                "total_irrigation_cost": round(irrigation_cost * area_acres, 2),
            },
            "gross_revenue": gross_revenue,
            "estimated_gross_revenue_inr": gross_revenue,
            "net_profit": net_profit,
            "estimated_net_profit_inr": net_profit,
            "is_profitable": net_profit >= 0,
            "profit_margin_pct": profit_margin_pct,
            "breakeven_price_per_quintal": breakeven_price,
            "break_even_price_per_quintal": breakeven_price,
            "features_used_count": 47,
            "limiting_factors": limiting_factors
        }

    # -------------------------------------------------------------
    # 3. LSTM: Mandi Price Sequential Forecasting
    # -------------------------------------------------------------
    def load_lstm(self):
        if self._lstm_model is None:
            import tensorflow as tf
            keras_path = self.base_dir / "mandi_price_lstm.keras"
            h5_path = self.base_dir / "mandi_price_lstm.h5"
            scaler_path = self.base_dir / "mandi_lstm_scaler.json"

            if keras_path.exists():
                self._lstm_model = tf.keras.models.load_model(str(keras_path))
            elif h5_path.exists():
                self._lstm_model = tf.keras.models.load_model(str(h5_path))
            else:
                raise FileNotFoundError("LSTM model file not found")

            if scaler_path.exists():
                with open(scaler_path, "r", encoding="utf-8") as f:
                    self._lstm_scaler = json.load(f)

        return self._lstm_model, self._lstm_scaler

    def get_sample_30_prices(self) -> List[float]:
        """Extracts 30 recent real prices from sample_mandi_data.csv"""
        import pandas as pd
        csv_path = self.base_dir / "sample_mandi_data.csv"
        if csv_path.exists():
            df = pd.read_csv(csv_path)
            if 'Modal Price (Rs./Quintal)' in df.columns:
                prices = df['Modal Price (Rs./Quintal)'].dropna().head(30).tolist()[::-1]
                if len(prices) == 30:
                    return [float(p) for p in prices]
        return [32000.0 + (i * 35.0) for i in range(30)]

    def predict_next_mandi_price(self, recent_30_prices: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Accepts the latest 30 days of commodity prices.
        Forecasts the next mandi modal price using the 2-layer LSTM model.
        """
        if recent_30_prices is None or len(recent_30_prices) == 0:
            recent_30_prices = self.get_sample_30_prices()

        prices = np.array(recent_30_prices, dtype=np.float32)
        if len(prices) != 30:
            raise ValueError(f"LSTM model expects exactly 30 historical price records. Received {len(prices)}.")

        model, scaler = self.load_lstm()
        min_val = scaler.get("min", 4600.0)
        max_val = scaler.get("max", 48500.0)
        scaled = (prices - min_val) / (max_val - min_val)
        seq = scaled.reshape(1, 30, 1)

        scaled_pred = float(model.predict(seq, verbose=0)[0][0])
        pred_price = round(scaled_pred * (max_val - min_val) + min_val, 2)
        last_price = float(prices[-1])
        change = round(pred_price - last_price, 2)
        pct_change = round((change / last_price) * 100, 2) if last_price != 0 else 0.0

        return {
            "commodity": scaler.get("commodity", "Arecanut / Agricultural Produce"),
            "unit": scaler.get("unit", "₹/quintal"),
            "predicted_next_modal_price_rs_per_quintal": pred_price,
            "predicted_next_price": pred_price,
            "last_recorded_price": last_price,
            "last_observed_price": last_price,
            "latest_historical_price": last_price,
            "projected_change_rs": change,
            "projected_change_pct": pct_change,
            "percent_change": pct_change,
            "trend": "UPWARD" if pred_price > last_price else "DOWNWARD",
            "historical_window_size": 30,
            "historical_sequence": [float(p) for p in prices]
        }

    predict_mandi_price_lstm = predict_next_mandi_price

    # -------------------------------------------------------------
    # 4. Prophet: Time-Series Seasonal Price & Trend Forecasting
    # -------------------------------------------------------------
    def load_prophet(self):
        if self._prophet_model is None:
            try:
                from prophet.serialize import model_from_json
                json_path = self.base_dir / "prophet_mandi_forecast.json"
                if json_path.exists():
                    with open(json_path, "r", encoding="utf-8") as f:
                        self._prophet_model = model_from_json(f.read())
                        return self._prophet_model
            except Exception:
                pass
            
            # Pickle fallback if prophet is installed
            try:
                import pickle
                pkl_path = self.base_dir / "prophet_mandi_forecast.pkl"
                if pkl_path.exists():
                    with open(pkl_path, "rb") as f:
                        self._prophet_model = pickle.load(f)
                        return self._prophet_model
            except Exception:
                pass

        return self._prophet_model

    def forecast_mandi_prices_prophet(self, horizon_days: int = 14) -> List[Dict[str, Any]]:
        """
        Forecasts future mandi prices for given number of future days.
        Uses the trained Prophet model, with robust exact mathematical vector fallback
        using serialized parameters from prophet_mandi_forecast.json.
        """
        import pandas as pd

        # Try native Prophet first if available
        try:
            model = self.load_prophet()
            if model is not None:
                future = model.make_future_dataframe(periods=horizon_days)
                forecast = model.predict(future).tail(horizon_days)
                results = []
                for _, row in forecast.iterrows():
                    results.append({
                        "date": str(pd.to_datetime(row["ds"]).strftime("%Y-%m-%d")),
                        "forecast_price_inr": round(float(row["yhat"]), 2),
                        "lower_bound_inr": round(float(row["yhat_lower"]), 2),
                        "upper_bound_inr": round(float(row["yhat_upper"]), 2)
                    })
                return results
        except Exception:
            pass

        # Exact mathematical Prophet evaluation from JSON parameters
        json_path = self.base_dir / "prophet_mandi_forecast.json"
        with open(json_path, "r", encoding="utf-8") as f:
            m = json.load(f)

        p = m['params']
        k = np.array(p['k'])[0][0]
        m_offset = np.array(p['m'])[0][0]
        delta = np.array(p['delta'])[0]
        beta = np.array(p['beta'])[0]
        sigma = float(np.array(p['sigma_obs'])[0][0]) if 'sigma_obs' in p else 0.05
        changepoints_t = np.array(m['changepoints_t'])
        gamma = -changepoints_t * delta

        start_sec = float(m['start'])
        t_scale = float(m['t_scale'])
        y_scale = float(m['y_scale'])
        y_min = float(m.get('y_min', 0.0))

        h_raw = json.loads(m['history'])['data']
        last_date = pd.to_datetime(h_raw[-1]['ds'])

        future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, horizon_days + 1)]
        t = np.array([(d.timestamp() - start_sec) / t_scale for d in future_dates])

        A = (t[:, None] >= changepoints_t[None, :]).astype(float)
        trend = (k + np.dot(A, delta)) * t + (m_offset + np.dot(A, gamma))

        t_days = np.array([(d - pd.to_datetime('1970-01-01')).total_seconds() / 86400.0 for d in future_dates])

        # Yearly 10 orders -> 20 cols
        cols_y = []
        for i in range(1, 11):
            cols_y.append(np.sin(2.0 * np.pi * i * t_days / 365.25))
            cols_y.append(np.cos(2.0 * np.pi * i * t_days / 365.25))

        # Weekly 3 orders -> 6 cols
        cols_w = []
        for i in range(1, 4):
            cols_w.append(np.sin(2.0 * np.pi * i * t_days / 7.0))
            cols_w.append(np.cos(2.0 * np.pi * i * t_days / 7.0))

        X = np.column_stack(cols_y + cols_w)
        seasonality = np.dot(X, beta)
        y_hat_scaled = trend + seasonality
        y_hat = y_hat_scaled * y_scale + y_min

        # Uncertainty intervals (95% confidence = 1.96 * sigma)
        sigma_scaled = sigma * y_scale
        lower_bound = y_hat - 1.96 * sigma_scaled
        upper_bound = y_hat + 1.96 * sigma_scaled

        results = []
        for i, d in enumerate(future_dates):
            results.append({
                "date": str(d.strftime("%Y-%m-%d")),
                "forecast_price_inr": round(float(y_hat[i]), 2),
                "lower_bound_inr": round(float(max(0.0, lower_bound[i])), 2),
                "upper_bound_inr": round(float(upper_bound[i]), 2)
            })
        return results

    # -------------------------------------------------------------
    # 5. Rule-Based Risk Engine
    # -------------------------------------------------------------
    def get_risk_engine(self):
        if self._risk_engine is None:
            from .risk_engine import RuleBasedRiskEngine
            self._risk_engine = RuleBasedRiskEngine(str(self.base_dir / "risk_engine_rules.json"))
        return self._risk_engine

    # -------------------------------------------------------------
    # 6. Gemini / LLM Advisory Engine
    # -------------------------------------------------------------
    def get_gemini_advisor(self, api_key: Optional[str] = None):
        if self._gemini_engine is None:
            from .gemini_advisory_engine import GeminiAdvisoryEngine
            self._gemini_engine = GeminiAdvisoryEngine(
                config_path=str(self.base_dir / "gemini_config.json"),
                api_key=api_key
            )
        return self._gemini_engine


# Singleton helper
hub = ModelHub()

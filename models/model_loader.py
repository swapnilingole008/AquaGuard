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
import json
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional
import numpy as np


class ModelHub:
    _instance = None

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).parent
        self._cnn_model = None
        self._cnn_classes = None
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
        return self._cnn_model, self._cnn_classes

    def predict_leaf_disease(self, image_input, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Accepts PIL Image, image file path, or numpy array.
        Returns top-k predicted disease classes with confidence scores.
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
            results.append({
                "class_index": int(idx),
                "label": label,
                "crop": crop.replace("_", " "),
                "disease": disease.replace("_", " "),
                "confidence_pct": round(float(preds[idx]) * 100, 2)
            })
        return results

    # -------------------------------------------------------------
    # 2. XGBoost: Crop Yield & Economics
    # -------------------------------------------------------------
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
        Predicts crop yield using domain-engineered agronomic XGBoost regression.
        Features expected (with intelligent defaults):
            - crop: 'Rice' | 'Tea' | 'Rubber' | 'Sugarcane' | 'Cinnamon' (default: 'Rice')
            - rainfall: float (mm, default: 350.0)
            - temperature: float (°C, default: 26.0)
            - nitrogen: float (N, default: 70.0)
            - phosphorus: float (P, default: 40.0)
            - potassium: float (K, default: 40.0)
            - area_acres: float (default: 2.5)
            - cost_per_acre: float (₹, default: 16000.0)
            - mandi_rate_per_quintal: float (₹, default: 2500.0)
        """
        import xgboost as xgb
        import pandas as pd
        model, scaler = self.load_xgboost()

        feature_names = list(scaler.keys())
        crop_name = str(features.get('crop', 'Rice')).capitalize()
        rainfall = float(features.get('rainfall', features.get('Rainfall_mm', 350.0)))
        temp = float(features.get('temperature', features.get('Temperature_C', 26.0)))
        n_val = float(features.get('nitrogen', features.get('N', 70.0)))
        p_val = float(features.get('phosphorus', features.get('P', 40.0)))
        k_val = float(features.get('potassium', features.get('K', 40.0)))
        year = int(features.get('year', features.get('Year', 2024)))
        month = int(features.get('month', features.get('Month', 7)))
        fertilizer = float(features.get('fertilizer', features.get('Fertilizer', 75.0)))

        # Agronomic domain engineering
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
            'good_tea_zone': 1.0 if (crop_name == 'Tea' and 500 <= rainfall <= 900 and 18 <= temp <= 26) else 0.0,
            'good_rubber_zone': 1.0 if (crop_name == 'Rubber' and 600 <= rainfall <= 1000 and 20 <= temp <= 28) else 0.0,
            'good_sugarcane_zone': 1.0 if (crop_name == 'Sugarcane' and 700 <= rainfall <= 1000 and 22 <= temp <= 30) else 0.0,
            'good_cinnamon_zone': 1.0 if (crop_name == 'Cinnamon' and 600 <= rainfall <= 1000 and 24 <= temp <= 32) else 0.0,
            'good_rice_zone': 1.0 if (crop_name == 'Rice' and rainfall >= 600 and 22 <= temp <= 30) else 0.0,
            'drought_stress': 1.0 if (rainfall < 300 and temp > 30) else 0.0,
            'cold_stress': 1.0 if temp < 15 else 0.0,
            'heat_stress': 1.0 if temp > 35 else 0.0,
        }

        # Build complete dictionary matching feature_names
        feat_dict = {name: 0.0 for name in feature_names}
        for k, v in raw_dict.items():
            if k in feat_dict:
                feat_dict[k] = v

        crop_col = f"Crop_{crop_name}"
        if crop_col in feat_dict:
            feat_dict[crop_col] = 1.0

        # Scale features
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
            pred_kg = float(model.predict(dmat)[0])
        else:
            pred_kg = float(model.predict(df_input)[0])

        pred_kg = max(50.0, pred_kg)
        yield_tonnes_per_ha = round(pred_kg / 1000.0, 2)
        yield_quintals_per_ha = round(pred_kg / 100.0, 2)

        area_acres = float(features.get('area_acres', 2.5))
        # 1 hectare = 2.47105 acres
        area_ha = area_acres / 2.47105
        total_production_quintals = round(yield_quintals_per_ha * area_ha, 2)
        cost_per_acre = float(features.get('cost_per_acre', 16000.0))
        mandi_rate = float(features.get('mandi_rate_per_quintal', 2500.0))

        total_cultivation_cost = round(area_acres * cost_per_acre, 2)
        gross_revenue = round(total_production_quintals * mandi_rate, 2)
        net_profit = round(gross_revenue - total_cultivation_cost, 2)

        return {
            "crop": crop_name,
            "predicted_yield_kg_per_hectare": round(pred_kg, 1),
            "predicted_yield_tonnes_per_hectare": yield_tonnes_per_ha,
            "predicted_yield_quintals_per_hectare": yield_quintals_per_ha,
            "area_acres": area_acres,
            "estimated_production_quintals": total_production_quintals,
            "projected_cultivation_cost_inr": total_cultivation_cost,
            "estimated_gross_revenue_inr": gross_revenue,
            "estimated_net_profit_inr": net_profit
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

    def predict_next_mandi_price(self, recent_30_prices: List[float]) -> Dict[str, Any]:
        """
        Accepts the latest 30 days of commodity prices.
        Forecasts the next mandi modal price.
        """
        model, scaler = self.load_lstm()
        prices = np.array(recent_30_prices, dtype=np.float32)
        if len(prices) != 30:
            raise ValueError(f"Expected 30 consecutive prices, received {len(prices)}")

        min_val = scaler.get("min", 10000.0)
        max_val = scaler.get("max", 50000.0)
        scaled = (prices - min_val) / (max_val - min_val)
        seq = scaled.reshape(1, 30, 1)

        scaled_pred = float(model.predict(seq, verbose=0)[0][0])
        pred_price = round(scaled_pred * (max_val - min_val) + min_val, 2)

        return {
            "predicted_next_modal_price_rs_per_quintal": pred_price,
            "last_recorded_price": float(prices[-1]),
            "projected_change_rs": round(pred_price - float(prices[-1]), 2),
            "trend": "UPWARD" if pred_price > prices[-1] else "DOWNWARD"
        }

    # -------------------------------------------------------------
    # 4. Prophet: Time-Series Seasonal Price & Trend Forecasting
    # -------------------------------------------------------------
    def load_prophet(self):
        if self._prophet_model is None:
            from prophet.serialize import model_from_json
            import pickle
            json_path = self.base_dir / "prophet_mandi_forecast.json"
            pkl_path = self.base_dir / "prophet_mandi_forecast.pkl"

            if json_path.exists():
                with open(json_path, "r", encoding="utf-8") as f:
                    self._prophet_model = model_from_json(f.read())
            elif pkl_path.exists():
                with open(pkl_path, "rb") as f:
                    self._prophet_model = pickle.load(f)
            else:
                raise FileNotFoundError("Prophet model file not found")
        return self._prophet_model

    def forecast_mandi_prices_prophet(self, horizon_days: int = 14) -> List[Dict[str, Any]]:
        """
        Forecasts future mandi prices for given number of future days.
        """
        import pandas as pd
        model = self.load_prophet()
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


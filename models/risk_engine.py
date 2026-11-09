"""
Rule-Based Agricultural Risk Engine
Evaluates telemetry (soil, weather, rainfall) against agronomic threshold rules
to generate real-time alerts for irrigation, drought, flood, and weather extremes.
"""

import json
from pathlib import Path
from typing import Dict, Any, List


class RuleBasedRiskEngine:
    def __init__(self, rules_path: str = None):
        if rules_path is None:
            rules_path = Path(__file__).parent / "risk_engine_rules.json"
        with open(rules_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        self.rules = self.config.get("rules", {})

    def evaluate(self, farm_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates input farm telemetry:
        Expected keys in farm_state:
            - soil_type: "sandy" | "loamy" | "clayey" (default "loamy")
            - soil_moisture_pct: float
            - rainfall_24h_mm: float
            - consecutive_dry_days: int
            - temp_c: float
            - humidity_pct: float
            - wind_speed_kmh: float
            - eto_mm_per_day: float (optional)
        """
        alerts: List[Dict[str, Any]] = []
        soil_type = farm_state.get("soil_type", "loamy").lower()
        soil_moisture = farm_state.get("soil_moisture_pct", 45.0)
        rainfall_24h = farm_state.get("rainfall_24h_mm", 0.0)
        dry_days = farm_state.get("consecutive_dry_days", 0)
        temp_c = farm_state.get("temp_c", 28.0)
        humidity = farm_state.get("humidity_pct", 60.0)
        wind_speed = farm_state.get("wind_speed_kmh", 12.0)
        eto = farm_state.get("eto_mm_per_day", 4.0)

        # 1. Irrigation Check
        irrig_rules = self.rules.get("irrigation", {})
        soil_thresholds = irrig_rules.get("soil_moisture_thresholds_percent", {}).get(soil_type, {"critical_dry": 20.0, "optimal_min": 35.0})
        if soil_moisture < soil_thresholds["critical_dry"]:
            alerts.append({
                "category": "IRRIGATION",
                "severity": "CRITICAL",
                "code": "IRRIG_CRITICAL",
                "title": "Critical Irrigation Required",
                "message": irrig_rules.get("advisory", {}).get("critical", "Urgent irrigation needed!"),
                "metrics": {"soil_moisture_pct": soil_moisture, "threshold": soil_thresholds["critical_dry"]}
            })
        elif soil_moisture < soil_thresholds["optimal_min"] or eto >= 5.5:
            alerts.append({
                "category": "IRRIGATION",
                "severity": "WARNING",
                "code": "IRRIG_WARNING",
                "title": "Low Soil Moisture Notice",
                "message": irrig_rules.get("advisory", {}).get("warning", "Plan irrigation soon."),
                "metrics": {"soil_moisture_pct": soil_moisture, "optimal_min": soil_thresholds["optimal_min"]}
            })

        # 2. Drought Risk
        drought_rules = self.rules.get("drought", {}).get("stages", {})
        if dry_days >= 28 and soil_moisture <= 12.0:
            stage = drought_rules.get("severe_drought", {})
            alerts.append({
                "category": "DROUGHT",
                "severity": stage.get("severity", "CRITICAL"),
                "code": "DROUGHT_SEVERE",
                "title": "Severe Drought Alert",
                "message": stage.get("action", "Immediate drought management required."),
                "metrics": {"dry_days": dry_days, "soil_moisture_pct": soil_moisture}
            })
        elif dry_days >= 18 and soil_moisture <= 20.0:
            stage = drought_rules.get("moderate_drought", {})
            alerts.append({
                "category": "DROUGHT",
                "severity": stage.get("severity", "ALERT"),
                "code": "DROUGHT_MODERATE",
                "title": "Moderate Drought Advisory",
                "message": stage.get("action", "Prioritize critical crop growth stages."),
                "metrics": {"dry_days": dry_days, "soil_moisture_pct": soil_moisture}
            })
        elif dry_days >= 10 and soil_moisture <= 30.0:
            stage = drought_rules.get("mild_stress", {})
            alerts.append({
                "category": "DROUGHT",
                "severity": stage.get("severity", "WARNING"),
                "code": "DROUGHT_MILD",
                "title": "Moisture Stress Advisory",
                "message": stage.get("action", "Apply moisture conservation techniques."),
                "metrics": {"dry_days": dry_days, "soil_moisture_pct": soil_moisture}
            })

        # 3. Flood & Waterlogging Risk
        flood_rules = self.rules.get("flood_and_waterlogging", {})
        thresh = flood_rules.get("thresholds", {})
        if rainfall_24h >= thresh.get("very_heavy_rainfall_24h_mm", 115.5):
            alerts.append({
                "category": "FLOOD",
                "severity": "CRITICAL",
                "code": "FLOOD_VERY_HEAVY",
                "title": "Severe Flood & Inundation Warning",
                "message": flood_rules.get("advisory", {}).get("flash_flood", "Clear farm drainage trenches immediately."),
                "metrics": {"rainfall_24h_mm": rainfall_24h, "threshold": thresh.get("very_heavy_rainfall_24h_mm", 115.5)}
            })
        elif rainfall_24h >= thresh.get("heavy_rainfall_24h_mm", 64.5):
            alerts.append({
                "category": "FLOOD",
                "severity": "WARNING",
                "code": "FLOOD_HEAVY_RAIN",
                "title": "Heavy Rainfall Notice",
                "message": flood_rules.get("advisory", {}).get("waterlogging_risk", "Ensure field drainage is open."),
                "metrics": {"rainfall_24h_mm": rainfall_24h, "threshold": thresh.get("heavy_rainfall_24h_mm", 64.5)}
            })

        weather_rules = self.rules.get("weather_extremes", {})
        if temp_c >= weather_rules.get("heatwave", {}).get("temp_celsius_threshold", 40.0):
            alerts.append({
                "category": "WEATHER",
                "severity": "ALERT",
                "code": "WEATHER_HEATWAVE",
                "title": "Heatwave Warning",
                "message": weather_rules.get("heatwave", {}).get("action", "Irrigate during cooler hours."),
                "metrics": {"temp_c": temp_c}
            })
        elif temp_c <= weather_rules.get("frost_and_coldwave", {}).get("min_temp_celsius", 4.0):
            alerts.append({
                "category": "WEATHER",
                "severity": "WARNING",
                "code": "WEATHER_FROST",
                "title": "Cold Wave / Frost Alert",
                "message": weather_rules.get("frost_and_coldwave", {}).get("action", "Provide protective orchard irrigation."),
                "metrics": {"temp_c": temp_c}
            })

        if wind_speed >= weather_rules.get("high_wind_storm", {}).get("wind_speed_kmh", 45.0):
            alerts.append({
                "category": "WEATHER",
                "severity": "WARNING",
                "code": "WEATHER_HIGH_WIND",
                "title": "High Wind Speed Advisory",
                "message": weather_rules.get("high_wind_storm", {}).get("action", "Stake tall crops and halt spraying."),
                "metrics": {"wind_speed_kmh": wind_speed}
            })

        fungal_rule = self.rules.get("pest_disease_microclimate", {}).get("fungal_blight_risk", {})
        if (fungal_rule.get("min_temp_c", 18.0) <= temp_c <= fungal_rule.get("max_temp_c", 28.0)) and humidity >= fungal_rule.get("humidity_pct_min", 85.0):
            alerts.append({
                "category": "PEST_DISEASE",
                "severity": "ALERT",
                "code": "DISEASE_FAVORABLE_CLIMATE",
                "title": "High Fungal Disease Risk Window",
                "message": fungal_rule.get("action", "Scout leaves and consider preventive organic or chemical controls."),
                "metrics": {"temp_c": temp_c, "humidity_pct": humidity}
            })

        overall_status = "STABLE"
        if any(a["severity"] == "CRITICAL" for a in alerts):
            overall_status = "CRITICAL"
        elif any(a["severity"] in ("ALERT", "WARNING") for a in alerts):
            overall_status = "ATTENTION_REQUIRED"

        return {
            "overall_status": overall_status,
            "total_alerts": len(alerts),
            "alerts": alerts
        }

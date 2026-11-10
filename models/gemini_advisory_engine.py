"""
Gemini / LLM Agricultural Advisory Engine
Bridges ML predictions (CNN, XGBoost, LSTM, Prophet, Risk Engine)
with personalized, conversational farmer recommendations.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, Optional


class GeminiAdvisoryEngine:
    def __init__(self, config_path: Optional[str] = None, api_key: Optional[str] = None):
        if config_path is None:
            config_path = Path(__file__).parent / "gemini_config.json"
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self.client = genai.GenerativeModel(
                model_name=os.environ.get("GEMINI_MODEL") or self.config.get("model_family", "gemini-2.0-flash"),
                system_instruction=self.config.get("system_instruction")
            )
        except Exception:
            # Fallback or optional dependency
            self.client = None

    def format_prompt(self, template_key: str, **kwargs) -> str:
        template = self.config.get("prompts", {}).get(template_key, "")
        return template.format(**kwargs)

    def explain_disease(self, disease_name: str, confidence_pct: float, crop: str = "Unknown", symptoms: str = "Visible spots/discoloration") -> str:
        prompt = self.format_prompt(
            "explain_crop_disease",
            disease_name=disease_name,
            confidence_pct=f"{confidence_pct:.1f}",
            crop=crop,
            symptoms=symptoms
        )
        return self._generate(prompt)

    def explain_yield(self, predicted_yield: float, crop: str, area_acres: float, soil_type: str, n_p_k: str, rainfall_mm: float, cultivation_cost: float, estimated_profit: float) -> str:
        prompt = self.format_prompt(
            "explain_yield_prediction",
            predicted_yield=f"{predicted_yield:.2f}",
            crop=crop,
            area_acres=area_acres,
            soil_type=soil_type,
            n_p_k=n_p_k,
            rainfall_mm=f"{rainfall_mm:.1f}",
            cultivation_cost=f"{cultivation_cost:,.0f}",
            estimated_profit=f"{estimated_profit:,.0f}"
        )
        return self._generate(prompt)

    def explain_mandi_forecast(self, commodity: str, current_price: float, forecast_7d: float, forecast_14d: float, trend_direction: str, demand_index: str) -> str:
        prompt = self.format_prompt(
            "explain_mandi_forecast",
            commodity=commodity,
            current_price=f"{current_price:,.0f}",
            forecast_7d=f"{forecast_7d:,.0f}",
            forecast_14d=f"{forecast_14d:,.0f}",
            trend_direction=trend_direction,
            demand_index=demand_index
        )
        return self._generate(prompt)

    def explain_risk_alerts(self, alerts: list, telemetry: Dict[str, Any]) -> str:
        alerts_summary = "\n".join([f"- [{a.get('severity')}] {a.get('title')}: {a.get('message')}" for a in alerts]) or "No active alerts."
        telemetry_summary = "\n".join([f"- {k}: {v}" for k, v in telemetry.items()])
        prompt = self.format_prompt("explain_risk_alerts", alerts_summary=alerts_summary, telemetry_summary=telemetry_summary)
        return self._generate(prompt)

    def _generate(self, prompt: str) -> str:
        if self.client:
            try:
                response = self.client.generate_content(prompt)
                return response.text
            except Exception as e:
                return f"[Gemini API Notice: {e}]\n\nSynthesized Advisory Prompt:\n{prompt}"
        return f"[Gemini Advisory Prepared Prompt - Add GEMINI_API_KEY to execute live inference]:\n\n{prompt}"


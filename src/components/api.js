/**
 * AgriGuard API Client
 * Connects React UI to the FastAPI backend with proxy and direct localhost fallbacks.
 * Automatically injects active farmer language preference for localized AI inferences.
 */

const API_BASE = "";
const FALLBACK_BASE = "http://127.0.0.1:8000";

function getActiveLanguage() {
  try {
    return localStorage.getItem("agriguard_language") || "en";
  } catch (e) {
    return "en";
  }
}

async function request(path, options = {}) {
  const lang = getActiveLanguage();

  // If POST with JSON body, ensure language parameter is included
  let body = options.body;
  if (options.method === "POST" && typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (!parsed.language) {
        parsed.language = lang;
        body = JSON.stringify(parsed);
      }
    } catch (e) {
      // not json, leave as is
    }
  }

  // If GET or query string, append language if missing
  let queryPath = path;
  if (!queryPath.includes("language=")) {
    const separator = queryPath.includes("?") ? "&" : "?";
    queryPath = `${queryPath}${separator}language=${encodeURIComponent(lang)}`;
  }

  const url = `${API_BASE}${queryPath}`;
  const fetchOptions = {
    ...options,
    body,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, fetchOptions);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    // If relative path fails (e.g. running outside vite proxy), attempt direct backend port 8000
    if (API_BASE === "" && !options._retried) {
      try {
        const directUrl = `${FALLBACK_BASE}${queryPath}`;
        const res = await fetch(directUrl, {
          ...fetchOptions,
          _retried: true
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(errData.detail || `Request failed with status ${res.status}`);
        }
        return await res.json();
      } catch (fallbackErr) {
        throw new Error(fallbackErr.message || err.message);
      }
    }
    throw err;
  }
}

export const api = {
  // 1. Leaf Disease (CNN)
  predictDisease: (data) => request("/api/disease/predict", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // 2. Crop Recommendation
  recommendCrop: (data) => request("/api/crop/recommend", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // 3. Yield Prediction (XGBoost 47-Features)
  predictYield: (data) => request("/api/yield/predict", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // 4. Mandi Price Forecast (Prophet)
  forecastMarket: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/market/forecast?${qs}`);
  },

  // 5. Mandi Price Sequential (LSTM)
  predictMarketLSTM: (data) => request("/api/market/lstm", {
    method: "POST",
    body: JSON.stringify(data || {})
  }),

  // Mandi Benchmark Spot Prices
  getMarketPrices: () => request("/api/market/prices"),

  // 6. Smart Irrigation
  recommendIrrigation: (data) => request("/api/irrigation/recommend", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // 7. Current Weather
  getWeather: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : "";
    return request(`/api/weather/current${qs ? `?${qs}` : ""}`);
  },

  // 8. Agricultural Risk Engine
  analyzeRisk: (data) => request("/api/risk/analyze", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // 9. Soil & Satellite NDVI
  analyzeSoil: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : "";
    return request(`/api/soil/analyze${qs ? `?${qs}` : ""}`);
  },

  // 10. AI Assistant (Gemini)
  chatAssistant: (data) => request("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // 11. Notifications
  getNotifications: () => request("/api/notifications")
};

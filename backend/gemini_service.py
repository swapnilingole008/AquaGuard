"""
AgriGuard Gemini Advisory Service
Centralized LLM Advisory Copilot integrating Google Gemini API
with intelligent agronomic expert fallbacks when API key is not configured.
Supports dynamic multilingual prompting in all 22 Indian regional languages.
"""

import os
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, Optional, List

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "bn": "Bengali (বাংলা)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "as": "Assamese (অসমীয়া)",
    "ur": "Urdu (اردو)",
    "sa": "Sanskrit (संस्कृतम्)",
    "ks": "Kashmiri (کٲشُر)",
    "sd": "Sindhi (سنڌي)",
    "ne": "Nepali (नेपाली)",
    "kok": "Konkani (कोंकणी)",
    "mai": "Maithili (मैथिली)",
    "doi": "Dogri (डोगरी)",
    "brx": "Bodo (बड़ो)",
    "sat": "Santali (संताली)",
    "mni": "Manipuri (মৈতৈলোন্)"
}


class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model_name = "gemini-1.5-flash"
        self._sdk_model = None
        self._init_client()

    def _init_client(self):
        if not self.api_key:
            return
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._sdk_model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=(
                    "You are 'Kisan Mitra', an expert agricultural AI scientist and advisory copilot. "
                    "Provide clear, empathetic, and actionable farming advice. Always supply practical "
                    "biological and chemical dosages with safety precautions. Reply in the user's requested Indian language."
                )
            )
        except Exception as e:
            print(f"[GeminiService] SDK init warning: {e}. Will use direct REST endpoint if needed.")
            self._sdk_model = None

    def query_gemini(self, prompt: str, language: str = "en") -> Optional[str]:
        """Queries Google Gemini API using SDK or direct REST fallback."""
        if not self.api_key:
            return None

        lang_name = LANGUAGE_NAMES.get(language, "English")
        if language != "en":
            prompt = (
                f"{prompt}\n\n"
                f"IMPORTANT: Respond completely in {lang_name} language using its authentic native script. "
                f"Ensure the tone is respectful, clear, and easy for Indian farmers to understand."
            )

        # 1. Try SDK
        if self._sdk_model:
            try:
                res = self._sdk_model.generate_content(prompt)
                if res and res.text:
                    return res.text.strip()
            except Exception as e:
                print(f"[GeminiService] SDK generation error: {e}")

        # 2. Try REST API direct
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024}
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=8.0) as resp:
                data = json.loads(resp.read().decode())
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except Exception as e:
            print(f"[GeminiService] REST query error: {e}")
            return None

    def get_disease_guidance(self, disease_name: str, confidence_pct: float, crop: str, language: str = "en") -> Dict[str, Any]:
        """Provides pathology explanation, organic/chemical treatments, and preventive measures."""
        prompt = (
            f"A leaf photo was analyzed by a plant pathology CNN model with {confidence_pct:.1f}% confidence for condition: '{disease_name}' on crop: '{crop}'.\n"
            f"Provide: 1. Simple explanation of the disease. 2. Root pathogen cause. 3. Immediate cultural & biological treatments. 4. Chemical spray recommendations with dilution ratios. 5. Preventive measures for upcoming growth stage."
        )
        ai_reply = self.query_gemini(prompt, language=language)
        if ai_reply:
            return {
                "source": "Google Gemini 1.5 Flash (Live)",
                "advice": ai_reply,
                "is_live_gemini": True
            }

        # Localized Knowledge Base fallback
        if language in ("hi", "mai", "doi", "sa"):
            advice = (
                f"{crop} पर {disease_name} का कृषि निदान:\n"
                f"• तत्काल खेत कार्रवाई: रोगग्रस्त पत्तियों को काटकर अलग करें ताकि बीजाणुओं का फैलाव रुके।\n"
                f"• जैविक नियंत्रण: सुबह के समय ट्राइकोडर्मा विरिडी या स्यूडोमोनास फ्लोरोसेंस (5 ग्राम/लीटर पानी) का छिड़काव करें।\n"
                f"• अनुशंसित कवकनाशी: कॉपर ऑक्सीक्लोराइड 50% डब्ल्यूपी (2.5 ग्राम/लीटर) या मेटालेक्सिल + मैंकोजेब का छिड़काव करें।\n"
                f"• सिंचाई सुधार: ड्रिप सिंचाई का प्रयोग करें; पत्तियों पर पानी का छिड़काव करने से बचें।"
            )
        elif language == "mr":
            advice = (
                f"{crop} वरील {disease_name} रोगाचे कृषी निदान:\n"
                f"• तातडीची शेतातील कृती: रोगाचा प्रादुर्भाव वाढू नये म्हणून बाधित पाने खुडून नष्ट करा.\n"
                f"• जैविक नियंत्रण: ट्रायकोडर्मा व्हिरिडी किंवा स्यूडोमोनस (५ ग्रॅम/लिटर पाणी) सकाळी फवारा.\n"
                f"• बुरशीनाशक उपाय: कॉपर ऑक्सिक्लोराईड (२.५ ग्रॅम/लिटर) किंवा मॅन्कोझेबची योग्य प्रमाणात फवारणी करा.\n"
                f"• पाणी व्यवस्थापन: ठिबक सिंचनाचा वापर करा; पानांवर पाणी साचू देऊ नका."
            )
        else:
            advice = (
                f"Agronomic Assessment for {disease_name} on {crop}:\n"
                f"• Immediate Field Action: Isolate infected plants and prune heavily spotted foliage to reduce secondary spore dispersal.\n"
                f"• Biological Management: Spray Trichoderma viride or Pseudomonas fluorescens at 5g/L water during early morning.\n"
                f"• Targeted Fungicide: Apply preventive Copper Oxychloride (50% WP) at 2.5g/L or systemic Metalaxyl + Mancozeb if lesions are water-soaked.\n"
                f"• Irrigation Adaptation: Switch to sub-surface drip or ground furrow; avoid overhead sprinkler wetting of foliage."
            )

        return {
            "source": "Agronomic Knowledge System (Configure GEMINI_API_KEY in .env for live Gemini 1.5 Flash)",
            "advice": advice,
            "is_live_gemini": False
        }

    def get_yield_profit_advice(self, crop: str, predicted_yield: float, unit: str, cost: float, revenue: float, profit: float, margin: float, limiting_factors: List[str], language: str = "en") -> Dict[str, Any]:
        """Provides AI-driven suggestions to maximize farm yield and reduce cost."""
        prompt = (
            f"Farm Financial & Yield Model Prediction for {crop}:\n"
            f"- Predicted Yield: {predicted_yield} {unit}\n"
            f"- Total Cultivation Cost: ₹{cost:,.0f}\n"
            f"- Expected Revenue: ₹{revenue:,.0f}\n"
            f"- Net Profit: ₹{profit:,.0f} (Margin: {margin}%)\n"
            f"- Limiting Factors Identified: {', '.join(limiting_factors)}\n\n"
            f"Provide 3 specific, practical strategies to improve farm profitability and reduce expenditure for this crop."
        )
        ai_reply = self.query_gemini(prompt, language=language)
        if ai_reply:
            return {
                "source": "Google Gemini 1.5 Flash (Live)",
                "advice": ai_reply,
                "is_live_gemini": True,
                "suggestions": [s.strip() for s in ai_reply.split("\n") if s.strip().startswith(("-", "•", "1.", "2.", "3."))][:3]
            }

        # Knowledge Base Suggestions
        if language in ("hi", "mai", "doi"):
            suggestions = [
                f"लागत में सुधार: नाइट्रोजन को 3 भागों में विभाजित कर 1% जिंक सल्फेट के साथ दें, जिससे खाद की कार्यक्षमता 18% तक बढ़ेगी।",
                f"सूक्ष्म-सिंचाई प्रबंधन: वानस्पतिक चरण में ड्रिप सिंचाई से 30% पानी की बचत होगी और बिजली का खर्च कम होगा।",
                f"मंडी बिक्री योजना: फसल कटाई के तुरंत बाद औने-पौने दामों में बेचने के बजाय ई-नाम (e-NAM) या गोदाम रसीद का उपयोग करें।"
            ]
        elif language == "mr":
            suggestions = [
                f"खतांचा संतुलित वापर: नत्र खते ३ टप्प्यात विभागून १% झिंक सल्फेट सोबत दिल्यास खतांची कार्यक्षमता १८% वाढते.",
                f"ठिबक सिंचन नियोजन: वाढीच्या टप्प्यात ठिबक सिंचनाचा वापर केल्यास ३०% पाण्याची बचत होते व वीज खर्च वाचतो.",
                f"बाजार विक्री नियोजन: काढणीच्या वेळी एकदम माल न विकता प्रतवारी करून ई-नाम किंवा गोदामाचा वापर करून योग्य भाव मिळवा."
            ]
        else:
            suggestions = [
                f"Optimize input expenditures: Split nitrogen application into 3 equal top-dressings with 1% zinc sulphate to boost fertilizer use efficiency by 18%.",
                f"Adopt micro-irrigation scheduling: Deficit drip watering during vegetative stage conserves 30% water and reduces electricity pumping expenditure.",
                f"Stagger market sales: Utilize certified farm-gate warehousing or e-NAM spot booking to avoid distress sales during peak harvest influx."
            ]

        return {
            "source": "Agronomic Knowledge System (Configure GEMINI_API_KEY in .env for live Gemini 1.5 Flash)",
            "advice": "\n".join([f"• {s}" for s in suggestions]),
            "is_live_gemini": False,
            "suggestions": suggestions
        }

    def get_market_advice(self, commodity: str, market: str, current_price: float, forecast_price: float, trend: str, language: str = "en") -> Dict[str, Any]:
        """Provides market liquidation and timing recommendations."""
        prompt = (
            f"Mandi Price Forecasting for {commodity} at {market}:\n"
            f"- Current Price: ₹{current_price:,.0f} / quintal\n"
            f"- Forecasted Price (14-Day): ₹{forecast_price:,.0f} / quintal\n"
            f"- Projected Trend: {trend}\n\n"
            f"Provide selling advice for the farmer: should they hold or liquidate now? Mention value addition or alternative market channels."
        )
        ai_reply = self.query_gemini(prompt, language=language)
        if ai_reply:
            return {
                "source": "Google Gemini 1.5 Flash (Live)",
                "advice": ai_reply,
                "is_live_gemini": True
            }

        if language in ("hi", "mai", "doi"):
            if trend.upper() == "UPWARD":
                advice = f"{market} में {commodity} की आवक कम हो रही है और मांग बढ़ रही है। सलाह: अपनी 60% उच्च गुणवत्ता वाली उपज को 10-14 दिनों तक रोकें ताकि ₹{forecast_price:,.0f}/क्विंटल का उच्चतम भाव मिल सके।"
            else:
                advice = f"{market} में {commodity} की नई आवक बढ़ने से भाव नरम रहने का अनुमान है। सलाह: अच्छी सूखी और साफ उपज को अगले 72 घंटों में ₹{current_price:,.0f}/क्विंटल के मौजूदा भाव पर बेचें।"
        elif language == "mr":
            if trend.upper() == "UPWARD":
                advice = f"{market} मध्ये {commodity} ची आवक कमी होत असून मागणी वाढत आहे. सल्ला: ६०% चांगला शेतमाल १०-१४ दिवस रोखून ठेवा जेणेकरून ₹{forecast_price:,.0f}/क्विंटलचा वाढीव भाव मिळेल."
            else:
                advice = f"{market} मध्ये {commodity} ची आवक वाढल्याने दरात घट होण्याची शक्यता आहे. सल्ला: वाळलेला चांगला माल पुढील ७२ तासांत सध्याच्या ₹{current_price:,.0f}/क्विंटल भावाने विक्री करावा."
        else:
            if trend.upper() == "UPWARD":
                advice = f"Mandi arrivals for {commodity} are tapering while seasonal processing demand is building up. Recommended Strategy: Stagger sales by retaining 60% of quality stock for 10-14 days to capture projected ₹{forecast_price:,.0f}/quintal peaks."
            else:
                advice = f"Subdued seasonal sentiment detected for {commodity} due to upcoming market arrivals. Recommended Strategy: Liquidate dry, marketable produce at prevailing ₹{current_price:,.0f}/quintal rates within 72 hours to avert holding depreciation."

        return {
            "source": "Agronomic Knowledge System (Configure GEMINI_API_KEY in .env for live Gemini 1.5 Flash)",
            "advice": advice,
            "is_live_gemini": False
        }

    def chat_advisory(self, message: str, crop: str = "Wheat", location: str = "Nashik, Maharashtra", soil_type: str = "Loamy", language: str = "en") -> Dict[str, Any]:
        """Conversational response for Kisan Mitra in the farmer's native language."""
        prompt = (
            f"Farmer Context:\n- Location: {location}\n- Crop: {crop}\n- Soil: {soil_type}\n\n"
            f"Farmer's Inquiry:\n\"{message}\"\n\n"
            f"Provide an actionable, helpful agronomy answer. Include practical steps, fertilizer dosages, or organic alternatives where relevant."
        )
        ai_reply = self.query_gemini(prompt, language=language)
        if ai_reply:
            return {
                "source": "Google Gemini 1.5 Flash (Live)",
                "reply": ai_reply,
                "is_live_gemini": True,
                "followups": [
                    f"What is the best fertilizer dose for {crop} right now?",
                    f"How to control common pests organically on {crop}?",
                    f"What weather risks should I watch out for this week?"
                ]
            }

        low = message.lower()
        if language in ("hi", "mai", "doi"):
            if "irrigat" in low or "water" in low or "पानी" in low or "सिंचाई" in low:
                reply = f"{location} में {crop} ({soil_type} मिट्टी) के लिए सुबह के समय ड्रिप सिंचाई को प्राथमिकता दें। जड़ के पास 15 सेमी गहराई पर मिट्टी देखें: यदि मिट्टी का गोला बन रहा है और टूट नहीं रहा है, तो सिंचाई 24 घंटे टाली जा सकती है।"
            elif "fertiliz" in low or "खाद" in low or "यूरिया" in low or "npk" in low:
                reply = f"{crop} के लिए संतुलित एनपीके (4:2:1 अनुपात) का प्रयोग करें। बुवाई के समय फॉस्फोरस (DAP/SSP) जड़ों के पास दें, और नाइट्रोजन (यूरिया) को सिंचाई के साथ 2-3 किस्तों में दें।"
            elif "disease" in low or "रोग" in low or "कीट" in low:
                reply = f"{crop} की पत्तियों के निचले हिस्से की जांच करें। फंगल धब्बों के लिए नीम तेल (5 मिली/लीटर) या कॉपर ऑक्सीक्लोराइड (2.5 ग्राम/लीटर) का छिड़काव करें। अत्यधिक यूरिया के प्रयोग से बचें।"
            elif "market" in low or "भाव" in low or "मंडी" in low:
                reply = f"{location} में {crop} के लिए नजदीकी एपीएमसी मंडी की आवक देखें। उपज को अच्छी तरह सुखाकर और छानकर बेचें ताकि 5-8% अधिक दाम मिल सके।"
            else:
                reply = f"{location} में {crop} के संबंध में: खेत में संतुलित पोषण बनाए रखें, सप्ताह में दो बार कीटों की जांच करें और तापमान के अनुसार सिंचाई करें।"

            followups = [
                f"{crop} के लिए इस समय कौन सी खाद सबसे उपयुक्त है?",
                f"{crop} में जैविक रूप से कीटों की रोकथाम कैसे करें?",
                f"इस सप्ताह मौसम के कौन से जोखिमों का ध्यान रखना चाहिए?"
            ]
        elif language == "mr":
            if "irrigat" in low or "water" in low or "पाणी" in low or "सिंचन" in low:
                reply = f"{location} मध्ये {crop} साठी सकाळच्या वेळी ठिबक सिंचन करा. मुळाजवळ १५ सेमी खोलीवर ओलावा तपासा: जर मातीचा गोळा होत असेल, तर २४ तास पाणी देणे टाळता येईल."
            elif "fertiliz" in low or "खत" in low or "युरिया" in low:
                reply = f"{crop} साठी संतुलित खतांचा वापर करा. फॉस्फरस (डीएपी/एसएसपी) पेरणीवेळी मुळाजवळ द्या, आणि युरिया २-३ हप्त्यांमध्ये विभागून सिंचनासोबत द्या."
            elif "disease" in low or "रोग" in low or "कीड" in low:
                reply = f"{crop} च्या पानांची नियमित तपासणी करा. बुरशीजन्य रोगांसाठी निंबोळी अर्क (५ मिली/लिटर) किंवा कॉपर ऑक्सिक्लोराईड फवारा."
            else:
                reply = f"{location} मधील {crop} पिकासाठी: योग्य खत व्यवस्थापन करा, आठवड्यातून दोनदा पिकाचे निरीक्षण करा आणि हवामानानुसार पाणी द्या."

            followups = [
                f"{crop} साठी सध्या खताचा कोणता डोस द्यावा?",
                f"{crop} वरील कीड नियंत्रण जैविक पद्धतीने कसे करावे?",
                f"हवामानातील बदलांनुसार काय काळजी घ्यावी?"
            ]
        else:
            if "irrigat" in low or "water" in low:
                reply = f"For {crop} in {location} ({soil_type} soil), prioritize early morning drip irrigation to avoid solar evaporative loss. Check soil at 15cm root depth: if moisture balls together without crumbling, irrigation can be delayed by 24 hours."
            elif "fertiliz" in low or "npk" in low or "urea" in low:
                reply = f"For {crop}, maintain a balanced NPK ratio (typically 4:2:1 for cereals). Ensure phosphorus (DAP/SSP) is applied as basal dosage at root depth; top-dress nitrogen in splits accompanied by light irrigation to avoid volatilization."
            elif "disease" in low or "pest" in low or "fung" in low:
                reply = f"Inspect underside of {crop} leaves for early discoloration or spore lesions. For fungal spots, apply preventive Neem Oil spray (5ml/L) or Copper Oxychloride (2.5g/L). Avoid excess nitrogen fertilization which promotes succulent foliage susceptible to blights."
            elif "market" in low or "price" in low or "sell" in low:
                reply = f"For {crop} in {location}, track local APMC mandi arrivals. Grade produce uniformly (clean, dry, free of chaff) to command a 5-8% quality premium over standard modal prices."
            else:
                reply = f"Regarding your query on {crop} in {location}: Ensure balanced field nutrition, inspect crops twice weekly for pest threshold crossings, and align irrigation with prevailing temperature and soil moisture readings."

            followups = [
                f"How should I adjust irrigation for {crop} this season?",
                f"What are the best organic fertilizers for {soil_type} soil?",
                f"How to protect {crop} from high temperature stress?"
            ]

        return {
            "source": "Agronomic Knowledge System (Configure GEMINI_API_KEY in .env for live Gemini 1.5 Flash)",
            "reply": reply,
            "is_live_gemini": False,
            "followups": followups
        }

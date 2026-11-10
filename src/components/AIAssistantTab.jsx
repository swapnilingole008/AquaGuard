import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  RefreshCw,
  AlertTriangle,
  MapPin,
  User,
  Lightbulb
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

const QUICK_PROMPTS = [
  "What is the recommended irrigation schedule for Wheat at vegetative stage?",
  "How can I manage powdery mildew disease organically?",
  "Which companion crops grow best with Rice to control weeds?",
  "How should I protect my crop against unexpected heat stress?"
];

export default function AIAssistantTab() {
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaste Rajesh! I am Kisan Mitra, your AgriGuard AI Farming Assistant powered by Google Gemini and our agronomic knowledge engine. How can I assist your farm today?",
      provider: "Gemini AI",
      time: "Just now",
      followups: [
        "What are current weather risks for my crop?",
        "Recommend optimal fertilizer dosage",
        "Best harvest timing for wheat"
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [location, setLocation] = useState("Nashik, Maharashtra");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg = {
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const data = await api.chatAssistant({
        query: textToSend,
        crop,
        location,
        soil_type: "Loamy",
        temperature: 31,
        rainfall: 0,
        language
      });

      const assistantMsg = {
        role: "assistant",
        text: data.answer || data.reply || "AgriGuard advisory response generated.",
        provider: data.provider || "Kisan Mitra Copilot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        followups: data.suggested_followups || []
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message || "Failed to reach AI Advisory Engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-container chat-tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("assistant.eyebrow")}</div>
        <h1>{t("assistant.title")}</h1>
        <p>{t("assistant.desc")}</p>
      </div>

      <div className="chat-layout">
        {/* Context Sidebar */}
        <div className="chat-context-panel">
          <div className="context-card-top">
            <Bot size={18} />
            <strong>{t("assistant.context_title")}</strong>
          </div>
          <p className="context-help-text">
            {t("assistant.context_desc")}
          </p>

          <div className="context-field">
            <label>{t("assistant.selected_crop")}</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice (Paddy)</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
              <option value="Soybean">Soybean</option>
              <option value="Tomato">Tomato</option>
              <option value="Tea">Tea</option>
              <option value="Rubber">Rubber</option>
              <option value="Cinnamon">Cinnamon</option>
            </select>
          </div>

          <div className="context-field">
            <label>{t("assistant.farm_location")}</label>
            <div className="input-with-icon">
              <MapPin size={15} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="prompt-suggestions-box">
            <div className="prompt-suggestions-header">
              <Lightbulb size={15} />
              <span>{t("assistant.suggested_inquiries")}</span>
            </div>
            <div className="prompt-suggestions-list">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-prompt-btn"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-main-panel">
          <div className="chat-messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message-row ${msg.role === "user" ? "user-row" : "assistant-row"}`}
              >
                <div className={`message-avatar ${msg.role}`}>
                  {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <strong>{msg.role === "user" ? "You" : "Kisan Mitra AI"}</strong>
                    {msg.provider && <span className="provider-badge">{msg.provider}</span>}
                    <span className="message-time">{msg.time}</span>
                  </div>
                  <div className="message-bubble">
                    <p style={{ whiteSpace: "pre-line" }}>{msg.text}</p>
                  </div>

                  {msg.followups && msg.followups.length > 0 && (
                    <div className="followups-strip">
                      <span className="followup-lbl">{t("assistant.followups_title")}</span>
                      <div className="followup-buttons">
                        {msg.followups.map((f, i) => (
                          <button
                            key={i}
                            type="button"
                            className="followup-chip"
                            onClick={() => handleSend(f)}
                            disabled={loading}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message-row assistant-row">
                <div className="message-avatar assistant">
                  <Bot size={16} />
                </div>
                <div className="message-content-wrapper">
                  <div className="message-meta">
                    <strong>Kisan Mitra AI</strong>
                    <span className="provider-badge">Processing...</span>
                  </div>
                  <div className="message-bubble loading-bubble">
                    <RefreshCw size={16} className="spinner" />
                    <span>{t("assistant.processing")}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="alert-banner error-banner chat-error-banner">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="chat-input-form"
          >
            <input
              type="text"
              placeholder={t("assistant.input_placeholder")}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="chat-text-input"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={loading || !inputQuery.trim()}
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from "react";
import {
  ScanSearch,
  Upload,
  AlertTriangle,
  Leaf,
  ShieldCheck,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { api } from "./api";
import { useTranslation } from "../i18n";

// Sample leaf data URIs
const SAMPLES = [
  {
    name: "Tomato - Late Blight (Fungal)",
    crop: "Tomato",
    condition: "Late Blight",
    color: "#4a3c28",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#2d5a36"/><path d="M100 20 C160 70 170 150 100 180 C30 150 40 70 100 20 Z" fill="#4d8c4a"/><ellipse cx="85" cy="80" rx="22" ry="16" fill="#3a2f23" opacity="0.85"/><ellipse cx="120" cy="120" rx="28" ry="18" fill="#33281c" opacity="0.9"/><circle cx="105" cy="100" r="12" fill="#291e12"/></svg>`
  },
  {
    name: "Potato - Early Blight (Target Spots)",
    crop: "Potato",
    condition: "Early Blight",
    color: "#5c4028",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#2b4c30"/><path d="M100 15 C170 60 160 160 100 185 C40 160 30 60 100 15 Z" fill="#5c9a4e"/><circle cx="85" cy="75" r="18" fill="#4a3018"/><circle cx="85" cy="75" r="10" fill="#7a5530"/><circle cx="125" cy="115" r="22" fill="#4a3018"/><circle cx="125" cy="115" r="12" fill="#7a5530"/></svg>`
  },
  {
    name: "Corn - Common Rust (Pustules)",
    crop: "Corn",
    condition: "Common Rust",
    color: "#8a531e",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#264724"/><path d="M100 10 C150 70 145 170 100 190 C55 170 50 70 100 10 Z" fill="#669b46"/><ellipse cx="90" cy="60" rx="6" ry="12" fill="#b86b24"/><ellipse cx="115" cy="90" rx="7" ry="14" fill="#a65818"/><ellipse cx="85" cy="125" rx="6" ry="12" fill="#b86b24"/><ellipse cx="110" cy="145" rx="5" ry="10" fill="#994f15"/></svg>`
  },
  {
    name: "Tomato - Healthy Leaf",
    crop: "Tomato",
    condition: "Healthy",
    color: "#2e7a3e",
    svg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#28522d"/><path d="M100 20 C160 65 165 155 100 180 C35 155 40 65 100 20 Z" fill="#58a649"/><path d="M100 20 L100 180 M100 70 L135 55 M100 100 L145 85 M100 130 L135 120 M100 70 L65 55 M100 100 L55 85 M100 130 L65 120" stroke="#3d7532" stroke-width="3" fill="none"/></svg>`
  }
];

export default function DiseaseDetectionTab() {
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample) => {
    setError(null);
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(sample.svg)}`;
    setImagePreview(dataUri);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 256, 256);
      setImageBase64(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = dataUri;
  };

  const handleAnalyze = async () => {
    if (!imageBase64 && !imagePreview) {
      setError("Please upload a leaf photograph or select one of the sample leaves below.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.predictDisease({
        image_base64: imageBase64,
        top_k: 3
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to process image through CNN model.");
    } finally {
      setLoading(false);
    }
  };

  const isHealthy = result?.predicted_disease?.toLowerCase().includes("healthy");

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div className="eyebrow">{t("disease.eyebrow")}</div>
        <h1>{t("disease.title")}</h1>
        <p>{t("disease.desc")}</p>
      </div>

      <div className="tab-grid two-column-grid">
        {/* Input Section */}
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("disease.eyebrow")}</div>
              <h2>{t("disease.input_title")}</h2>
            </div>
            <ScanSearch size={20} className="panel-icon-accent" />
          </div>

          <div
            className={`image-dropzone ${imagePreview ? "has-image" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="preview-container">
                <img src={imagePreview} alt="Leaf Preview" className="preview-img" />
                <div className="preview-badge">Image Loaded · Click to Change</div>
              </div>
            ) : (
              <div className="dropzone-placeholder">
                <div className="dropzone-icon">
                  <Upload size={32} />
                </div>
                <strong>{t("disease.dropzone_prompt")}</strong>
                <span>{t("disease.dropzone_formats")}</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          <div className="sample-leaves-block">
            <span className="field-label">{t("disease.samples_prompt")}</span>
            <div className="sample-chips-row">
              {SAMPLES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className="sample-chip"
                  onClick={() => handleSelectSample(s)}
                >
                  <span className="sample-indicator" style={{ background: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert-banner error-banner">
              <AlertTriangle size={17} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="action-button primary-button full-width"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="spinner" /> {t("disease.btn_loading")}
              </>
            ) : (
              <>
                <ScanSearch size={18} /> {t("disease.btn_submit")}
              </>
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="panel results-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">{t("disease.eyebrow")}</div>
              <h2>{t("disease.results_title")}</h2>
            </div>
            {result && (
              <span className={`status-pill ${isHealthy ? "status-success" : "status-danger"}`}>
                {isHealthy ? t("disease.healthy_foliage") : t("disease.pathogen_detected")}
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="empty-state">
              <Leaf size={42} strokeWidth={1.3} className="empty-icon" />
              <h3>{t("disease.awaiting_leaf")}</h3>
              <p>{t("disease.awaiting_desc")}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <RefreshCw size={36} className="spinner" />
              <h3>{t("disease.btn_loading")}</h3>
            </div>
          )}

          {result && !loading && (
            <div className="diagnostic-results">
              {/* Primary Diagnosis Card */}
              <div className="primary-diagnosis-card">
                <div className="diagnosis-top">
                  <div>
                    <span className="crop-tag">{result.crop}</span>
                    <h3 className="disease-title">{result.predicted_disease}</h3>
                  </div>
                  <div className="confidence-gauge">
                    <span className="gauge-val">{result.confidence_pct}%</span>
                    <span className="gauge-label">{t("disease.confidence")}</span>
                  </div>
                </div>

                {result.low_confidence && (
                  <div className="alert-banner error-banner" style={{ marginTop: "8px" }}>
                    <AlertTriangle size={16} />
                    <span>{t("disease.low_confidence_warn")}</span>
                  </div>
                )}

                <p className="disease-desc">{result.description}</p>
              </div>

              {/* Gemini Agronomic Guidance */}
              {result.gemini_advice && (
                <div className="gemini-advisory-box">
                  <div className="gemini-header">
                    <Sparkles size={16} />
                    <span>{result.gemini_source || "Gemini AI Pathology Guidance"}</span>
                  </div>
                  <p style={{ whiteSpace: "pre-line" }}>{result.gemini_advice}</p>
                </div>
              )}

              {/* Symptoms */}
              <div className="result-section">
                <div className="section-title">
                  <AlertTriangle size={16} /> {t("disease.symptoms")}
                </div>
                <p className="section-body">{result.symptoms}</p>
              </div>

              {/* Treatment */}
              <div className="result-section highlight-section">
                <div className="section-title">
                  <ShieldCheck size={16} /> {t("disease.treatment_plan")}
                </div>
                <p className="section-body">{result.treatment}</p>
              </div>

              {/* Prevention */}
              <div className="result-section">
                <div className="section-title">
                  <Sparkles size={16} /> {t("disease.prevention_practices")}
                </div>
                <p className="section-body">{result.prevention}</p>
              </div>

              {/* Alternative Probabilities */}
              {result.all_predictions && result.all_predictions.length > 1 && (
                <div className="alternative-preds">
                  <span className="field-label">Top Differential Diagnoses:</span>
                  {result.all_predictions.map((p) => (
                    <div key={p.label} className="prob-row">
                      <div className="prob-info">
                        <strong>{p.crop} - {p.disease}</strong>
                        <span>{p.confidence_pct}%</span>
                      </div>
                      <div className="prob-bar-track">
                        <div
                          className="prob-bar-fill"
                          style={{ width: `${Math.min(100, p.confidence_pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

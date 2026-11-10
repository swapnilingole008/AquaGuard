import React, { useState, useRef, useEffect, useMemo } from "react";
import { Globe, Check, Search, X } from "lucide-react";
import { useTranslation } from "../i18n";

export default function LanguageSelector() {
  const { language, setLanguage, currentLanguage, languages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const q = searchQuery.toLowerCase().trim();
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [languages, searchQuery]);

  return (
    <div className="language-selector-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`language-trigger-btn ${isOpen ? "active" : ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery("");
        }}
        title={t("common.select_language") || "Select Language"}
        aria-label="Select Language"
      >
        <Globe size={16} className="lang-globe-icon" />
        <span className="lang-trigger-text">{currentLanguage.nativeName}</span>
        <span className="lang-trigger-badge">{currentLanguage.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown-menu">
          <div className="language-dropdown-header">
            <div className="lang-header-title">
              <Globe size={15} />
              <span>{t("common.select_language") || "Select Language"}</span>
            </div>
            <span className="lang-count">{languages.length} Languages</span>
          </div>

          <div className="language-search-box">
            <Search size={14} className="lang-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search / शोधा / खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="language-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="lang-search-clear"
                onClick={() => setSearchQuery("")}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="language-options-list">
            {filteredLanguages.length === 0 ? (
              <div className="language-no-results">No language found</div>
            ) : (
              filteredLanguages.map((item) => {
                const isSelected = item.code === language;
                return (
                  <button
                    key={item.code}
                    type="button"
                    className={`language-option-row ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setLanguage(item.code);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <div className="lang-option-text">
                      <span className="lang-native-label">{item.nativeName}</span>
                      <span className="lang-sub-label">
                        {item.name} {item.dir === "rtl" ? "· RTL" : ""}
                      </span>
                    </div>
                    {isSelected && <Check size={16} className="lang-check-icon" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}


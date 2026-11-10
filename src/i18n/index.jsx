import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { LANGUAGES, getLanguage } from "./languages";

// Import all 23 language dictionaries
import en from "./locales/en";
import hi from "./locales/hi";
import mr from "./locales/mr";
import gu from "./locales/gu";
import bn from "./locales/bn";
import ta from "./locales/ta";
import te from "./locales/te";
import kn from "./locales/kn";
import ml from "./locales/ml";
import pa from "./locales/pa";
import or from "./locales/or";
import as from "./locales/as";
import ur from "./locales/ur";
import sa from "./locales/sa";
import ks from "./locales/ks";
import sd from "./locales/sd";
import ne from "./locales/ne";
import kok from "./locales/kok";
import mai from "./locales/mai";
import doi from "./locales/doi";
import brx from "./locales/brx";
import sat from "./locales/sat";
import mni from "./locales/mni";

const LOCALES = {
  en,
  hi,
  mr,
  gu,
  bn,
  ta,
  te,
  kn,
  ml,
  pa,
  or,
  as,
  ur,
  sa,
  ks,
  sd,
  ne,
  kok,
  mai,
  doi,
  brx,
  sat,
  mni
};

const I18nContext = createContext(null);
const STORAGE_KEY = "agriguard_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LOCALES[saved]) {
        return saved;
      }
    } catch (e) {
      // localStorage may fail in restricted privacy modes
    }
    return "en";
  });

  const currentLanguage = useMemo(() => getLanguage(language), [language]);

  // Sync document attributes on language change
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = currentLanguage.dir || "ltr";
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {
      // ignored
    }
  }, [language, currentLanguage]);

  const setLanguage = useCallback((code) => {
    if (LOCALES[code]) {
      setLanguageState(code);
    } else {
      console.warn(`Locale ${code} not supported, keeping ${language}`);
    }
  }, [language]);

  const t = useCallback(
    (path, params) => {
      if (!path) return "";
      const segments = path.split(".");

      // Lookup in selected language dictionary
      let current = LOCALES[language];
      for (const seg of segments) {
        if (current && typeof current === "object" && seg in current) {
          current = current[seg];
        } else {
          current = undefined;
          break;
        }
      }

      // Fallback to English dictionary
      if (current === undefined || current === null || current === "") {
        current = LOCALES["en"];
        for (const seg of segments) {
          if (current && typeof current === "object" && seg in current) {
            current = current[seg];
          } else {
            current = undefined;
            break;
          }
        }
      }

      // Ultimate fallback: the key itself
      if (current === undefined || current === null) {
        return path;
      }

      // String interpolation {key}
      if (typeof current === "string" && params && typeof params === "object") {
        return current.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] !== undefined ? params[paramKey] : match;
        });
      }

      return current;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguage,
      languages: LANGUAGES,
      t,
      isRTL: currentLanguage.dir === "rtl"
    }),
    [language, setLanguage, currentLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within a <LanguageProvider>");
  }
  return context;
}


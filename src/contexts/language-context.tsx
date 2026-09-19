import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type Language,
  type TranslationKey,
  TRANSLATIONS,
  NAV_CATEGORIES,
  type NavCategory,
} from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  getCategoryLabel: (slug: string) => string;
  categories: { slug: string; label: string }[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "am";
    const saved = localStorage.getItem("site_language") as Language | null;
    if (saved === "am" || saved === "om" || saved === "en") return saved;
    return "am"; // Default to Amharic
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("site_language", lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: TranslationKey): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.am;
    return dict[key] || TRANSLATIONS.am[key] || key;
  };

  const getCategoryLabel = (slug: string): string => {
    const cat = NAV_CATEGORIES.find((c) => c.slug === slug);
    if (!cat) return slug;
    return cat.label[language] || cat.label.am || slug;
  };

  const categories = NAV_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label[language] || c.label.am,
  }));

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getCategoryLabel,
        categories,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

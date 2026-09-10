import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedLocale, DEFAULT_LOCALE } from "./locale";
import { initI18n, setLocale as setServiceLocale, t, getCurrentLocale } from "./translationService";

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: DEFAULT_LOCALE,
  setLocale: async () => {},
  t: (key) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(getCurrentLocale());

  useEffect(() => {
    initI18n().then((loc) => setLocaleState(loc));
  }, []);

  const handleSetLocale = async (newLocale: SupportedLocale) => {
    await setServiceLocale(newLocale);
    setLocaleState(newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
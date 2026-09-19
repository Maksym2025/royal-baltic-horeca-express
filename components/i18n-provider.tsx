"use client";
import { createContext, useContext, useState, useEffect } from "react";
import {
  dictionaries,
  type Locale,
  type MessageKey,
} from "@/lib/i18n/dictionaries";
const Context = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
} | null>(null);
export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, update] = useState(initialLocale);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  function setLocale(next: Locale) {
    update(next);
    document.cookie = `rb_locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  }
  return (
    <Context.Provider
      value={{ locale, setLocale, t: (key) => dictionaries[locale][key] }}
    >
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing language provider");
  return value;
}

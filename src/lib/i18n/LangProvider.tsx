"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { STR, type Lang, type Dict } from "./strings";

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: Dict;
  setLang: (l: Lang) => void;
  toggle: () => void;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Load persisted language on mount.
  useEffect(() => {
    const saved = (localStorage.getItem("masarik.lang") as Lang) || "en";
    setLangState(saved);
  }, []);

  // Keep <html dir/lang> in sync so RTL layout + fonts flip app-wide.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("masarik.lang", lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(
    () => setLangState((p) => (p === "en" ? "ar" : "en")),
    [],
  );

  return (
    <LangContext.Provider
      value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", t: STR[lang], setLang, toggle }}
    >
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

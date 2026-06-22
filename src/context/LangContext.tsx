import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "bn" | "en";
const STORAGE_KEY = "anbd:lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  /** Translate helper: t(bn, en) — Bangla is the default/source language. */
  t: (bn: string, en?: string) => string;
};

const LangCtx = createContext<Ctx>({
  lang: "bn",
  setLang: () => {},
  toggle: () => {},
  t: (bn) => bn,
});

function readInitial(): Lang {
  if (typeof localStorage === "undefined") return "bn";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "en" ? "en" : "bn";
  } catch {
    return "bn";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  // Always start with "bn" on first render to match SSR (no localStorage during SSR).
  const [lang, setLangState] = useState<Lang>("bn");

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    const v = readInitial();
    if (v !== lang) setLangState(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lang:change", { detail: lang }));
    }
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((p) => (p === "bn" ? "en" : "bn")), []);
  const t = useCallback(
    (bn: string, en?: string) => (lang === "en" && en ? en : bn),
    [lang],
  );

  return <LangCtx.Provider value={{ lang, setLang, toggle, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);

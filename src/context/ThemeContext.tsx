import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeId = "aurora" | "white";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  className: string;
  swatch: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Premium dark glass with violet · cyan · pink aurora",
    className: "",
    swatch: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 55%, #EC4899 100%)",
  },
  {
    id: "white",
    name: "White",
    description: "Clean light theme — bright surfaces, soft shadows",
    className: "theme-white",
    swatch: "linear-gradient(135deg, #ffffff 0%, #e5e7eb 55%, #cbd5e1 100%)",
  },
];

const STORAGE_KEY = "anbd-theme";
const ALL_CLASSES = THEMES.map((t) => t.className).filter(Boolean);

type Ctx = {
  theme: ThemeId;
  themes: ThemeMeta[];
  setTheme: (id: ThemeId) => void;
};

const ThemeCtx = createContext<Ctx>({
  theme: "white",
  themes: THEMES,
  setTheme: () => {},
});

function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ALL_CLASSES.forEach((c) => root.classList.remove(c));
  const found = THEMES.find((t) => t.id === id);
  if (found?.className) root.classList.add(found.className);
  root.dataset.theme = id;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("white");

  useEffect(() => {
    let stored: ThemeId = "white";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) stored = saved;
    } catch { /* ignore */ }
    applyTheme(stored);
    setThemeState(stored);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    if (!THEMES.some((t) => t.id === id)) return;
    applyTheme(id);
    setThemeState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ theme, themes: THEMES, setTheme }), [theme, setTheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

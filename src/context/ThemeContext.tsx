import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeId = "aurora";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  /** CSS class applied to <html> when this theme is active. Empty = default tokens. */
  className: string;
  /** Small color swatch shown in the picker. */
  swatch: string;
}

/**
 * Theme registry. To add a new theme later:
 *  1. Add a new entry here with a unique id + className.
 *  2. In src/styles.css, define the CSS variables under `html.<className> { ... }`.
 * The switcher UI will pick it up automatically.
 */
export const THEMES: ThemeMeta[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Premium dark glass with violet · cyan · pink aurora",
    className: "",
    swatch: "linear-gradient(135deg, #7C3AED 0%, #06B6D4 55%, #EC4899 100%)",
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
  theme: "aurora",
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
  const [theme, setThemeState] = useState<ThemeId>("aurora");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        applyTheme("aurora");
      }
    } catch {
      applyTheme("aurora");
    }
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    applyTheme(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ theme, themes: THEMES, setTheme }), [theme, setTheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

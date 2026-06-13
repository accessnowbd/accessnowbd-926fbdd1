import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCachedAvailability, useThemeAvailability, type ThemeAvailability } from "@/hooks/useThemeAvailability";

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
  availability: ThemeAvailability;
  enabledThemes: ThemeMeta[];
  setTheme: (id: ThemeId) => void;
};

const ThemeCtx = createContext<Ctx>({
  theme: "aurora",
  themes: THEMES,
  availability: { aurora: true, white: true },
  enabledThemes: THEMES,
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
  const availability = useThemeAvailability();
  const [theme, setThemeState] = useState<ThemeId>("aurora");

  // Initial mount: load stored theme, but downgrade to white if disabled.
  useEffect(() => {
    let stored: ThemeId = "aurora";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      if (saved && THEMES.some((t) => t.id === saved)) stored = saved;
    } catch { /* ignore */ }
    const initialAvail = getCachedAvailability();
    if (!initialAvail[stored]) stored = "white";
    applyTheme(stored);
    setThemeState(stored);
  }, []);

  // When availability changes (admin toggled), force fallback if needed.
  useEffect(() => {
    if (!availability[theme]) {
      applyTheme("white");
      setThemeState("white");
      try { localStorage.setItem(STORAGE_KEY, "white"); } catch { /* ignore */ }
    }
  }, [availability, theme]);

  const setTheme = useCallback((id: ThemeId) => {
    if (!THEMES.some((t) => t.id === id)) return;
    if (!availability[id]) return; // blocked
    applyTheme(id);
    setThemeState(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, [availability]);

  const enabledThemes = useMemo(() => THEMES.filter((t) => availability[t.id]), [availability]);

  const value = useMemo(
    () => ({ theme, themes: THEMES, availability, enabledThemes, setTheme }),
    [theme, availability, enabledThemes, setTheme],
  );
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ThemeId } from "@/context/ThemeContext";

export type ThemeAvailability = Record<ThemeId, boolean>;

const DEFAULTS: ThemeAvailability = { aurora: true, white: true };
const STORAGE_KEY = "anbd-theme-availability";

function readCache(): ThemeAvailability {
  if (typeof localStorage === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ThemeAvailability>) };
  } catch { return DEFAULTS; }
}

async function fetchAvailability(): Promise<ThemeAvailability> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("data,is_active")
    .eq("kind", "theme_config");
  if (error || !data) return DEFAULTS;
  const out: ThemeAvailability = { ...DEFAULTS };
  for (const row of data) {
    const id = (row.data as { id?: string } | null)?.id as ThemeId | undefined;
    if (id && id in out) out[id] = !!row.is_active;
  }
  // White must always be available as the safe fallback.
  out.white = true;
  return out;
}

export function useThemeAvailability(): ThemeAvailability {
  const [avail, setAvail] = useState<ThemeAvailability>(() => readCache());

  useEffect(() => {
    let alive = true;
    fetchAvailability().then((next) => {
      if (!alive) return;
      setAvail(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      // Notify listeners (ThemeProvider) so it can force-fallback if needed.
      window.dispatchEvent(new CustomEvent("anbd:theme-availability", { detail: next }));
    });

    const channel = supabase
      .channel("theme_config_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_records", filter: "kind=eq.theme_config" }, () => {
        fetchAvailability().then((next) => {
          if (!alive) return;
          setAvail(next);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          window.dispatchEvent(new CustomEvent("anbd:theme-availability", { detail: next }));
        });
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return avail;
}

export function getCachedAvailability(): ThemeAvailability {
  return readCache();
}

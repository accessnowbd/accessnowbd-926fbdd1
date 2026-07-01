import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProductZoomConfig = {
  enabled: boolean;
  scale: number;       // 1.1 - 3
  duration_ms: number; // transition speed (100 - 1200)
  easing: string;      // CSS easing
  trigger: "hover" | "click";
};

export const DEFAULT_ZOOM_CONFIG: ProductZoomConfig = {
  enabled: true,
  scale: 1.6,
  duration_ms: 500,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  trigger: "hover",
};

let cache: ProductZoomConfig | null = null;
let pending: Promise<ProductZoomConfig> | null = null;

async function fetchConfig(): Promise<ProductZoomConfig> {
  const { data } = await supabase
    .from("admin_records")
    .select("data,is_active")
    .eq("kind", "product_zoom")
    .limit(1);
  const row = data?.[0];
  if (!row) return DEFAULT_ZOOM_CONFIG;
  const merged = { ...DEFAULT_ZOOM_CONFIG, ...((row.data ?? {}) as Partial<ProductZoomConfig>) };
  if (row.is_active === false) merged.enabled = false;
  return merged;
}

export function useProductZoomConfig(): ProductZoomConfig {
  const [cfg, setCfg] = useState<ProductZoomConfig>(cache ?? DEFAULT_ZOOM_CONFIG);
  useEffect(() => {
    if (cache) { setCfg(cache); return; }
    if (!pending) pending = fetchConfig().then((c) => { cache = c; return c; });
    pending.then((c) => setCfg(c));
  }, []);
  return cfg;
}

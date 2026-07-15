import { supabase } from "@/integrations/supabase/client";

export type GscConfig = {
  /** Full content attribute value from Google Search Console META verification token. */
  verification_code: string;
  /** Optional additional verification tokens (multiple GSC properties). */
  extra_codes?: string[];
  /** Bing / Yandex etc. verification codes — separate meta names. */
  bing_code?: string;
  yandex_code?: string;
  /** Absolute URL of the sitemap for reference in admin UI. */
  sitemap_url?: string;
  /** ISO timestamp of last successful verification, informational only. */
  verified_at?: string | null;
};

export const DEFAULT_GSC_CONFIG: GscConfig = {
  verification_code: "",
  extra_codes: [],
  bing_code: "",
  yandex_code: "",
  sitemap_url: "https://accessnowbd.com/sitemap.xml",
  verified_at: null,
};

const KIND = "gsc_config";

function normalise(raw: unknown): GscConfig {
  const src = (raw ?? {}) as Partial<GscConfig>;
  return {
    verification_code: (src.verification_code ?? "").trim(),
    extra_codes: Array.isArray(src.extra_codes)
      ? src.extra_codes.map((s) => String(s).trim()).filter(Boolean)
      : [],
    bing_code: (src.bing_code ?? "").trim(),
    yandex_code: (src.yandex_code ?? "").trim(),
    sitemap_url: (src.sitemap_url ?? DEFAULT_GSC_CONFIG.sitemap_url ?? "").trim(),
    verified_at: src.verified_at ?? null,
  };
}

export async function fetchGscConfig(): Promise<GscConfig> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("data,is_active")
    .eq("kind", KIND)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return DEFAULT_GSC_CONFIG;
  return normalise(data.data);
}

export async function saveGscConfig(cfg: GscConfig): Promise<void> {
  const clean = normalise(cfg);
  const { data: existing } = await supabase
    .from("admin_records")
    .select("id")
    .eq("kind", KIND)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await supabase
      .from("admin_records")
      .update({ data: clean as never, is_active: true })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("admin_records")
      .insert({ kind: KIND, data: clean as never, is_active: true });
    if (error) throw error;
  }
}

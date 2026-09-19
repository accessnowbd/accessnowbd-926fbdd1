import { supabase } from "@/integrations/supabase/client";

export type PromoMessage = { text: string; enabled: boolean };

export type LiveTickerConfig = {
  /** Top utility bar promotional marquee */
  promo: {
    enabled: boolean;
    speed: number; // seconds for one full loop
    messages: PromoMessage[];
  };
  /** "LIVE" product price strip on the homepage */
  live: {
    enabled: boolean;
    label: string;
    speed: number;
    /** auto = every active product, manual = only pickedSlugs */
    mode: "auto" | "manual";
    pickedSlugs: string[];
    showDiscount: boolean;
    maxItems: number;
  };
};

export const DEFAULT_LIVE_TICKER: LiveTickerConfig = {
  promo: {
    enabled: true,
    speed: 40,
    messages: [
      { text: "সব অর্ডারে ফ্রি ইনস্ট্যান্ট ডেলিভারি — ১০% পর্যন্ত ছাড় পান", enabled: true },
      { text: "Trusted by 50,000+ customers", enabled: true },
      { text: "100% Secure Payment", enabled: true },
    ],
  },
  live: {
    enabled: true,
    label: "LIVE",
    speed: 55,
    mode: "auto",
    pickedSlugs: [],
    showDiscount: true,
    maxItems: 20,
  },
};

const KIND = "live_ticker";

function normalise(raw: unknown): LiveTickerConfig {
  const src = (raw ?? {}) as Partial<LiveTickerConfig>;
  const promo: Partial<LiveTickerConfig["promo"]> = src.promo ?? {};
  const live: Partial<LiveTickerConfig["live"]> = src.live ?? {};
  return {
    promo: {
      enabled: promo.enabled !== false,
      speed: Number(promo.speed) > 0 ? Number(promo.speed) : DEFAULT_LIVE_TICKER.promo.speed,
      messages: Array.isArray(promo.messages)
        ? promo.messages
            .filter((m) => m && typeof m.text === "string")
            .map((m) => ({ text: m.text, enabled: m.enabled !== false }))
        : DEFAULT_LIVE_TICKER.promo.messages,
    },
    live: {
      enabled: live.enabled !== false,
      label: typeof live.label === "string" && live.label.trim() ? live.label : "LIVE",
      speed: Number(live.speed) > 0 ? Number(live.speed) : DEFAULT_LIVE_TICKER.live.speed,
      mode: live.mode === "manual" ? "manual" : "auto",
      pickedSlugs: Array.isArray(live.pickedSlugs) ? live.pickedSlugs.filter(Boolean) : [],
      showDiscount: live.showDiscount !== false,
      maxItems: Number(live.maxItems) > 0 ? Number(live.maxItems) : 20,
    },
  };
}

export async function fetchLiveTickerConfig(): Promise<LiveTickerConfig> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("data")
    .eq("kind", KIND)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return DEFAULT_LIVE_TICKER;
  return normalise(data.data);
}

export async function saveLiveTickerConfig(cfg: LiveTickerConfig): Promise<void> {
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

/** Parse "৳1,599" / "1599" → number */
export function priceToNumber(v?: string): number | null {
  if (!v) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

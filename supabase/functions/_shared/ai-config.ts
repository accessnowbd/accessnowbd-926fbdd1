// Shared AI system config reader for edge functions.
// Reads default model + feature toggles from admin_records (kind=site_settings).
// Falls back to sensible defaults if missing.

export type AiFeatureKey =
  | "support_chat"
  | "product_ai"
  | "review_generator"
  | "renewal_emails";

export type AiConfig = {
  model: string;
  features: Record<AiFeatureKey, boolean>;
};

const DEFAULTS: AiConfig = {
  model: "google/gemini-2.5-flash",
  features: {
    support_chat: true,
    product_ai: true,
    review_generator: true,
    renewal_emails: true,
  },
};

let cache: { at: number; cfg: AiConfig } | null = null;
const TTL_MS = 60_000;

export async function getAiConfig(): Promise<AiConfig> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.cfg;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) return DEFAULTS;

  try {
    const res = await fetch(
      `${url}/rest/v1/admin_records?kind=eq.site_settings&is_active=eq.true&select=data&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );
    if (!res.ok) return DEFAULTS;
    const rows = (await res.json()) as { data?: any }[];
    const raw = rows?.[0]?.data ?? {};
    const cfg: AiConfig = {
      model: typeof raw.ai_default_model === "string" && raw.ai_default_model.trim()
        ? raw.ai_default_model
        : DEFAULTS.model,
      features: { ...DEFAULTS.features, ...(raw.ai_features ?? {}) },
    };
    cache = { at: Date.now(), cfg };
    return cfg;
  } catch {
    return DEFAULTS;
  }
}

export function featureDisabledResponse(feature: AiFeatureKey, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: `AI feature "${feature}" is disabled by the admin.` }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

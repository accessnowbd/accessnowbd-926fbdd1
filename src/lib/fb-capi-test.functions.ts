import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sends a single CAPI test event ("Lead") to Meta for the given pixel row.
 * Uses the row's saved access_token; falls back to FB_CAPI_ACCESS_TOKEN secret.
 */
export const sendFbCapiTestEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pixelRowId: string }) => ({
    pixelRowId: String(input?.pixelRowId ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return { ok: false, error: "Forbidden" };
    if (!data.pixelRowId) return { ok: false, error: "Missing pixel row id" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("tracking_pixels")
      .select("pixel_id, access_token, events_config")
      .eq("id", data.pixelRowId)
      .maybeSingle();

    if (!row?.pixel_id) return { ok: false, error: "No Pixel ID saved" };
    const token =
      (row.access_token as string | null) || process.env.FB_CAPI_ACCESS_TOKEN;
    if (!token) return { ok: false, error: "No CAPI access token" };

    const cfg = (row.events_config ?? {}) as { test_event_code?: string };
    const testCode = cfg.test_event_code?.trim();

    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(row.pixel_id)}/events?access_token=${encodeURIComponent(token)}`;
    const body = JSON.stringify({
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {},
          custom_data: { source: "admin_test_event" },
        },
      ],
      ...(testCode ? { test_event_code: testCode } : {}),
    });

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const json = (await resp.json()) as {
        events_received?: number;
        fbtrace_id?: string;
        error?: { message?: string };
      };
      await supabaseAdmin.from("tracking_events_log").insert({
        provider: "facebook_pixel",
        event_name: "Lead",
        payload: { test: true, test_event_code: testCode } as never,
        status: resp.ok && !json.error ? "sent" : "failed",
        response: json as never,
        error_message: json.error?.message ?? null,
      } as never);
      if (!resp.ok || json.error) {
        return { ok: false, error: json.error?.message ?? `HTTP ${resp.status}` };
      }
      return {
        ok: true,
        events_received: json.events_received,
        fbtrace_id: json.fbtrace_id,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  });

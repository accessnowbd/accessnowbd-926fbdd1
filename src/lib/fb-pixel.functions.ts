import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verify a Facebook Pixel + CAPI connection by sending a lightweight test
 * PageView through the Graph API. Also stamps events_config with
 * connection_verified_at / last_event_at on success.
 */
export const verifyFbCapiConnection = createServerFn({ method: "POST" })
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

    if (!row?.pixel_id) return { ok: false, error: "No Pixel / Dataset ID saved" };
    const token =
      (row.access_token as string | null) || process.env.FB_CAPI_ACCESS_TOKEN;
    if (!token) return { ok: false, error: "No CAPI access token saved" };

    const cfg = (row.events_config ?? {}) as {
      test_event_code?: string;
      api_version?: string;
    };
    const testCode = cfg.test_event_code?.trim();
    const apiVersion = cfg.api_version?.trim() || "v21.0";

    const url = `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(row.pixel_id)}/events?access_token=${encodeURIComponent(token)}`;
    const body = JSON.stringify({
      data: [
        {
          event_name: "PageView",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {},
          custom_data: { source: "admin_verify_connection" },
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
      const ok = resp.ok && !json.error;

      if (ok) {
        const now = new Date().toISOString();
        const nextCfg = {
          ...(cfg as Record<string, unknown>),
          connection_verified_at: now,
          last_event_at: now,
        };
        await supabaseAdmin
          .from("tracking_pixels")
          .update({ events_config: nextCfg as never })
          .eq("id", data.pixelRowId);
      }

      await supabaseAdmin.from("tracking_events_log").insert({
        provider: "facebook_pixel",
        event_name: "PageView",
        payload: { verify: true, api_version: apiVersion } as never,
        status: ok ? "sent" : "failed",
        response: json as never,
        error_message: json.error?.message ?? null,
      } as never);

      if (!ok) {
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

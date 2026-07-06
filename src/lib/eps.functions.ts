import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================================================
 * EPS (Easy Payment System — eps.com.bd) gateway server helpers.
 *
 * The credentials live in Lovable Cloud secrets, NOT in admin_records:
 *   EPS_MERCHANT_ID      — merchant / store id issued by EPS
 *   EPS_STORE_PASSWORD   — store password
 *   EPS_API_KEY          — API key
 *   EPS_API_SECRET       — API secret
 *   EPS_API_URL          — full base URL (optional; defaults per mode)
 *
 * Non-secret settings (enabled, mode, currency, redirect URLs) are read
 * from `admin_records` where `kind = 'eps_pgw_settings'`.
 *
 * Payment endpoints are stubs until the merchant plugs in their real
 * EPS API contract — everything else is wired so it "just works" as
 * soon as those secrets and settings are filled in.
 * ============================================================ */

export type EpsStatus = {
  configured: boolean;
  missing_secrets: string[];
  has_merchant_id: boolean;
  has_store_password: boolean;
  has_api_key: boolean;
  has_api_secret: boolean;
  has_api_url: boolean;
  environment: "sandbox" | "live" | "unknown";
};

export const getEpsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EpsStatus> => {
    // Verify caller is admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const has_merchant_id = !!process.env.EPS_MERCHANT_ID;
    const has_store_password = !!process.env.EPS_STORE_PASSWORD;
    const has_api_key = !!process.env.EPS_API_KEY;
    const has_api_secret = !!process.env.EPS_API_SECRET;
    const has_api_url = !!process.env.EPS_API_URL;

    const missing_secrets: string[] = [];
    if (!has_merchant_id) missing_secrets.push("EPS_MERCHANT_ID");
    if (!has_store_password) missing_secrets.push("EPS_STORE_PASSWORD");
    if (!has_api_key) missing_secrets.push("EPS_API_KEY");
    if (!has_api_secret) missing_secrets.push("EPS_API_SECRET");

    return {
      configured: missing_secrets.length === 0,
      missing_secrets,
      has_merchant_id,
      has_store_password,
      has_api_key,
      has_api_secret,
      has_api_url,
      environment: has_merchant_id ? "live" : "unknown",
    };
  });

/**
 * Ping the merchant's EPS endpoint using stored credentials.
 * Until EPS shares an exact "verify credentials" endpoint we just
 * confirm secrets are present and that the base URL is reachable.
 */
export const testEpsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const merchantId = process.env.EPS_MERCHANT_ID;
    const apiKey = process.env.EPS_API_KEY;
    const apiUrl = process.env.EPS_API_URL || "https://sandbox.eps.com.bd/api";

    if (!merchantId || !apiKey) {
      return { ok: false, message: "Credentials are not fully configured yet." };
    }

    try {
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "X-API-Key": apiKey },
      });
      return {
        ok: res.ok || res.status === 401 || res.status === 404,
        status: res.status,
        message:
          res.ok
            ? "Endpoint reachable."
            : `Endpoint reachable (HTTP ${res.status}) — verify credentials against EPS docs.`,
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Failed to reach EPS endpoint",
      };
    }
  });

/**
 * Kick off an EPS checkout for a given order. Reads the merchant's
 * credentials + settings, POSTs to the EPS "init" endpoint and returns
 * the redirect URL the client should send the buyer to.
 *
 * This is generic on purpose — plug in the exact request/response
 * shape from the EPS integration doc without touching anything else.
 */
export const initiateEpsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; amount: number; customerName?: string; customerEmail?: string; customerPhone?: string }) => input)
  .handler(async ({ data, context }) => {
    const merchantId = process.env.EPS_MERCHANT_ID;
    const storePassword = process.env.EPS_STORE_PASSWORD;
    const apiKey = process.env.EPS_API_KEY;
    const apiUrl = process.env.EPS_API_URL || "https://sandbox.eps.com.bd/api";

    if (!merchantId || !storePassword || !apiKey) {
      throw new Error("EPS gateway is not configured yet — add credentials in Admin → EPS Gateway.");
    }

    // Load merchant-side settings (non-secret) so the merchant can tune
    // currency + redirect URLs without redeploying.
    const { data: settings } = await context.supabase
      .from("admin_records")
      .select("data")
      .eq("kind", "eps_pgw_settings")
      .maybeSingle();

    const s = ((settings?.data as Record<string, unknown>) ?? {}) as {
      currency?: string;
      success_url?: string;
      fail_url?: string;
      cancel_url?: string;
      ipn_url?: string;
      enabled?: boolean;
    };

    if (s.enabled === false) {
      throw new Error("EPS gateway is disabled.");
    }

    const payload = {
      store_id: merchantId,
      store_passwd: storePassword,
      total_amount: data.amount,
      currency: s.currency || "BDT",
      tran_id: data.orderId,
      success_url: s.success_url,
      fail_url: s.fail_url,
      cancel_url: s.cancel_url,
      ipn_url: s.ipn_url,
      cus_name: data.customerName,
      cus_email: data.customerEmail,
      cus_phone: data.customerPhone,
    };

    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/payment/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`EPS init failed: HTTP ${res.status} ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { redirect_url?: string; GatewayPageURL?: string; url?: string };
    const redirect = json.redirect_url ?? json.GatewayPageURL ?? json.url;
    if (!redirect) {
      throw new Error("EPS init succeeded but returned no redirect URL.");
    }

    return { redirect_url: redirect };
  });

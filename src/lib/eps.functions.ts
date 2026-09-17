import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================================================
 * EPS (Easy Payment System — eps.com.bd) gateway server helpers.
 *
 * Credentials + non-secret settings live in `admin_records` where
 * `kind = 'eps_pgw_settings'`. That row is stored with
 * `is_active = false` so RLS only lets admins read it — credentials
 * NEVER leak to the browser. Checkout uses `getEpsPublicConfig`
 * below, which returns only display-safe fields.
 * ============================================================ */


const SANDBOX_URL = "https://sandbox.eps.com.bd/api";
const LIVE_URL = "https://api.eps.com.bd/api";

type EpsConfig = {
  merchant_id?: string;
  store_password?: string;
  api_key?: string;
  api_secret?: string;
  api_url?: string;
  enabled?: boolean;
  mode?: "sandbox" | "live";
  currency?: string;
  success_url?: string;
  fail_url?: string;
  cancel_url?: string;
  ipn_url?: string;
  auto_verify?: boolean;
  notes?: string;
};

export type EpsStatus = {
  configured: boolean;
  missing_fields: string[];
  has_merchant_id: boolean;
  has_store_password: boolean;
  has_api_key: boolean;
  has_api_secret: boolean;
  has_api_url: boolean;
  environment: "sandbox" | "live" | "unknown";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadConfig(supabase: any): Promise<EpsConfig> {
  const { data } = await supabase
    .from("admin_records")
    .select("data")
    .eq("kind", "eps_pgw_settings")
    .maybeSingle();
  return ((data?.data as EpsConfig) ?? {}) as EpsConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const getEpsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EpsStatus> => {
    await assertAdmin(context);
    const cfg = await loadConfig(context.supabase);

    const has_merchant_id = !!cfg.merchant_id;
    const has_store_password = !!cfg.store_password;
    const has_api_key = !!cfg.api_key;
    const has_api_secret = !!cfg.api_secret;
    const has_api_url = !!cfg.api_url;

    const missing_fields: string[] = [];
    if (!has_merchant_id) missing_fields.push("Merchant ID");
    if (!has_store_password) missing_fields.push("Store Password");
    if (!has_api_key) missing_fields.push("API Key");
    if (!has_api_secret) missing_fields.push("API Secret");

    return {
      configured: missing_fields.length === 0,
      missing_fields,
      has_merchant_id,
      has_store_password,
      has_api_key,
      has_api_secret,
      has_api_url,
      environment: cfg.mode ?? "unknown",
    };
  });

export const testEpsConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const cfg = await loadConfig(context.supabase);

    if (!cfg.merchant_id || !cfg.api_key) {
      return { ok: false, message: "Credentials are not fully configured yet." };
    }

    const apiUrl = cfg.api_url || (cfg.mode === "live" ? LIVE_URL : SANDBOX_URL);

    try {
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: { "X-API-Key": cfg.api_key },
      });
      return {
        ok: res.ok || res.status === 401 || res.status === 404,
        status: res.status,
        message: res.ok
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

export const initiateEpsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; customerName?: string; customerEmail?: string; customerPhone?: string }) => input)
  .handler(async ({ data, context }) => {
    const cfg = await loadConfig(context.supabase);

    // Authoritative amount: read the order's stored total server-side.
    // The browser never decides how much is charged.
    const { data: order, error: orderErr } = await context.supabase
      .from("orders")
      .select("id,total,payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error("Order not found.");
    if (order.payment_status === "verified") throw new Error("This order is already paid.");
    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid order total.");

    if (!cfg.merchant_id || !cfg.store_password || !cfg.api_key) {
      throw new Error("EPS gateway is not configured yet — add credentials in Admin → EPS Gateway.");
    }
    if (cfg.enabled === false) throw new Error("EPS gateway is disabled.");

    const apiUrl = cfg.api_url || (cfg.mode === "live" ? LIVE_URL : SANDBOX_URL);

    const payload = {
      store_id: cfg.merchant_id,
      store_passwd: cfg.store_password,
      total_amount: amount,
      currency: cfg.currency || "BDT",
      tran_id: data.orderId,
      success_url: cfg.success_url,
      fail_url: cfg.fail_url,
      cancel_url: cfg.cancel_url,
      ipn_url: cfg.ipn_url,
      cus_name: data.customerName,
      cus_email: data.customerEmail,
      cus_phone: data.customerPhone,
    };

    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/payment/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": cfg.api_key,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`EPS init failed: HTTP ${res.status} ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { redirect_url?: string; GatewayPageURL?: string; url?: string };
    const redirect = json.redirect_url ?? json.GatewayPageURL ?? json.url;
    if (!redirect) throw new Error("EPS init succeeded but returned no redirect URL.");

    return { redirect_url: redirect };
  });

/* ------------------------------------------------------------
 * Public server function for checkout — returns only display-safe
 * flags (no credentials). Used by the browser to decide whether
 * to show the EPS payment tile.
 * ------------------------------------------------------------ */

export type EpsPublicConfig = {
  enabled: boolean;
  mode: "sandbox" | "live" | null;
  brand_color: string;
  logo_url: string | null;
  display_name: string;
};

export const getEpsPublicConfig = createServerFn({ method: "GET" })
  .handler(async (): Promise<EpsPublicConfig> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_records")
      .select("data")
      .eq("kind", "eps_pgw_settings")
      .maybeSingle();

    const cfg = ((data?.data as EpsConfig) ?? {}) as EpsConfig & {
      brand_color?: string;
      logo_url?: string;
      display_name?: string;
    };

    // Only "enabled" AND fully-credentialled counts as truly on.
    const credsPresent = !!cfg.merchant_id && !!cfg.store_password && !!cfg.api_key;

    return {
      enabled: Boolean(cfg.enabled) && credsPresent,
      mode: cfg.mode ?? null,
      brand_color: cfg.brand_color || "#0ea5e9",
      logo_url: cfg.logo_url || null,
      display_name: cfg.display_name || "EPS Payment",
    };
  });


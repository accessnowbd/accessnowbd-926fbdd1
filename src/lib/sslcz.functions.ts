import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ============================================================
 * SSLCommerz payment gateway server helpers.
 *
 * Credentials + non-secret settings live in `admin_records` where
 * `kind = 'sslcz_pgw_settings'`. That row is stored with
 * `is_active = false` so RLS only lets admins read it — credentials
 * never leak to the browser. Checkout uses `getSslczPublicConfig`,
 * which returns only display-safe fields.
 * ============================================================ */

const SANDBOX_URL = "https://sandbox.sslcommerz.com";
const LIVE_URL = "https://securepay.sslcommerz.com";

type SslczConfig = {
  store_id?: string;
  store_password?: string;
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
  display_name?: string;
  brand_color?: string;
  logo_url?: string;
};

export type SslczStatus = {
  configured: boolean;
  missing_fields: string[];
  has_store_id: boolean;
  has_store_password: boolean;
  has_api_url: boolean;
  environment: "sandbox" | "live" | "unknown";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadConfig(supabase: any): Promise<SslczConfig> {
  const { data } = await supabase
    .from("admin_records")
    .select("data")
    .eq("kind", "sslcz_pgw_settings")
    .maybeSingle();
  return ((data?.data as SslczConfig) ?? {}) as SslczConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const getSslczStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SslczStatus> => {
    await assertAdmin(context);
    const cfg = await loadConfig(context.supabase);
    const has_store_id = !!cfg.store_id;
    const has_store_password = !!cfg.store_password;
    const has_api_url = !!cfg.api_url;

    const missing_fields: string[] = [];
    if (!has_store_id) missing_fields.push("Store ID");
    if (!has_store_password) missing_fields.push("Store Password");

    return {
      configured: missing_fields.length === 0,
      missing_fields,
      has_store_id,
      has_store_password,
      has_api_url,
      environment: cfg.mode ?? "unknown",
    };
  });

export const testSslczConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const cfg = await loadConfig(context.supabase);

    if (!cfg.store_id || !cfg.store_password) {
      return { ok: false, message: "Store ID / password এখনো বসানো হয়নি।" };
    }

    const apiUrl = cfg.api_url || (cfg.mode === "live" ? LIVE_URL : SANDBOX_URL);

    try {
      const res = await fetch(`${apiUrl.replace(/\/$/, "")}/gwprocess/v4/api.php`, {
        method: "GET",
      });
      return {
        ok: res.ok || res.status === 200 || res.status === 405 || res.status === 400,
        status: res.status,
        message: `SSLCommerz endpoint reachable (HTTP ${res.status}).`,
      };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Failed to reach SSLCommerz endpoint" };
    }
  });

export const initiateSslczPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string; customerName?: string; customerEmail?: string; customerPhone?: string; customerAddress?: string }) => input)
  .handler(async ({ data, context }) => {
    const cfg = await loadConfig(context.supabase);

    // Authoritative amount: read the order's stored total server-side.
    const { data: order, error: orderErr } = await context.supabase
      .from("orders")
      .select("id,total,payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error("Order not found.");
    if (order.payment_status === "verified") throw new Error("This order is already paid.");
    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid order total.");

    if (!cfg.store_id || !cfg.store_password) {
      throw new Error("SSLCommerz gateway এখনো configured নয় — Admin → SSLCommerz Gateway এ credentials বসান।");
    }
    if (cfg.enabled === false) throw new Error("SSLCommerz gateway disabled.");

    const apiUrl = cfg.api_url || (cfg.mode === "live" ? LIVE_URL : SANDBOX_URL);

    const form = new URLSearchParams();
    form.set("store_id", cfg.store_id);
    form.set("store_passwd", cfg.store_password);
    form.set("total_amount", String(data.amount));
    form.set("currency", cfg.currency || "BDT");
    form.set("tran_id", data.orderId);
    form.set("success_url", cfg.success_url || "");
    form.set("fail_url", cfg.fail_url || "");
    form.set("cancel_url", cfg.cancel_url || "");
    if (cfg.ipn_url) form.set("ipn_url", cfg.ipn_url);
    form.set("shipping_method", "NO");
    form.set("product_name", `Order ${data.orderId}`);
    form.set("product_category", "Digital");
    form.set("product_profile", "general");
    form.set("cus_name", data.customerName || "Customer");
    form.set("cus_email", data.customerEmail || "customer@example.com");
    form.set("cus_phone", data.customerPhone || "01700000000");
    form.set("cus_add1", data.customerAddress || "Dhaka");
    form.set("cus_city", "Dhaka");
    form.set("cus_country", "Bangladesh");

    const res = await fetch(`${apiUrl.replace(/\/$/, "")}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`SSLCommerz init failed: HTTP ${res.status} ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { status?: string; GatewayPageURL?: string; redirectGatewayURL?: string; failedreason?: string };
    if (json.status !== "SUCCESS" || !json.GatewayPageURL) {
      throw new Error(`SSLCommerz init rejected: ${json.failedreason || json.status || "unknown"}`);
    }

    return { redirect_url: json.GatewayPageURL };
  });

/* ------------------------------------------------------------
 * Public server function for checkout — display-safe flags only.
 * ------------------------------------------------------------ */

export type SslczPublicConfig = {
  enabled: boolean;
  mode: "sandbox" | "live" | null;
  brand_color: string;
  logo_url: string | null;
  display_name: string;
};

export const getSslczPublicConfig = createServerFn({ method: "GET" })
  .handler(async (): Promise<SslczPublicConfig> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_records")
      .select("data")
      .eq("kind", "sslcz_pgw_settings")
      .maybeSingle();

    const cfg = ((data?.data as SslczConfig) ?? {}) as SslczConfig;
    const credsPresent = !!cfg.store_id && !!cfg.store_password;

    return {
      enabled: Boolean(cfg.enabled) && credsPresent,
      mode: cfg.mode ?? null,
      brand_color: cfg.brand_color || "#1e40af",
      logo_url: cfg.logo_url || null,
      display_name: cfg.display_name || "SSLCommerz",
    };
  });

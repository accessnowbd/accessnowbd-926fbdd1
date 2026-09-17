import { createFileRoute } from "@tanstack/react-router";
import { verifyIpnSignature, validateWithGateway } from "@/lib/ipn-verify.server";

/* ============================================================
 * EPS payment gateway IPN (Instant Payment Notification) webhook.
 *
 * Public URL (bypasses site auth):
 *   https://<your-site>/api/public/eps/ipn
 *
 * Security: the payload is NEVER trusted on its own. We
 *   1. verify the `verify_sign` hash using the store password, and
 *   2. re-validate the transaction server-to-server with the gateway, and
 *   3. compare the paid amount against the order's stored total
 * before any order status change.
 * ============================================================ */

type IpnBody = {
  tran_id?: string;         // our order id
  val_id?: string;          // EPS validation id
  status?: string;          // "VALID" | "VALIDATED" | "FAILED" | "CANCELLED"
  amount?: string | number;
  store_amount?: string | number;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  verify_sign?: string;
  verify_key?: string;
};

const SANDBOX_URL = "https://sandbox.eps.com.bd/api";
const LIVE_URL = "https://api.eps.com.bd/api";

async function readBody(request: Request): Promise<IpnBody> {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await request.json()) as IpnBody;
  }
  const form = await request.formData();
  const obj: Record<string, string> = {};
  form.forEach((v, k) => { obj[k] = String(v); });
  return obj as IpnBody;
}

export const Route = createFileRoute("/api/public/eps/ipn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: IpnBody;
        try {
          body = await readBody(request);
        } catch {
          return new Response("Invalid body", { status: 400 });
        }

        const tranId = body.tran_id;
        if (!tranId) {
          return new Response("Missing tran_id", { status: 400 });
        }

        const status = String(body.status || "").toUpperCase();
        const claimsValid = status === "VALID" || status === "VALIDATED";
        const isFailed = status === "FAILED" || status === "CANCELLED" || status === "EXPIRED";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Load gateway credentials (admin-only row).
        const { data: cfgRow } = await supabaseAdmin
          .from("admin_records")
          .select("data")
          .eq("kind", "eps_pgw_settings")
          .maybeSingle();
        const cfg = (cfgRow?.data ?? {}) as {
          merchant_id?: string;
          store_password?: string;
          api_url?: string;
          mode?: string;
          auto_verify?: boolean;
        };

        // 1. Signature check.
        const signatureOk = verifyIpnSignature(body as Record<string, unknown>, cfg.store_password);

        // 2. Server-to-server validation.
        let gatewayOk = false;
        let gatewayAmount: number | undefined;
        if (signatureOk && claimsValid && body.val_id && cfg.merchant_id && cfg.store_password) {
          const apiUrl = cfg.api_url || (cfg.mode === "live" ? LIVE_URL : SANDBOX_URL);
          const v = await validateWithGateway({
            apiUrl,
            valId: body.val_id,
            storeId: cfg.merchant_id,
            storePassword: cfg.store_password,
          });
          gatewayOk = v.ok;
          gatewayAmount = v.amount;
        }

        // 3. Amount check against the order's stored total.
        let amountOk = false;
        if (gatewayOk) {
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id,total")
            .eq("id", tranId)
            .maybeSingle();
          const paid = Number(gatewayAmount ?? body.amount ?? 0);
          amountOk = !!order && Number.isFinite(paid) && paid + 0.5 >= Number(order.total);
        }

        const trusted = signatureOk && gatewayOk && amountOk;

        // Audit log — always recorded, including rejected callbacks.
        await supabaseAdmin.from("admin_records").insert({
          kind: "eps_transaction",
          data: JSON.parse(JSON.stringify({
            tran_id: tranId,
            val_id: body.val_id ?? null,
            status,
            amount: Number(body.amount || 0),
            currency: body.currency || "BDT",
            bank_tran_id: body.bank_tran_id ?? null,
            card_type: body.card_type ?? null,
            signature_ok: signatureOk,
            gateway_validated: gatewayOk,
            amount_ok: amountOk,
            trusted,
            raw: body,
          })),
          is_active: true,
          sort_order: 0,
        });

        if (!signatureOk) {
          return new Response("Invalid signature", { status: 401 });
        }

        if (trusted) {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "verified", status: "processing", transaction_id: body.val_id || tranId })
            .eq("id", tranId);
        } else if (isFailed) {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", tranId);
        }

        return Response.json({ ok: true, verified: trusted });
      },

      GET: async () => Response.json({ ok: true, service: "EPS IPN endpoint" }),
    },
  },
});

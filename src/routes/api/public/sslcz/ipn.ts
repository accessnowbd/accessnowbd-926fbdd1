import { createFileRoute } from "@tanstack/react-router";

/* ============================================================
 * SSLCommerz IPN (Instant Payment Notification) webhook.
 * Public URL (bypasses auth):
 *   https://<your-site>/api/public/sslcz/ipn
 * SSLCommerz POSTs application/x-www-form-urlencoded with fields
 * like tran_id, val_id, status, amount, verify_sign, verify_key.
 * ============================================================ */

type IpnBody = {
  tran_id?: string;
  val_id?: string;
  status?: string;
  amount?: string | number;
  store_amount?: string | number;
  currency?: string;
  bank_tran_id?: string;
  card_type?: string;
  verify_sign?: string;
  verify_key?: string;
};

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

export const Route = createFileRoute("/api/public/sslcz/ipn")({
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
        if (!tranId) return new Response("Missing tran_id", { status: 400 });

        const status = String(body.status || "").toUpperCase();
        const isValid = status === "VALID" || status === "VALIDATED";
        const isFailed = status === "FAILED" || status === "CANCELLED" || status === "EXPIRED";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Audit log
        await supabaseAdmin.from("admin_records").insert({
          kind: "sslcz_transaction",
          data: JSON.parse(JSON.stringify({
            tran_id: tranId,
            val_id: body.val_id ?? null,
            status,
            amount: Number(body.amount || 0),
            currency: body.currency || "BDT",
            bank_tran_id: body.bank_tran_id ?? null,
            card_type: body.card_type ?? null,
            raw: body,
          })),
          is_active: true,
          sort_order: 0,
        });

        // Check auto_verify setting
        const { data: cfgRow } = await supabaseAdmin
          .from("admin_records")
          .select("data")
          .eq("kind", "sslcz_pgw_settings")
          .maybeSingle();
        const autoVerify = Boolean((cfgRow?.data as { auto_verify?: boolean } | null)?.auto_verify);

        if (isValid && autoVerify) {
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

        return Response.json({ ok: true });
      },

      GET: async () => Response.json({ ok: true, service: "SSLCommerz IPN endpoint" }),
    },
  },
});

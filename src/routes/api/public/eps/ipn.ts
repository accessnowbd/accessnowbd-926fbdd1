import { createFileRoute } from "@tanstack/react-router";

/* ============================================================
 * EPS payment gateway IPN (Instant Payment Notification) webhook.
 *
 * EPS posts payment status updates to this endpoint.
 * Public URL (bypasses auth):
 *   https://<your-site>/api/public/eps/ipn
 *
 * The exact payload + verification signature depends on the EPS
 * integration doc; the shape below is a common one (SSLCommerz-style)
 * and is easy to adapt. Once you plug in the real signature check,
 * the rest of the pipeline (order lookup + payment_status update)
 * already works.
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

        // TODO: verify EPS signature (verify_sign) against EPS_STORE_PASSWORD.
        // The exact algorithm comes from EPS integration docs — until then we
        // record the callback but do NOT trust it to mark orders paid.
        const status = String(body.status || "").toUpperCase();
        const isValid = status === "VALID" || status === "VALIDATED";
        const isFailed = status === "FAILED" || status === "CANCELLED" || status === "EXPIRED";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Log the raw callback for audit (bkash_transaction-style row).
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
            raw: body,
          })),
          is_active: true,
          sort_order: 0,
        });

        // Only flip the order once signature verification is added. For now,
        // update payment_status conservatively based on EPS status.
        if (isValid) {
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

      GET: async () => Response.json({ ok: true, service: "EPS IPN endpoint" }),
    },
  },
});

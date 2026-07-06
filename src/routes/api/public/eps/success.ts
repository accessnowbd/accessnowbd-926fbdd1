import { createFileRoute } from "@tanstack/react-router";

/* Redirect target after a successful EPS payment. EPS may POST form data
 * or GET with query params. We just extract tran_id (our order id) and
 * bounce the buyer into the order page. The IPN webhook is the source
 * of truth for order status. */

async function extractTranId(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  const q = url.searchParams.get("tran_id") || url.searchParams.get("order_id");
  if (q) return q;
  if (request.method === "POST") {
    try {
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const b = (await request.json()) as { tran_id?: string; order_id?: string };
        return b.tran_id || b.order_id || null;
      }
      const form = await request.formData();
      return (form.get("tran_id") || form.get("order_id"))?.toString() ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

function redirectTo(orderId: string | null, payment: "success" | "fail" | "cancel") {
  const target = orderId ? `/orders/${orderId}?payment=${payment}` : `/orders?payment=${payment}`;
  return new Response(null, { status: 303, headers: { Location: target } });
}

export const Route = createFileRoute("/api/public/eps/success")({
  server: {
    handlers: {
      GET: async ({ request }) => redirectTo(await extractTranId(request), "success"),
      POST: async ({ request }) => redirectTo(await extractTranId(request), "success"),
    },
  },
});

export { extractTranId, redirectTo };

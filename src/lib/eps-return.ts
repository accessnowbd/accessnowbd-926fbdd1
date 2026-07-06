/* Shared helpers for EPS gateway return-URL routes. */

export async function extractTranId(request: Request): Promise<string | null> {
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

export function redirectToOrder(
  orderId: string | null,
  payment: "success" | "fail" | "cancel",
) {
  const target = orderId ? `/orders/${orderId}?payment=${payment}` : `/orders?payment=${payment}`;
  return new Response(null, { status: 303, headers: { Location: target } });
}

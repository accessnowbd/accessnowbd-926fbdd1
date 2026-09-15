/**
 * Customer/admin-safe column list for `orders` reads through the Data API.
 *
 * `orders.admin_note` holds internal staff remarks and is intentionally NOT
 * selectable by the `authenticated`/`anon` roles (column-level privileges).
 * Never add `admin_note` here — admins read notes via the
 * `admin_order_notes()` database function instead.
 */
export const ORDER_SELECT = [
  "id",
  "user_id",
  "full_name",
  "email",
  "phone",
  "payment_method",
  "transaction_id",
  "items",
  "total",
  "status",
  "created_at",
  "delivered_credentials",
  "delivered_at",
  "updated_at",
  "whatsapp_sent",
  "payment_screenshot_url",
  "payment_status",
  "source",
  "telegram_chat_id",
  "guest_token",
].join(",");

/** Fetch admin-only order notes as a map keyed by order id (admins only). */
export async function fetchAdminOrderNotes(
  client: { rpc: (fn: never, args?: never) => PromiseLike<{ data: unknown; error: unknown }> },
): Promise<Record<string, string>> {
  const { data, error } = await client.rpc("admin_order_notes" as never);
  if (error || !Array.isArray(data)) return {};
  const map: Record<string, string> = {};
  for (const row of data as Array<{ order_id: string; admin_note: string | null }>) {
    if (row?.order_id && row.admin_note) map[row.order_id] = row.admin_note;
  }
  return map;
}

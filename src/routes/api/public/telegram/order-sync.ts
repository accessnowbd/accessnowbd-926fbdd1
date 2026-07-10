// Internal sync endpoint — called by the orders DB trigger.
// Auth: X-Sync-Secret must match process.env.TELEGRAM_SYNC_SECRET.
// Purpose:
//   • order.created         → notify admin bot with approve/reject buttons
//   • order.status_changed  → DM the customer if we know their telegram_chat_id

import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function safeEqStr(a: string, b: string) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const STATUS_LABEL: Record<string, string> = {
  pending: "⏳ Pending",
  confirmed: "🔄 Confirmed",
  processing: "🔄 Processing",
  completed: "✅ Completed",
  cancelled: "❌ Cancelled",
  rejected: "❌ Rejected",
};

export const Route = createFileRoute("/api/public/telegram/order-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.TELEGRAM_SYNC_SECRET || "";
        const got = request.headers.get("x-sync-secret") || "";
        if (!expected || !safeEqStr(got, expected)) {
          return new Response("unauthorized", { status: 401 });
        }
        let payload: any = {};
        try { payload = await request.json(); } catch { return Response.json({ ok: true }); }

        const { event, order_id, status, previous_status, telegram_chat_id } = payload;
        if (!order_id) return Response.json({ ok: true });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: order } = await (supabaseAdmin as any)
            .from("orders").select("*").eq("id", order_id).maybeSingle();
          if (!order) return Response.json({ ok: true });

          const short = `ANB-${String(order_id).slice(0, 8).toUpperCase()}`;
          const currency = "৳";

          if (event === "order.created") {
            // Admin notify
            await notifyAdmins(order, short, currency);
          }

          if (event === "order.status_changed" && telegram_chat_id) {
            const { sendMessageFor } = await import("@/lib/telegram/api.server");
            const label = STATUS_LABEL[status] || status;
            const text = [
              `📦 <b>Order update</b>`,
              `<code>${short}</code>`,
              `Status: <b>${label}</b>${previous_status ? ` (was ${previous_status})` : ""}`,
              `Total: ${currency}${Number(order.total || 0).toLocaleString()}`,
            ].join("\n");
            await sendMessageFor("store_bot", telegram_chat_id, text).catch(() => null);
          }

          // Referral reward: on first completed telegram order, credit referrer
          if (event === "order.status_changed" && status === "completed" && telegram_chat_id) {
            await tryRewardReferrer(telegram_chat_id, order);
          }

        } catch (e) {
          console.error("order-sync error", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});

async function notifyAdmins(order: any, short: string, currency: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendMessageFor } = await import("@/lib/telegram/api.server");

  const { data: admins } = await (supabaseAdmin as any)
    .from("telegram_subscribers").select("chat_id")
    .eq("bot_kind", "admin_bot").eq("role", "admin").eq("is_blocked", false);
  const adminChats: number[] = ((admins as any[]) || []).map((a) => a.chat_id).filter(Boolean);

  // Also fall back to legacy order-bot subscribers if no admin_bot users linked yet
  if (adminChats.length === 0) {
    const { data: legacy } = await (supabaseAdmin as any)
      .from("telegram_subscribers").select("chat_id")
      .eq("bot_kind", "order_bot").eq("is_blocked", false);
    ((legacy as any[]) || []).forEach((r) => r.chat_id && adminChats.push(r.chat_id));
  }
  if (adminChats.length === 0) return;

  const src = order.source === "telegram_bot" ? "📲 Telegram" : order.source === "admin" ? "🛠 Admin" : "🌐 Web";
  const itemLines = Array.isArray(order.items)
    ? order.items.slice(0, 6).map((i: any) => `  • ${i.name || i.slug} × ${i.qty || 1}`).join("\n")
    : "";
  const text = [
    `🆕 <b>New order</b> ${short}`,
    `👤 ${order.full_name}  📱 ${order.phone}`,
    `💳 ${order.payment_method} · ${src}`,
    `💰 ${currency}${Number(order.total || 0).toLocaleString()}`,
    itemLines,
  ].filter(Boolean).join("\n");

  const kb = [
    [
      { text: "✅ Approve", callback_data: `adm:ord:approve:${order.id}` },
      { text: "❌ Reject", callback_data: `adm:ord:reject:${order.id}` },
    ],
    [{ text: "🌐 Open in admin", url: `https://accessnowbd.com/admin/orders?id=${order.id}` }],
  ];
  await Promise.all(adminChats.map((cid) =>
    sendMessageFor("order_bot", cid, text, { reply_markup: { inline_keyboard: kb } }).catch(() => null),
  ));
}

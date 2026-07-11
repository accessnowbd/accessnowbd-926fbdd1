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

  // Primary source of truth: telegram_settings.order_bot.admin_chat_ids
  const adminChats: number[] = [];
  const { data: settings } = await (supabaseAdmin as any)
    .from("telegram_settings").select("config").eq("kind", "order_bot").maybeSingle();
  const cfg: any = (settings as any)?.config || {};
  if (Array.isArray(cfg.admin_chat_ids)) {
    for (const id of cfg.admin_chat_ids) {
      const n = Number(id);
      if (Number.isFinite(n) && !adminChats.includes(n)) adminChats.push(n);
    }
  }

  // Fallback: legacy subscribers with admin role
  if (adminChats.length === 0) {
    const { data: admins } = await (supabaseAdmin as any)
      .from("telegram_subscribers").select("chat_id")
      .in("bot_kind", ["admin_bot", "order_bot"])
      .eq("role", "admin").eq("is_blocked", false);
    ((admins as any[]) || []).forEach((r) => r.chat_id && adminChats.push(Number(r.chat_id)));
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

async function tryRewardReferrer(referred_chat_id: number, order: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: ref } = await db.from("telegram_referrals")
    .select("*").eq("referred_chat_id", referred_chat_id).maybeSingle();
  if (!ref || ref.rewarded) return;

  // Find referrer's linked website user
  const { data: refSub } = await db.from("telegram_subscribers")
    .select("user_id").eq("chat_id", ref.referrer_chat_id).maybeSingle();
  const referrerUserId = refSub?.user_id;
  const reward = Math.min(200, Math.round(Number(order.total || 0) * 0.05));
  if (reward <= 0) return;

  if (referrerUserId) {
    try {
      await db.rpc("admin_credit_wallet", {
        _user_id: referrerUserId, _amount: reward, _type: "referral",
        _reason: `Referral reward for order ${String(order.id).slice(0, 8)}`,
        _ref_order: order.id,
      });
    } catch (e) {
      console.error("referral credit failed", e);
    }
  }
  await db.from("telegram_referrals").update({
    rewarded: true, reward_amount: reward, first_order_id: order.id, rewarded_at: new Date().toISOString(),
  }).eq("id", ref.id);

  // Notify referrer
  try {
    const { sendMessageFor } = await import("@/lib/telegram/api.server");
    await sendMessageFor("store_bot", ref.referrer_chat_id,
      `🎉 আপনার referral order complete! Wallet-এ <b>৳${reward}</b> credit হয়েছে${referrerUserId ? "" : " (website account link করলে ব্যবহার করতে পারবেন)"}।`);
  } catch { /* ignore */ }
}


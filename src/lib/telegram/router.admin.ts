// Admin bot — Order Management bot.
// Auth model: chat_id allowlist from telegram_settings.order_bot.admin_chat_ids.
// No email/OTP — just /start on an allowlisted account and you're in.
// Commands: /start /dashboard /orders /topups /broadcast /help /id

import { sendMessageFor, answerCallbackQueryFor, editMessageTextFor } from "./api.server";

const KIND = "order_bot" as const;
const send = (chat_id: number, text: string, extra: Record<string, unknown> = {}) =>
  sendMessageFor(KIND, chat_id, text, extra);
const ack = (id: string, text?: string) => answerCallbackQueryFor(KIND, id, text);
const editText = (chat_id: number, message_id: number, text: string, extra: Record<string, unknown> = {}) =>
  editMessageTextFor(KIND, chat_id, message_id, text, extra);

type TgUser = { id: number; username?: string; first_name?: string; last_name?: string };
type TgMessage = { message_id: number; chat: { id: number }; from?: TgUser; text?: string };
type TgCallback = { id: string; from: TgUser; message?: TgMessage; data?: string };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

let _cfgCache: { at: number; ids: Set<number>; adminUserId: string | null } | null = null;
const CFG_TTL_MS = 30_000;

async function loadAdminCfg(): Promise<{ ids: Set<number>; adminUserId: string | null }> {
  if (_cfgCache && Date.now() - _cfgCache.at < CFG_TTL_MS) {
    return { ids: _cfgCache.ids, adminUserId: _cfgCache.adminUserId };
  }
  const db = await admin();
  const { data } = await db.from("telegram_settings").select("config").eq("kind", "order_bot").maybeSingle();
  const cfg = ((data as any)?.config || {}) as any;
  const raw = Array.isArray(cfg.admin_chat_ids) ? cfg.admin_chat_ids : [];
  const ids = new Set<number>(raw.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)));
  // Pick a stable admin user_id to attribute broadcasts to.
  const { data: role } = await db.from("user_roles").select("user_id").eq("role", "admin").order("created_at", { ascending: true }).limit(1).maybeSingle();
  const adminUserId = (role as any)?.user_id || null;
  _cfgCache = { at: Date.now(), ids, adminUserId };
  return { ids, adminUserId };
}

async function upsertAdminSubscriber(u: TgUser, chat_id: number, adminUserId: string | null) {
  const db = await admin();
  await db.from("telegram_subscribers").upsert(
    {
      chat_id,
      username: u.username ?? null,
      first_name: u.first_name ?? null,
      last_name: u.last_name ?? null,
      bot_kind: "admin_bot",
      role: "admin",
      user_id: adminUserId,
      last_seen_at: new Date().toISOString(),
    } as never,
    { onConflict: "chat_id" },
  );
}

async function getSubscriber(chat_id: number): Promise<any> {
  const db = await admin();
  const { data } = await db.from("telegram_subscribers").select("*").eq("chat_id", chat_id).maybeSingle();
  return data;
}

async function isAdminChat(chat_id: number): Promise<{ ok: boolean; user_id?: string }> {
  const { ids, adminUserId } = await loadAdminCfg();
  if (!ids.has(chat_id)) return { ok: false };
  return { ok: true, user_id: adminUserId || undefined };
}

async function setState(chat_id: number, state: any) {
  await (await admin()).from("telegram_subscribers").update({ state } as never).eq("chat_id", chat_id);
}

/* ============================== Entry ============================== */

export async function handleAdminUpdate(update: TgUpdate) {
  if (update.message) return handleMessage(update.message);
  if (update.callback_query) return handleCallback(update.callback_query);
}

/* ============================== Messages ============================== */

async function handleMessage(msg: TgMessage) {
  const chat_id = msg.chat.id;
  const text = (msg.text || "").trim();

  // /id works for anyone so allowlist can be maintained
  if (text.startsWith("/id")) {
    return send(chat_id, `Your chat_id: <code>${chat_id}</code>\n\nএই ID admin allowlist-এ যোগ করলে access পাবেন।`);
  }

  const auth = await isAdminChat(chat_id);
  if (!auth.ok) {
    return send(chat_id, `🚫 <b>Access denied</b>\n\nএই bot শুধু authorized admin-দের জন্য।\nYour chat_id: <code>${chat_id}</code>`);
  }

  // Authorized — ensure subscriber record & admin role
  if (msg.from) await upsertAdminSubscriber(msg.from, chat_id, auth.user_id || null);

  const sub = await getSubscriber(chat_id);
  const state = (sub?.state as any) || {};

  if (text.startsWith("/start")) {
    await setState(chat_id, {});
    return send(chat_id, [
      "👋 <b>Order Management Bot</b>",
      "",
      "Available commands:",
      "/dashboard — live stats",
      "/orders — recent orders (approve/reject inline)",
      "/topups — pending wallet top-ups",
      "/broadcast — send message to all customers",
      "/help — help",
    ].join("\n"), {
      reply_markup: { inline_keyboard: [[
        { text: "📊 Dashboard", callback_data: "adm:dash" },
        { text: "🛒 Orders", callback_data: "adm:orders" },
        { text: "💳 Top-ups", callback_data: "adm:topups" },
      ]] },
    });
  }
  if (text.startsWith("/cancel")) {
    await setState(chat_id, {});
    return send(chat_id, "❌ Cancelled.");
  }

  if (text.startsWith("/dashboard") || text.startsWith("/stats")) return showDashboard(chat_id);
  if (text.startsWith("/orders")) return listRecentOrders(chat_id);
  if (text.startsWith("/topups")) return listPendingTopups(chat_id);
  if (text.startsWith("/broadcast")) {
    await setState(chat_id, { step: "await_broadcast_message" });
    return send(chat_id, "📣 Broadcast message লিখুন। (Cancel: /cancel)");
  }
  if (state.step === "await_broadcast_message") {
    await setState(chat_id, {});
    if (!auth.user_id) return send(chat_id, "❌ Admin user account পাওয়া যায়নি।");
    return sendBroadcast(chat_id, text, auth.user_id);
  }
  if (text.startsWith("/help")) return sendAdminHelp(chat_id);

  return send(chat_id, "কমান্ড বুঝিনি। /help দেখুন।");
}



/* ---------------- Dashboard ---------------- */

async function showDashboard(chat_id: number) {
  const db = await admin();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

  const [ordersToday, revToday, pending, ticketsOpen, topupsPending, revWeek] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00Z`),
    db.from("orders").select("total").gte("created_at", `${today}T00:00:00Z`).in("status", ["completed", "confirmed", "processing"]),
    db.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "pending"]),
    db.from("wallet_topups").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("orders").select("total").gte("created_at", weekAgo).in("status", ["completed", "confirmed", "processing"]),
  ]);

  const sumOf = (r: any) => (r.data as any[] | null || []).reduce((s, o) => s + Number(o.total || 0), 0);
  const text = [
    "📊 <b>Dashboard</b>",
    "",
    `🛒 Today's orders: <b>${ordersToday.count ?? 0}</b>`,
    `💰 Today's revenue: <b>৳${sumOf(revToday).toLocaleString()}</b>`,
    `📅 This week: <b>৳${sumOf(revWeek).toLocaleString()}</b>`,
    "",
    `⏳ Pending orders: <b>${pending.count ?? 0}</b>`,
    `🎫 Open tickets: <b>${ticketsOpen.count ?? 0}</b>`,
    `💳 Pending top-ups: <b>${topupsPending.count ?? 0}</b>`,
  ].join("\n");
  return send(chat_id, text, {
    reply_markup: { inline_keyboard: [[
      { text: "🛒 Orders", callback_data: "adm:orders" },
      { text: "💳 Top-ups", callback_data: "adm:topups" },
    ]] },
  });
}

/* ---------------- Orders list ---------------- */

async function listRecentOrders(chat_id: number, page = 0) {
  const db = await admin();
  const perPage = 5;
  const { data } = await db.from("orders")
    .select("id, full_name, total, status, source, payment_method, created_at")
    .order("created_at", { ascending: false })
    .range(page * perPage, page * perPage + perPage - 1);
  const orders = (data as any[]) || [];
  if (!orders.length) return send(chat_id, "কোনো order নেই।");
  for (const o of orders) {
    await sendOrderCard(chat_id, o.id);
  }
  const nav: any[] = [];
  if (page > 0) nav.push({ text: "◀️ Prev", callback_data: `adm:opage:${page - 1}` });
  if (orders.length === perPage) nav.push({ text: "Next ▶️", callback_data: `adm:opage:${page + 1}` });
  if (nav.length) await send(chat_id, `Page ${page + 1}`, { reply_markup: { inline_keyboard: [nav] } });
}

async function sendOrderCard(chat_id: number, orderId: string) {
  const db = await admin();
  const { data } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  const o = data as any;
  if (!o) return send(chat_id, `Order not found: ${orderId}`);
  const short = `ANB-${String(o.id).slice(0, 8).toUpperCase()}`;
  const src = o.source === "telegram_bot" ? "📲 Telegram" : o.source === "admin" ? "🛠 Admin" : "🌐 Web";
  const itemLines = Array.isArray(o.items)
    ? o.items.map((i: any) => `  • ${i.name || i.slug} × ${i.qty || 1}`).join("\n")
    : "";
  const text = [
    `<b>${short}</b> — ${statusEmoji(o.status)} ${o.status}`,
    `👤 ${o.full_name}  📱 ${o.phone}`,
    `💳 ${o.payment_method} · ${src}`,
    `💰 ৳${Number(o.total || 0).toLocaleString()}`,
    itemLines,
  ].filter(Boolean).join("\n");
  const kb = actionKeyboardForOrder(o);
  return send(chat_id, text, { reply_markup: { inline_keyboard: kb } });
}

function statusEmoji(s: string) {
  return s === "completed" ? "✅"
    : s === "confirmed" || s === "processing" ? "🔄"
    : s === "cancelled" || s === "rejected" ? "❌"
    : "⏳";
}

function actionKeyboardForOrder(o: any) {
  const id = o.id;
  const kb: any[][] = [];
  if (o.status === "pending") {
    kb.push([
      { text: "✅ Approve", callback_data: `adm:ord:approve:${id}` },
      { text: "❌ Reject", callback_data: `adm:ord:reject:${id}` },
    ]);
  } else if (o.status === "confirmed" || o.status === "processing") {
    kb.push([{ text: "✅ Mark completed", callback_data: `adm:ord:complete:${id}` }]);
  }
  kb.push([{ text: "🌐 Open in admin", url: `https://accessnowbd.com/admin/orders?id=${id}` }]);
  return kb;
}

/* ---------------- Top-ups ---------------- */

async function listPendingTopups(chat_id: number) {
  const db = await admin();
  const { data } = await db.from("wallet_topups")
    .select("id, user_id, amount, method, created_at")
    .eq("status", "pending").order("created_at", { ascending: false }).limit(10);
  const rows = (data as any[]) || [];
  if (!rows.length) return send(chat_id, "কোনো pending top-up নেই।");
  for (const t of rows) {
    const text = [
      `💳 <b>Top-up ৳${Number(t.amount).toLocaleString()}</b>`,
      `Method: ${t.method || "-"}`,
      `User: <code>${t.user_id}</code>`,
    ].join("\n");
    await send(chat_id, text, { reply_markup: { inline_keyboard: [[
      { text: "✅ Approve", callback_data: `adm:topup:approve:${t.id}` },
      { text: "❌ Reject", callback_data: `adm:topup:reject:${t.id}` },
    ]] } });
  }
}

/* ---------------- Broadcast (simple text-only) ---------------- */

async function sendBroadcast(chat_id: number, message: string, adminUserId: string) {
  const db = await admin();
  const { data: bcast, error } = await db.from("telegram_broadcasts").insert({
    created_by: adminUserId, audience: "all", message, status: "sending",
  } as never).select("id").single();
  if (error) return send(chat_id, `❌ ${error.message}`);
  const bcastId = (bcast as any).id;

  const { data: subs } = await db.from("telegram_subscribers")
    .select("chat_id, notify_promos").eq("bot_kind", "store_bot").eq("is_blocked", false);
  const list = ((subs as any[]) || []).filter((s) => s.notify_promos !== false);
  await db.from("telegram_broadcasts").update({ target_count: list.length } as never).eq("id", bcastId);

  await send(chat_id, `📣 Sending to ${list.length} subscribers...`);
  let sent = 0, failed = 0;
  const { sendMessageFor } = await import("./api.server");
  for (let i = 0; i < list.length; i++) {
    try {
      await sendMessageFor("store_bot", list[i].chat_id, message);
      sent++;
    } catch { failed++; }
    if (i > 0 && i % 25 === 0) await new Promise((r) => setTimeout(r, 1000));
  }
  await db.from("telegram_broadcasts").update({
    status: failed > 0 && sent === 0 ? "failed" : "sent",
    sent_count: sent, failed_count: failed, completed_at: new Date().toISOString(),
  } as never).eq("id", bcastId);
  return send(chat_id, `✅ Broadcast complete — sent ${sent}, failed ${failed}.`);
}

/* ---------------- Help ---------------- */

async function sendAdminHelp(chat_id: number) {
  return send(chat_id, [
    "<b>Admin bot commands</b>",
    "/dashboard — live stats",
    "/orders — recent orders (approve/reject inline)",
    "/topups — pending wallet top-ups",
    "/broadcast — send message to all customers",
    "/logout — sign out",
  ].join("\n"));
}

/* ============================== Callbacks ============================== */

async function handleCallback(cb: TgCallback) {
  const chat_id = cb.message?.chat.id;
  if (!chat_id) return;
  const data = cb.data || "";
  if (cb.from) await upsertAdminSubscriber(cb.from, chat_id);

  const auth = await isAdminChat(chat_id);
  if (!auth.ok) {
    await ack(cb.id, "🔒 Not signed in");
    return send(chat_id, "🔒 Sign in first: /login");
  }

  if (data === "adm:orders") { await ack(cb.id); return listRecentOrders(chat_id); }
  if (data === "adm:topups") { await ack(cb.id); return listPendingTopups(chat_id); }

  if (data.startsWith("adm:opage:")) {
    await ack(cb.id);
    return listRecentOrders(chat_id, Number(data.slice("adm:opage:".length)) || 0);
  }

  if (data.startsWith("adm:ord:")) {
    const [, , action, orderId] = data.split(":");
    return handleOrderAction(cb, chat_id, action, orderId);
  }

  if (data.startsWith("adm:topup:")) {
    const [, , action, topupId] = data.split(":");
    return handleTopupAction(cb, chat_id, action, topupId);
  }

  await ack(cb.id);
}

async function handleOrderAction(cb: TgCallback, chat_id: number, action: string, orderId: string) {
  const db = await admin();
  const nextStatus =
    action === "approve" ? "confirmed" :
    action === "reject" ? "cancelled" :
    action === "complete" ? "completed" : null;
  if (!nextStatus) { await ack(cb.id, "unknown"); return; }

  const { data: prev } = await db.from("orders").select("full_name, total, telegram_chat_id, status").eq("id", orderId).maybeSingle();
  const { error } = await db.from("orders").update({ status: nextStatus } as never).eq("id", orderId);
  if (error) { await ack(cb.id, `❌ ${error.message}`); return; }

  await ack(cb.id, `✅ ${nextStatus}`);
  const short = `ANB-${orderId.slice(0, 8).toUpperCase()}`;
  if (cb.message) {
    await editText(chat_id, cb.message.message_id,
      `<b>${short}</b> — ${statusEmoji(nextStatus)} <b>${nextStatus}</b>\nCustomer: ${(prev as any)?.full_name || "-"} — ৳${Number((prev as any)?.total || 0).toLocaleString()}`,
      { reply_markup: { inline_keyboard: [[{ text: "🌐 Open in admin", url: `https://accessnowbd.com/admin/orders?id=${orderId}` }]] } });
  }
  // NOTE: the DB trigger will notify the customer automatically via order-sync endpoint.
}

async function handleTopupAction(cb: TgCallback, chat_id: number, action: string, topupId: string) {
  const db = await admin();
  const rpc = action === "approve" ? "approve_wallet_topup" : "reject_wallet_topup";
  const { error } = await db.rpc(rpc as never, { _topup_id: topupId, _admin_note: `via admin bot` } as never);
  if (error) { await ack(cb.id, `❌ ${error.message}`); return; }
  await ack(cb.id, action === "approve" ? "✅ Approved" : "❌ Rejected");
  if (cb.message) {
    await editText(chat_id, cb.message.message_id,
      `💳 Top-up <b>${action === "approve" ? "approved ✅" : "rejected ❌"}</b>`);
  }
}

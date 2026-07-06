// Telegram command router — server-only.
// Handles /start, /browse, /cart, /orders, /help + inline callback queries.

import { sendMessage, sendPhoto, answerCallbackQuery, renderTemplate } from "./api.server";

type TgUser = { id: number; username?: string; first_name?: string; last_name?: string };
type TgMessage = { message_id: number; chat: { id: number }; from?: TgUser; text?: string };
type TgCallback = { id: string; from: TgUser; message?: TgMessage; data?: string };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

type CartItem = { slug: string; qty: number; name?: string; price?: number };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadSettings(kind: "store_bot" | "order_bot") {
  const db = await admin();
  const { data } = await db.from("telegram_settings").select("enabled, config").eq("kind", kind).maybeSingle();
  return data as { enabled: boolean; config: any } | null;
}

async function upsertSubscriber(u: TgUser, chat_id: number) {
  const db = await admin();
  await db.from("telegram_subscribers").upsert({
    chat_id,
    username: u.username ?? null,
    first_name: u.first_name ?? null,
    last_name: u.last_name ?? null,
    last_seen_at: new Date().toISOString(),
  } as never, { onConflict: "chat_id" });
}

async function getSubscriber(chat_id: number) {
  const db = await admin();
  const { data } = await db.from("telegram_subscribers").select("*").eq("chat_id", chat_id).maybeSingle();
  return data as any;
}

async function updateSubscriber(chat_id: number, patch: Record<string, unknown>) {
  const db = await admin();
  await db.from("telegram_subscribers").update(patch as never).eq("chat_id", chat_id);
}

/* ---------------- Public entry ---------------- */

export async function handleTelegramUpdate(update: TgUpdate) {
  if (update.message) return handleMessage(update.message);
  if (update.callback_query) return handleCallback(update.callback_query);
}

/* ---------------- Message handler ---------------- */

async function handleMessage(msg: TgMessage) {
  const chat_id = msg.chat.id;
  const text = (msg.text || "").trim();
  if (msg.from) await upsertSubscriber(msg.from, chat_id);

  const store = await loadSettings("store_bot");
  if (!store?.enabled) {
    const closed = store?.config?.closed_message || "Store is currently closed.";
    return sendMessage(chat_id, closed);
  }

  const sub = await getSubscriber(chat_id);
  const state = (sub?.state as any) || {};

  // Checkout state machine
  if (state.step === "await_name") {
    await updateSubscriber(chat_id, { state: { ...state, step: "await_phone", name: text } });
    return sendMessage(chat_id, "📱 আপনার ফোন নম্বর দিন (01XXXXXXXXX):");
  }
  if (state.step === "await_phone") {
    if (!/^01[0-9]{9}$/.test(text)) return sendMessage(chat_id, "❌ ভুল ফরম্যাট। আবার দিন (01XXXXXXXXX):");
    await updateSubscriber(chat_id, { state: { ...state, step: "await_address", phone: text } });
    return sendMessage(chat_id, "🏠 পুরো ডেলিভারি ঠিকানা লিখুন:");
  }
  if (state.step === "await_address") {
    return placeOrder(chat_id, { ...state, address: text }, sub);
  }

  // Commands
  if (text.startsWith("/start")) {
    const welcome = store.config?.welcome_message || "👋 স্বাগতম!";
    return sendMessage(chat_id, renderTemplate(welcome, {}), {
      reply_markup: mainMenu(),
    });
  }
  if (text.startsWith("/browse") || text === "🛍️ Browse") return showCatalog(chat_id, 0);
  if (text.startsWith("/cart") || text === "🛒 Cart") return showCart(chat_id);
  if (text.startsWith("/checkout")) return startCheckout(chat_id);
  if (text.startsWith("/orders") || text === "📦 My Orders") return showOrders(chat_id, sub?.user_id);
  if (text.startsWith("/help") || text === "❓ Help") return sendHelp(chat_id);
  if (text.startsWith("/id")) return sendMessage(chat_id, `Your chat_id: <code>${chat_id}</code>`);

  return sendMessage(chat_id, "কমান্ড বুঝিনি। /help দেখুন।", { reply_markup: mainMenu() });
}

function mainMenu() {
  return {
    keyboard: [
      [{ text: "🛍️ Browse" }, { text: "🛒 Cart" }],
      [{ text: "📦 My Orders" }, { text: "❓ Help" }],
    ],
    resize_keyboard: true,
  };
}

/* ---------------- Catalog ---------------- */

async function showCatalog(chat_id: number, page: number) {
  const store = await loadSettings("store_bot");
  const perPage = Math.max(1, Math.min(10, store?.config?.per_page ?? 5));
  const mode = store?.config?.browse_mode || "featured";
  const db = await admin();

  let q = db.from("products").select("slug,name,image_url,category,badge,stock_status,plans").eq("is_active", true).order("sort_order", { ascending: true });
  if (mode === "featured") q = q.not("badge", "is", null);
  q = q.range(page * perPage, page * perPage + perPage - 1);

  const { data: products } = await q;
  if (!products || products.length === 0) {
    return sendMessage(chat_id, "কোনো প্রোডাক্ট পাওয়া যায়নি।", { reply_markup: mainMenu() });
  }

  for (const p of products as any[]) {
    const price = firstPrice(p.plans);
    const stockLine = p.stock_status && p.stock_status !== "in_stock" ? `❌ ${p.stock_status}` : "✅ In stock";
    const priceLine = price ? `💰 ৳${price}` : "";
    const caption = `<b>${escapeHtml(p.name)}</b>\n${priceLine}\n${stockLine}`.trim();
    const buttons: any[][] = [[
      { text: "➕ Add to cart", callback_data: `add:${p.slug}` },
      { text: "🌐 View", url: (store?.config?.buy_link_fallback || "https://accessnowbd.com/product/{{slug}}").replace("{{slug}}", p.slug) },
    ]];
    if (p.image_url) {
      await sendPhoto(chat_id, p.image_url, caption, { reply_markup: { inline_keyboard: buttons } });
    } else {
      await sendMessage(chat_id, caption, { reply_markup: { inline_keyboard: buttons } });
    }
  }

  const nav: any[] = [];
  if (page > 0) nav.push({ text: "◀️ Prev", callback_data: `page:${page - 1}` });
  if (products.length === perPage) nav.push({ text: "Next ▶️", callback_data: `page:${page + 1}` });
  if (nav.length) await sendMessage(chat_id, `Page ${page + 1}`, { reply_markup: { inline_keyboard: [nav] } });
}

function firstPrice(plans: any): number | null {
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const p = plans[0];
  const v = typeof p === "object" ? (p?.price ?? p?.amount ?? null) : null;
  return typeof v === "number" ? v : (v ? Number(v) || null : null);
}

/* ---------------- Cart ---------------- */

async function addToCart(chat_id: number, slug: string) {
  const sub = await getSubscriber(chat_id);
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  const existing = cart.find((c) => c.slug === slug);
  if (existing) existing.qty += 1;
  else cart.push({ slug, qty: 1 });
  await updateSubscriber(chat_id, { cart });
}

async function showCart(chat_id: number) {
  const sub = await getSubscriber(chat_id);
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  if (cart.length === 0) return sendMessage(chat_id, "🛒 কার্ট খালি। /browse দিন।", { reply_markup: mainMenu() });

  const db = await admin();
  const { data: products } = await db.from("products").select("slug,name,plans").in("slug", cart.map((c) => c.slug));
  const priceOf = new Map<string, { name: string; price: number }>();
  (products as any[] | null)?.forEach((p) => priceOf.set(p.slug, { name: p.name, price: firstPrice(p.plans) || 0 }));

  let total = 0;
  const lines = cart.map((c, i) => {
    const p = priceOf.get(c.slug);
    const lineTotal = (p?.price || 0) * c.qty;
    total += lineTotal;
    return `${i + 1}. ${escapeHtml(p?.name || c.slug)} × ${c.qty} — ৳${lineTotal}`;
  });

  const text = `<b>🛒 Your cart</b>\n\n${lines.join("\n")}\n\n<b>Total: ৳${total}</b>`;
  return sendMessage(chat_id, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Checkout", callback_data: "checkout" }, { text: "🗑️ Clear", callback_data: "clear" }],
      ],
    },
  });
}

async function startCheckout(chat_id: number) {
  const sub = await getSubscriber(chat_id);
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  if (cart.length === 0) return sendMessage(chat_id, "🛒 কার্ট খালি।");
  await updateSubscriber(chat_id, { state: { step: "await_name" } });
  return sendMessage(chat_id, "👤 আপনার পুরো নাম দিন:");
}

async function placeOrder(chat_id: number, state: any, sub: any) {
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  if (cart.length === 0) {
    await updateSubscriber(chat_id, { state: {} });
    return sendMessage(chat_id, "কার্ট খালি হয়ে গেছে। আবার শুরু করুন।");
  }
  const db = await admin();
  const { data: products } = await db.from("products").select("slug,name,image_url,plans").in("slug", cart.map((c) => c.slug));
  const priceOf = new Map<string, any>();
  (products as any[] | null)?.forEach((p) => priceOf.set(p.slug, p));

  const items = cart.map((c) => {
    const p = priceOf.get(c.slug) || {};
    return { slug: c.slug, qty: c.qty, name: p.name || c.slug, price: firstPrice(p.plans) || 0, image: p.image_url || null };
  });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: sub?.user_id ?? null,
      full_name: state.name || sub?.first_name || "Telegram user",
      email: `tg-${chat_id}@telegram.local`,
      phone: state.phone,
      payment_method: "cod",
      transaction_id: `TG-${Date.now()}`,
      items: items as never,
      total,
      admin_note: `[telegram chat_id=${chat_id}] Address: ${state.address}`,
    } as never)
    .select("id")
    .single();

  if (error || !order) {
    return sendMessage(chat_id, `❌ Order create failed: ${error?.message || "unknown"}`);
  }
  const orderId = (order as any).id as string;
  const short = `ANB-${orderId.slice(0, 8).toUpperCase()}`;

  await updateSubscriber(chat_id, { cart: [], state: {} });

  // Notify admins
  try {
    const { notifyTelegram } = await import("./notify.functions");
    await notifyTelegram({
      data: {
        event: "order_created",
        vars: {
          order_id: short,
          customer: state.name,
          total,
          items: items.map((i) => `${i.name}×${i.qty}`).join(", "),
        },
      },
    });
  } catch { /* ignore */ }

  return sendMessage(
    chat_id,
    `✅ <b>অর্ডার নিশ্চিত হয়েছে!</b>\n\nOrder ID: <code>${short}</code>\nMotal: ৳${total}\nPayment: Cash on Delivery\n\nআমরা শীঘ্রই যোগাযোগ করবো।`,
    { reply_markup: mainMenu() },
  );
}

/* ---------------- Orders / help ---------------- */

async function showOrders(chat_id: number, user_id?: string | null) {
  const db = await admin();
  let q = db.from("orders").select("id,total,status,created_at").order("created_at", { ascending: false }).limit(5);
  if (user_id) q = q.eq("user_id", user_id);
  else q = q.ilike("admin_note", `%chat_id=${chat_id}%`);
  const { data } = await q;
  const orders = (data as any[]) || [];
  if (orders.length === 0) return sendMessage(chat_id, "এখনো কোনো অর্ডার নেই।", { reply_markup: mainMenu() });
  const lines = orders.map((o) => `• <code>ANB-${o.id.slice(0, 8).toUpperCase()}</code> — ৳${o.total} — ${o.status || "pending"}`);
  return sendMessage(chat_id, `<b>📦 Recent orders</b>\n\n${lines.join("\n")}`, { reply_markup: mainMenu() });
}

async function sendHelp(chat_id: number) {
  const text = [
    "<b>Commands</b>",
    "/browse — প্রোডাক্ট দেখুন",
    "/cart — কার্ট দেখুন",
    "/checkout — অর্ডার করুন",
    "/orders — আপনার অর্ডার",
    "/id — chat id দেখুন",
    "/help — সাহায্য",
  ].join("\n");
  return sendMessage(chat_id, text, { reply_markup: mainMenu() });
}

/* ---------------- Callback queries ---------------- */

async function handleCallback(cb: TgCallback) {
  const chat_id = cb.message?.chat.id;
  if (!chat_id) return;
  const data = cb.data || "";
  if (cb.from) await upsertSubscriber(cb.from, chat_id);

  if (data.startsWith("add:")) {
    const slug = data.slice(4);
    await addToCart(chat_id, slug);
    await answerCallbackQuery(cb.id, "কার্টে যোগ হয়েছে ✅");
    return;
  }
  if (data.startsWith("page:")) {
    await answerCallbackQuery(cb.id);
    return showCatalog(chat_id, Number(data.slice(5)) || 0);
  }
  if (data === "checkout") {
    await answerCallbackQuery(cb.id);
    return startCheckout(chat_id);
  }
  if (data === "clear") {
    await updateSubscriber(chat_id, { cart: [] });
    await answerCallbackQuery(cb.id, "কার্ট খালি করা হয়েছে");
    return sendMessage(chat_id, "🗑️ কার্ট খালি।", { reply_markup: mainMenu() });
  }
  await answerCallbackQuery(cb.id);
}

function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

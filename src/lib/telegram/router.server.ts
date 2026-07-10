// Telegram STORE BOT command router — server-only.
// Customer-facing bot: /start /browse /cart /checkout /orders /help + free-text search.

import { sendMessageFor, sendPhotoFor, answerCallbackQueryFor, renderTemplate } from "./api.server";

const sendMessage = (chat_id: number | string, text: string, extra: Record<string, unknown> = {}) =>
  sendMessageFor("store_bot", chat_id, text, extra);
const sendPhoto = (chat_id: number | string, photo: string, caption?: string, extra: Record<string, unknown> = {}) =>
  sendPhotoFor("store_bot", chat_id, photo, caption, extra);
const answerCallbackQuery = (id: string, text?: string) => answerCallbackQueryFor("store_bot", id, text);

type TgUser = { id: number; username?: string; first_name?: string; last_name?: string };
type TgMessage = { message_id: number; chat: { id: number }; from?: TgUser; text?: string };
type TgCallback = { id: string; from: TgUser; message?: TgMessage; data?: string };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };
type CartItem = { slug: string; qty: number; name?: string; price?: number };

type StoreCfg = {
  welcome_message?: string;
  closed_message?: string;
  order_confirmed_template?: string;
  browse_mode?: "featured" | "all";
  per_page?: number;
  currency?: string;
  show_price?: boolean;
  show_stock?: boolean;
  buy_link_fallback?: string;
  contact_link?: string;
  categories_filter?: string[];
  payment_methods?: string[];
  menu_labels?: { browse?: string; cart?: string; orders?: string; help?: string };
  notify_admin_on_order?: boolean;
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "💵 Cash on Delivery",
  bkash: "📱 bKash",
  nagad: "📱 Nagad",
  wallet: "💰 Wallet",
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadCfg(): Promise<{ enabled: boolean; cfg: StoreCfg }> {
  const db = await admin();
  const { data } = await db.from("telegram_settings").select("enabled, config").eq("kind", "store_bot").maybeSingle();
  return { enabled: !!(data as any)?.enabled, cfg: ((data as any)?.config || {}) as StoreCfg };
}

async function upsertSubscriber(u: TgUser, chat_id: number) {
  const db = await admin();
  await db.from("telegram_subscribers").upsert({
    chat_id, username: u.username ?? null, first_name: u.first_name ?? null,
    last_name: u.last_name ?? null, last_seen_at: new Date().toISOString(),
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

function menu(cfg: StoreCfg) {
  const l = cfg.menu_labels || {};
  return {
    keyboard: [
      [{ text: l.browse || "🛍️ Browse" }, { text: l.cart || "🛒 Cart" }],
      [{ text: l.orders || "📦 My Orders" }, { text: l.help || "❓ Help" }],
    ],
    resize_keyboard: true,
  };
}

function isMenuText(text: string, cfg: StoreCfg, key: "browse" | "cart" | "orders" | "help") {
  const defaults = { browse: "🛍️ Browse", cart: "🛒 Cart", orders: "📦 My Orders", help: "❓ Help" };
  const label = cfg.menu_labels?.[key] || defaults[key];
  return text === label || text === defaults[key];
}

/* ---------------- Message handler ---------------- */

async function handleMessage(msg: TgMessage) {
  const chat_id = msg.chat.id;
  const text = (msg.text || "").trim();
  if (msg.from) await upsertSubscriber(msg.from, chat_id);

  const { enabled, cfg } = await loadCfg();
  if (!enabled) {
    return sendMessage(chat_id, cfg.closed_message || "🚫 Store is currently closed.");
  }

  const sub = await getSubscriber(chat_id);
  const state = (sub?.state as any) || {};

  // ---- Checkout state machine ----
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
    await updateSubscriber(chat_id, { state: { ...state, step: "await_payment", address: text } });
    return askPaymentMethod(chat_id, cfg);
  }
  if (state.step === "await_txid") {
    return placeOrder(chat_id, { ...state, transaction_id: text }, sub, cfg);
  }

  // ---- Commands ----
  if (text.startsWith("/start")) {
    const welcome = cfg.welcome_message || "👋 স্বাগতম!";
    return sendMessage(chat_id, renderTemplate(welcome, {}), { reply_markup: menu(cfg) });
  }
  if (text.startsWith("/browse") || isMenuText(text, cfg, "browse")) return showCatalog(chat_id, 0, cfg);
  if (text.startsWith("/cart") || isMenuText(text, cfg, "cart")) return showCart(chat_id, cfg);
  if (text.startsWith("/checkout")) return startCheckout(chat_id, cfg);
  if (text.startsWith("/orders") || isMenuText(text, cfg, "orders")) return showOrders(chat_id, sub?.user_id, cfg);
  if (text.startsWith("/help") || isMenuText(text, cfg, "help")) return sendHelp(chat_id, cfg);
  if (text.startsWith("/id")) return sendMessage(chat_id, `Your chat_id: <code>${chat_id}</code>`);
  if (text.startsWith("/search")) {
    const q = text.replace(/^\/search\s*/, "").trim();
    return q ? searchProducts(chat_id, q, cfg) : sendMessage(chat_id, "🔍 প্রোডাক্টের নাম লিখে সার্চ করুন");
  }

  // ---- Free-text = search ----
  if (text && !text.startsWith("/")) {
    return searchProducts(chat_id, text, cfg);
  }

  return sendMessage(chat_id, "কমান্ড বুঝিনি। /help দেখুন।", { reply_markup: menu(cfg) });
}

/* ---------------- Catalog ---------------- */

async function showCatalog(chat_id: number, page: number, cfg: StoreCfg) {
  const perPage = Math.max(1, Math.min(10, cfg.per_page ?? 5));
  const db = await admin();

  let q = db.from("products")
    .select("slug,name,image_url,category,badge,stock_status,plans,tagline")
    .eq("is_active", true).order("sort_order", { ascending: true });
  if (cfg.browse_mode === "featured") q = q.not("badge", "is", null);
  if (cfg.categories_filter && cfg.categories_filter.length) q = q.in("category", cfg.categories_filter);
  q = q.range(page * perPage, page * perPage + perPage - 1);

  const { data: products } = await q;
  if (!products || products.length === 0) {
    return sendMessage(chat_id, "কোনো প্রোডাক্ট পাওয়া যায়নি।", { reply_markup: menu(cfg) });
  }
  await renderProductList(chat_id, products as any[], page, perPage, cfg);
}

async function searchProducts(chat_id: number, query: string, cfg: StoreCfg) {
  const db = await admin();
  const q = query.replace(/[%_]/g, "").trim();
  let sql = db.from("products")
    .select("slug,name,image_url,category,badge,stock_status,plans,tagline")
    .eq("is_active", true)
    .or(`name.ilike.%${q}%,tagline.ilike.%${q}%,category.ilike.%${q}%`)
    .limit(cfg.per_page ?? 5);
  if (cfg.categories_filter && cfg.categories_filter.length) sql = sql.in("category", cfg.categories_filter);
  const { data } = await sql;
  if (!data || data.length === 0) {
    return sendMessage(chat_id, `🔍 "<b>${escapeHtml(query)}</b>" — কিছু পাওয়া যায়নি।`, { reply_markup: menu(cfg) });
  }
  await sendMessage(chat_id, `🔍 "<b>${escapeHtml(query)}</b>" — ${data.length}টি প্রোডাক্ট:`);
  await renderProductList(chat_id, data as any[], 0, cfg.per_page ?? 5, cfg, false);
}

async function renderProductList(chat_id: number, products: any[], page: number, perPage: number, cfg: StoreCfg, withNav = true) {
  const currency = cfg.currency || "৳";
  for (const p of products) {
    const price = firstPrice(p.plans);
    const priceLine = cfg.show_price !== false && price ? `💰 ${currency}${price}` : "";
    const stockLine = cfg.show_stock !== false
      ? (p.stock_status && p.stock_status !== "in_stock" ? `❌ ${p.stock_status}` : "✅ In stock")
      : "";
    const caption = [`<b>${escapeHtml(p.name)}</b>`, priceLine, stockLine].filter(Boolean).join("\n");
    const linkFallback = (cfg.buy_link_fallback || "https://accessnowbd.com/product/{{slug}}").replace("{{slug}}", p.slug);
    const buttons: any[][] = [[
      { text: "➕ Add to cart", callback_data: `add:${p.slug}` },
      { text: "🌐 Website", url: linkFallback },
    ]];
    if (p.image_url) await sendPhoto(chat_id, p.image_url, caption, { reply_markup: { inline_keyboard: buttons } });
    else await sendMessage(chat_id, caption, { reply_markup: { inline_keyboard: buttons } });
  }
  if (withNav) {
    const nav: any[] = [];
    if (page > 0) nav.push({ text: "◀️ Prev", callback_data: `page:${page - 1}` });
    if (products.length === perPage) nav.push({ text: "Next ▶️", callback_data: `page:${page + 1}` });
    if (nav.length) await sendMessage(chat_id, `Page ${page + 1}`, { reply_markup: { inline_keyboard: [nav] } });
  }
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

async function showCart(chat_id: number, cfg: StoreCfg) {
  const sub = await getSubscriber(chat_id);
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  const currency = cfg.currency || "৳";
  if (cart.length === 0) return sendMessage(chat_id, "🛒 কার্ট খালি। /browse দিন।", { reply_markup: menu(cfg) });

  const db = await admin();
  const { data: products } = await db.from("products").select("slug,name,plans").in("slug", cart.map((c) => c.slug));
  const priceOf = new Map<string, { name: string; price: number }>();
  (products as any[] | null)?.forEach((p) => priceOf.set(p.slug, { name: p.name, price: firstPrice(p.plans) || 0 }));

  let total = 0;
  const lines = cart.map((c, i) => {
    const p = priceOf.get(c.slug);
    const lineTotal = (p?.price || 0) * c.qty;
    total += lineTotal;
    return `${i + 1}. ${escapeHtml(p?.name || c.slug)} × ${c.qty} — ${currency}${lineTotal}`;
  });

  const text = `<b>🛒 Your cart</b>\n\n${lines.join("\n")}\n\n<b>Total: ${currency}${total}</b>`;
  return sendMessage(chat_id, text, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Checkout", callback_data: "checkout" },
        { text: "🗑️ Clear", callback_data: "clear" },
      ]],
    },
  });
}

async function startCheckout(chat_id: number, cfg: StoreCfg) {
  const sub = await getSubscriber(chat_id);
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  if (cart.length === 0) return sendMessage(chat_id, "🛒 কার্ট খালি।", { reply_markup: menu(cfg) });
  await updateSubscriber(chat_id, { state: { step: "await_name" } });
  return sendMessage(chat_id, "👤 আপনার পুরো নাম দিন:");
}

async function askPaymentMethod(chat_id: number, cfg: StoreCfg) {
  const methods = cfg.payment_methods && cfg.payment_methods.length ? cfg.payment_methods : ["cod"];
  const rows = methods.map((m) => [{ text: PAYMENT_LABELS[m] || m, callback_data: `pay:${m}` }]);
  return sendMessage(chat_id, "💳 পেমেন্ট মেথড বেছে নিন:", { reply_markup: { inline_keyboard: rows } });
}

async function placeOrder(chat_id: number, state: any, sub: any, cfg: StoreCfg) {
  const cart: CartItem[] = Array.isArray(sub?.cart) ? sub.cart : [];
  const currency = cfg.currency || "৳";
  if (cart.length === 0) {
    await updateSubscriber(chat_id, { state: {} });
    return sendMessage(chat_id, "কার্ট খালি হয়ে গেছে।", { reply_markup: menu(cfg) });
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

  const payMethod: string = state.payment_method || "cod";
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: sub?.user_id ?? null,
      full_name: state.name || sub?.first_name || "Telegram user",
      email: `tg-${chat_id}@telegram.local`,
      phone: state.phone,
      payment_method: payMethod,
      transaction_id: state.transaction_id || `TG-${Date.now()}`,
      items: items as never,
      total,
      admin_note: `[telegram store_bot chat_id=${chat_id}] Address: ${state.address} | Payment: ${payMethod}`,
    } as never)
    .select("id").single();

  if (error || !order) return sendMessage(chat_id, `❌ Order create failed: ${error?.message || "unknown"}`);
  const orderId = (order as any).id as string;
  const short = `ANB-${orderId.slice(0, 8).toUpperCase()}`;
  await updateSubscriber(chat_id, { cart: [], state: {} });

  // Notify order-bot admins
  if (cfg.notify_admin_on_order !== false) {
    try {
      const { notifyTelegram } = await import("./notify.functions");
      await notifyTelegram({
        data: {
          event: "order_created",
          vars: {
            order_id: short,
            time: new Date().toLocaleString("en-GB"),
            customer: state.name || "Telegram user",
            phone: state.phone || "-",
            email: `tg-${chat_id}@telegram.local`,
            items_count: String(items.length),
            items: items.map((i) => `• ${i.name} × ${i.qty} — ${currency}${i.price * i.qty}`).join("\n"),
            subtotal: String(total),
            discount: "0",
            coupon: "-",
            wallet: "0",
            total: String(total),
            payment_method: PAYMENT_LABELS[payMethod] || payMethod,
            sender_number: "-",
            transaction_id: state.transaction_id || "-",
            admin_url: `https://accessnowbd.com/admin/orders?id=${orderId}`,
          },
        },
      });
    } catch { /* ignore */ }
  }

  // Confirm to customer
  const tpl = cfg.order_confirmed_template ||
    `✅ <b>অর্ডার নিশ্চিত হয়েছে!</b>\n\nOrder ID: <code>{{order_id}}</code>\nTotal: {{currency}}{{total}}\nPayment: {{payment_method}}\n\nআমরা শীঘ্রই যোগাযোগ করবো।`;
  const text = renderTemplate(tpl, {
    order_id: short,
    total,
    currency,
    payment_method: PAYMENT_LABELS[payMethod] || payMethod,
    customer: state.name || "-",
  });
  return sendMessage(chat_id, text, { reply_markup: menu(cfg) });
}

/* ---------------- Orders / help ---------------- */

async function showOrders(chat_id: number, user_id: string | null | undefined, cfg: StoreCfg) {
  const db = await admin();
  const currency = cfg.currency || "৳";
  let q = db.from("orders").select("id,total,status,created_at").order("created_at", { ascending: false }).limit(5);
  if (user_id) q = q.eq("user_id", user_id);
  else q = q.ilike("admin_note", `%chat_id=${chat_id}%`);
  const { data } = await q;
  const orders = (data as any[]) || [];
  if (orders.length === 0) return sendMessage(chat_id, "এখনো কোনো অর্ডার নেই।", { reply_markup: menu(cfg) });
  const lines = orders.map((o) => `• <code>ANB-${o.id.slice(0, 8).toUpperCase()}</code> — ${currency}${o.total} — ${o.status || "pending"}`);
  return sendMessage(chat_id, `<b>📦 Recent orders</b>\n\n${lines.join("\n")}`, { reply_markup: menu(cfg) });
}

async function sendHelp(chat_id: number, cfg: StoreCfg) {
  const contact = cfg.contact_link || "https://t.me/accessnowbd";
  const text = [
    "<b>Commands</b>",
    "/browse — প্রোডাক্ট দেখুন",
    "/cart — কার্ট দেখুন",
    "/checkout — অর্ডার করুন",
    "/orders — আপনার অর্ডার",
    "/search &lt;name&gt; — সার্চ",
    "/id — chat id দেখুন",
    "/help — সাহায্য",
    "",
    `💬 <a href="${escapeHtml(contact)}">সাপোর্ট চ্যাট</a>`,
  ].join("\n");
  return sendMessage(chat_id, text, { reply_markup: menu(cfg) });
}

/* ---------------- Callback queries ---------------- */

async function handleCallback(cb: TgCallback) {
  const chat_id = cb.message?.chat.id;
  if (!chat_id) return;
  const data = cb.data || "";
  if (cb.from) await upsertSubscriber(cb.from, chat_id);
  const { cfg } = await loadCfg();

  if (data.startsWith("add:")) {
    await addToCart(chat_id, data.slice(4));
    await answerCallbackQuery(cb.id, "কার্টে যোগ হয়েছে ✅");
    return;
  }
  if (data.startsWith("page:")) {
    await answerCallbackQuery(cb.id);
    return showCatalog(chat_id, Number(data.slice(5)) || 0, cfg);
  }
  if (data === "checkout") {
    await answerCallbackQuery(cb.id);
    return startCheckout(chat_id, cfg);
  }
  if (data === "clear") {
    await updateSubscriber(chat_id, { cart: [] });
    await answerCallbackQuery(cb.id, "কার্ট খালি করা হয়েছে");
    return sendMessage(chat_id, "🗑️ কার্ট খালি।", { reply_markup: menu(cfg) });
  }
  if (data.startsWith("pay:")) {
    const m = data.slice(4);
    await answerCallbackQuery(cb.id, PAYMENT_LABELS[m] || m);
    const sub = await getSubscriber(chat_id);
    const state = (sub?.state as any) || {};
    if (m === "cod") {
      return placeOrder(chat_id, { ...state, payment_method: m }, sub, cfg);
    }
    // bkash / nagad / wallet — ask for transaction id
    await updateSubscriber(chat_id, { state: { ...state, step: "await_txid", payment_method: m } });
    if (m === "wallet") {
      return sendMessage(chat_id, "💰 Wallet payment বেছে নিয়েছেন। কোনো txn id প্রয়োজন নেই — <b>skip</b> লিখুন বা confirm করুন:");
    }
    return sendMessage(chat_id, `📱 <b>${PAYMENT_LABELS[m]}</b> — টাকা পাঠিয়ে transaction ID লিখুন:`);
  }
  await answerCallbackQuery(cb.id);
}

function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

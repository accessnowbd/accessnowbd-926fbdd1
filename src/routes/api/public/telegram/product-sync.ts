// Product sync webhook — called by the products DB trigger.
// Auth: X-Sync-Secret must match process.env.TELEGRAM_SYNC_SECRET.
// Broadcasts product changes to store-bot subscribers who allow promo notifications.

import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

function safeEqStr(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const PROD_ORIGIN = "https://accessnowbd.com";

function lowestPlanPrice(plans: any): number | null {
  if (!Array.isArray(plans)) return null;
  const nums: number[] = [];
  for (const p of plans) {
    const v = Number(p?.price ?? p?.amount ?? p?.sale_price);
    if (Number.isFinite(v) && v > 0) nums.push(v);
  }
  return nums.length ? Math.min(...nums) : null;
}

async function buildMessage(event: string, product: any): Promise<{ text: string; photo?: string; url: string }> {
  const name = product?.name || "Product";
  const url = `${PROD_ORIGIN}/products/${product?.slug || ""}`;
  const tagline = product?.tagline || product?.short_description || "";
  const price = lowestPlanPrice(product?.plans);
  const priceLine = price ? `\n💰 <b>৳${price.toLocaleString()}</b> থেকে শুরু` : "";
  const photo = product?.image_url || product?.og_image || undefined;

  let head = "";
  if (event === "product.created") head = `🆕 <b>New product!</b>`;
  else if (event === "product.price_changed") head = `💰 <b>Price updated</b>`;
  else if (event === "product.updated") head = `✨ <b>Product updated</b>`;
  else if (event === "product.deleted") head = `🗑 <b>Product removed</b>`;
  else head = `📦 <b>Product update</b>`;

  const text = [
    head,
    `<b>${name}</b>`,
    tagline ? `<i>${tagline}</i>` : "",
    priceLine,
  ].filter(Boolean).join("\n");
  return { text, photo, url };
}

async function broadcast(msg: { text: string; photo?: string; url: string }, event: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendMessageFor, sendPhotoFor } = await import("@/lib/telegram/api.server");

  const { data: subs } = await (supabaseAdmin as any)
    .from("telegram_subscribers")
    .select("chat_id")
    .eq("bot_kind", "store_bot")
    .eq("is_blocked", false)
    .not("notify_promos", "is", false);

  const list = ((subs as any[]) || []);
  const reply_markup = event === "product.deleted"
    ? undefined
    : { inline_keyboard: [[{ text: "🛒 View on website", url: msg.url }]] };

  // Parallel batches of 25 — respects Telegram's ~30 msg/sec limit.
  const CHUNK = 25;
  for (let i = 0; i < list.length; i += CHUNK) {
    const slice = list.slice(i, i + CHUNK);
    await Promise.allSettled(slice.map((s) =>
      msg.photo
        ? sendPhotoFor("store_bot", s.chat_id, msg.photo!, msg.text, { reply_markup })
        : sendMessageFor("store_bot", s.chat_id, msg.text, { disable_web_page_preview: false, reply_markup })
    ));
    if (i + CHUNK < list.length) await new Promise((r) => setTimeout(r, 1000));
  }
}

export const Route = createFileRoute("/api/public/telegram/product-sync")({
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
        const { event, slug, name } = payload;
        if (!event) return Response.json({ ok: true });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let product: any = { slug, name };
          if (slug && event !== "product.deleted") {
            const { data } = await (supabaseAdmin as any)
              .from("products").select("*").eq("slug", slug).maybeSingle();
            if (data) product = data;
          }
          const msg = await buildMessage(event, product);
          await broadcast(msg, event);
          return Response.json({ ok: true });
        } catch (e: any) {
          return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
        }
      },
    },
  },
});

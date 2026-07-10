import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

// Public webhook — Telegram POSTs updates for the STORE bot here.
// Customers press /start on the store bot; the order bot is send-only.

function computeSecret(token: string): string {
  return createHash("sha256").update(`tg-webhook:${token}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        const storeToken = process.env.TELEGRAM_STORE_BOT_TOKEN || "";
        const orderToken = process.env.TELEGRAM_BOT_TOKEN || "";

        if (!storeToken && !orderToken) {
          return new Response("bot not configured", { status: 503 });
        }

        // Accept either bot's secret (store bot handles messages; order bot ignored)
        const isStore = storeToken && safeEqual(provided, computeSecret(storeToken));
        const isOrder = orderToken && safeEqual(provided, computeSecret(orderToken));
        if (!isStore && !isOrder) {
          return new Response("unauthorized", { status: 401 });
        }

        let update: any = null;
        try { update = await request.json(); } catch { return Response.json({ ok: true }); }

        if (isStore) {
          try {
            const { handleTelegramUpdate } = await import("@/lib/telegram/router.server");
            await handleTelegramUpdate(update);
          } catch (e) {
            console.error("telegram store webhook error", e);
          }
        }
        return Response.json({ ok: true });
      },
      GET: async () => Response.json({ ok: true, service: "telegram-webhook" }),
    },
  },
});

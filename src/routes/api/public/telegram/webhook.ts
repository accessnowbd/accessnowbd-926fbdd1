import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

// Public webhook — Telegram POSTs updates here. Secured by X-Telegram-Bot-Api-Secret-Token.

function computeSecret(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN || "";
  return createHash("sha256").update(`tg-webhook:${t}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.TELEGRAM_BOT_TOKEN) {
          return new Response("bot not configured", { status: 503 });
        }
        const provided = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!safeEqual(provided, computeSecret())) {
          return new Response("unauthorized", { status: 401 });
        }
        let update: any = null;
        try { update = await request.json(); } catch { return Response.json({ ok: true }); }
        try {
          const { handleTelegramUpdate } = await import("@/lib/telegram/router.server");
          await handleTelegramUpdate(update);
        } catch (e) {
          console.error("telegram webhook error", e);
        }
        // Always 200 so Telegram doesn't retry the same update forever.
        return Response.json({ ok: true });
      },
      GET: async () => Response.json({ ok: true, service: "telegram-webhook" }),
    },
  },
});

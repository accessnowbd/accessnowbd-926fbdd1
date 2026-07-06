import { createServerFn } from "@tanstack/react-start";

// Fire-and-forget notifications from server code (order create, status change, etc).
// Fails silently — never blocks the user's flow.

type NotifyInput = {
  event:
    | "order_created" | "order_paid" | "order_shipped" | "order_completed"
    | "order_cancelled" | "order_refunded" | "abandoned_checkout"
    | "low_stock" | "new_review";
  vars: Record<string, string | number>;
};

export const notifyTelegram = createServerFn({ method: "POST" })
  .inputValidator((data: NotifyInput) => data)
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: row } = await supabaseAdmin
        .from("telegram_settings")
        .select("enabled, config")
        .eq("kind", "order_bot")
        .maybeSingle();

      if (!row?.enabled) return { ok: false, reason: "disabled" };
      const cfg: any = row.config || {};
      if (cfg.events && cfg.events[data.event] === false) return { ok: false, reason: "event_off" };

      const template: string = cfg.templates?.[data.event]
        || `Event: ${data.event} — ${JSON.stringify(data.vars)}`;

      const chatIds: (number | string)[] = Array.isArray(cfg.admin_chat_ids) ? cfg.admin_chat_ids : [];
      if (chatIds.length === 0) return { ok: false, reason: "no_chats" };

      const { sendMessage, renderTemplate } = await import("./api.server");
      const text = renderTemplate(template, data.vars);

      const results = await Promise.allSettled(chatIds.map((id) => sendMessage(id, text)));
      const logRows = results.map((r, i) => ({
        event: data.event,
        chat_id: typeof chatIds[i] === "number" ? (chatIds[i] as number) : Number(chatIds[i]),
        payload: data.vars as never,
        status: r.status === "fulfilled" ? "sent" : "failed",
        error: r.status === "rejected" ? String((r as PromiseRejectedResult).reason).slice(0, 500) : null,
      }));
      await supabaseAdmin.from("telegram_notifications_log").insert(logRows as never);

      return { ok: true, sent: results.filter((r) => r.status === "fulfilled").length };
    } catch (e: any) {
      return { ok: false, error: e?.message || "unknown" };
    }
  });

// Test send from admin panel: sends "hello" to the given chat_id.
export const sendTelegramTest = createServerFn({ method: "POST" })
  .inputValidator((data: { chat_id: number | string; text?: string }) => data)
  .handler(async ({ data }) => {
    const { sendMessage } = await import("./api.server");
    await sendMessage(data.chat_id, data.text || "✅ Test message from AccessNow BD admin panel");
    return { ok: true };
  });

// Register webhook with Telegram — called from admin panel "Connect" button.
export const registerTelegramWebhook = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => data)
  .handler(async ({ data }) => {
    const { tg, webhookSecret } = await import("./api.server");
    const result = await tg("setWebhook", {
      url: data.url,
      secret_token: webhookSecret(),
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
    return { ok: true, result };
  });

export const getTelegramWebhookInfo = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const { tg } = await import("./api.server");
      const info = await tg("getWebhookInfo", {});
      const me = await tg("getMe", {});
      return { ok: true, info, me };
    } catch (e: any) {
      return { ok: false, error: e?.message || "unknown" };
    }
  });

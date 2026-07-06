// Telegram Bot API helpers — server only.
// Uses TELEGRAM_BOT_TOKEN directly (from @BotFather). Store via add_secret.

const API_ROOT = "https://api.telegram.org";

export function botToken(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return t;
}

export function webhookSecret(): string {
  // Derived deterministic secret so setWebhook + verify match without a separate secret.
  return process.env.TELEGRAM_WEBHOOK_SECRET
    || require("crypto").createHash("sha256").update(`tg-webhook:${botToken()}`).digest("base64url");
}

type Json = Record<string, unknown>;

export async function tg<T = Json>(method: string, body: Json): Promise<T> {
  const url = `${API_ROOT}/bot${botToken()}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j?.ok === false) {
    throw new Error(`telegram ${method}: ${j?.description || res.status}`);
  }
  return j.result as T;
}

export const sendMessage = (chat_id: number | string, text: string, extra: Json = {}) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

export const sendPhoto = (chat_id: number | string, photo: string, caption?: string, extra: Json = {}) =>
  tg("sendPhoto", { chat_id, photo, caption, parse_mode: "HTML", ...extra });

export const answerCallbackQuery = (callback_query_id: string, text?: string) =>
  tg("answerCallbackQuery", { callback_query_id, text }).catch(() => null);

export const editMessageText = (chat_id: number | string, message_id: number, text: string, extra: Json = {}) =>
  tg("editMessageText", { chat_id, message_id, text, parse_mode: "HTML", ...extra }).catch(() => null);

export function renderTemplate(tpl: string, vars: Record<string, string | number>): string {
  // Templates use %0A for newlines (URL-encoded) — decode first.
  return tpl
    .replace(/%0A/g, "\n")
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ""));
}

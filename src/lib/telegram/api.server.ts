// Telegram Bot API helpers — server only. Supports two bots:
//   • order_bot  → TELEGRAM_BOT_TOKEN (admin notifications / admin bot)
//   • store_bot  → TELEGRAM_STORE_BOT_TOKEN (customer-facing storefront)

import { createHash } from "crypto";

const API_ROOT = "https://api.telegram.org";

export type BotKind = "order_bot" | "store_bot";

export function tokenFor(kind: BotKind): string {
  const t = kind === "store_bot" ? process.env.TELEGRAM_STORE_BOT_TOKEN : process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error(`${kind === "store_bot" ? "TELEGRAM_STORE_BOT_TOKEN" : "TELEGRAM_BOT_TOKEN"} is not configured`);
  return t;
}

export function webhookSecretFor(kind: BotKind): string {
  return createHash("sha256").update(`tg-webhook:${tokenFor(kind)}`).digest("base64url");
}

// --- back-compat helpers (order bot) ---
export function botToken(): string { return tokenFor("order_bot"); }
export function webhookSecret(): string { return webhookSecretFor("order_bot"); }

type Json = Record<string, unknown>;

// Errors from Telegram that are permanent for a given chat — don't retry, mark blocked.
const PERMANENT_CHAT_ERRORS = [
  "bot was blocked by the user",
  "user is deactivated",
  "chat not found",
  "bot was kicked",
  "chat_write_forbidden",
  "have no rights to send",
  "peer_id_invalid",
];

function isPermanentChatError(desc: string): boolean {
  const d = (desc || "").toLowerCase();
  return PERMANENT_CHAT_ERRORS.some((s) => d.includes(s));
}

async function markChatBlocked(chat_id: number | string | undefined) {
  if (chat_id === undefined || chat_id === null) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("telegram_subscribers")
      .update({ is_blocked: true } as never)
      .eq("chat_id", chat_id);
  } catch { /* ignore */ }
}

// Low-level fetch with retries + short-circuit on permanent chat errors.
async function tgCore<T>(kind: BotKind, method: string, body: Json): Promise<T> {
  const url = `${API_ROOT}/bot${tokenFor(kind)}/${method}`;
  let lastErr: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j: any = await res.json().catch(() => ({}));
      if (res.ok && j?.ok !== false) return j.result as T;
      lastErr = j?.description || `http ${res.status}`;
      // Permanent per-chat error → don't retry, mark blocked.
      if (isPermanentChatError(lastErr || "")) {
        await markChatBlocked((body as any).chat_id);
        break;
      }
      // Rate-limited: honor retry_after (capped at 5s to keep webhooks fast).
      const retryAfter = j?.parameters?.retry_after;
      if (res.status === 429 && retryAfter) {
        await new Promise((r) => setTimeout(r, Math.min(retryAfter + 0.2, 5) * 1000));
        continue;
      }
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break; // permanent
    } catch (e: any) {
      lastErr = e?.message || String(e);
    }
    await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
  }
  // Log failure and rethrow
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("telegram_notifications_log").insert({
      event: `${kind}.${method}.error`,
      chat_id: typeof (body as any).chat_id === "number" ? (body as any).chat_id : null,
      payload: body as never,
      status: "failed",
      error: lastErr,
    });
  } catch { /* ignore */ }
  throw new Error(`telegram ${method}: ${lastErr}`);
}

export async function tgFor<T = Json>(kind: BotKind, method: string, body: Json): Promise<T> {
  return tgCore<T>(kind, method, body);
}

export const tg = <T = Json>(method: string, body: Json) => tgFor<T>("order_bot", method, body);

export const sendMessageFor = (kind: BotKind, chat_id: number | string, text: string, extra: Json = {}) =>
  tgFor(kind, "sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

export const sendPhotoFor = (kind: BotKind, chat_id: number | string, photo: string, caption?: string, extra: Json = {}) =>
  tgFor(kind, "sendPhoto", { chat_id, photo, caption, parse_mode: "HTML", ...extra });

export const answerCallbackQueryFor = (kind: BotKind, callback_query_id: string, text?: string) =>
  tgFor(kind, "answerCallbackQuery", { callback_query_id, text }).catch(() => null);

export const editMessageTextFor = (kind: BotKind, chat_id: number, message_id: number, text: string, extra: Json = {}) =>
  tgFor(kind, "editMessageText", { chat_id, message_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra }).catch(() => null);

// Order-bot short forms (used by notify.functions.ts)
export const sendMessage = (chat_id: number | string, text: string, extra: Json = {}) =>
  sendMessageFor("order_bot", chat_id, text, extra);
export const sendPhoto = (chat_id: number | string, photo: string, caption?: string, extra: Json = {}) =>
  sendPhotoFor("order_bot", chat_id, photo, caption, extra);
export const answerCallbackQuery = (callback_query_id: string, text?: string) =>
  answerCallbackQueryFor("order_bot", callback_query_id, text);

export function renderTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl
    .replace(/%0A/g, "\n")
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ""));
}

// Log a successful send (opt-in — routers call this)
export async function logNotification(event: string, chat_id: number | null, payload: Json, status: "sent" | "failed", error?: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("telegram_notifications_log").insert({
      event, chat_id, payload: payload as never, status, error: error ?? null,
    });
  } catch { /* ignore */ }
}

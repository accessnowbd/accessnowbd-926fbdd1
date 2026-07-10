// Telegram Bot API helpers — server only. Supports two bots:
//   • order_bot  → TELEGRAM_BOT_TOKEN (admin notifications)
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

export async function tgFor<T = Json>(kind: BotKind, method: string, body: Json): Promise<T> {
  const url = `${API_ROOT}/bot${tokenFor(kind)}/${method}`;
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

export const tg = <T = Json>(method: string, body: Json) => tgFor<T>("order_bot", method, body);

export const sendMessageFor = (kind: BotKind, chat_id: number | string, text: string, extra: Json = {}) =>
  tgFor(kind, "sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra });

export const sendPhotoFor = (kind: BotKind, chat_id: number | string, photo: string, caption?: string, extra: Json = {}) =>
  tgFor(kind, "sendPhoto", { chat_id, photo, caption, parse_mode: "HTML", ...extra });

export const answerCallbackQueryFor = (kind: BotKind, callback_query_id: string, text?: string) =>
  tgFor(kind, "answerCallbackQuery", { callback_query_id, text }).catch(() => null);

// Order-bot short forms (used by notify.functions.ts)
export const sendMessage = (chat_id: number | string, text: string, extra: Json = {}) =>
  sendMessageFor("order_bot", chat_id, text, extra);
export const sendPhoto = (chat_id: number | string, photo: string, caption?: string, extra: Json = {}) =>
  sendPhotoFor("order_bot", chat_id, photo, caption, extra);
export const answerCallbackQuery = (callback_query_id: string, text?: string) =>
  answerCallbackQueryFor("order_bot", callback_query_id, text);

export function renderTemplate(tpl: string, vars: Record<string, string | number>): string {
  // Templates use %0A for newlines (URL-encoded) — decode first.
  return tpl
    .replace(/%0A/g, "\n")
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(vars[k] ?? ""));
}

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

/**
 * Bot / abuse protection for account creation.
 *
 * Layer 1 (always on, no keys needed): honeypot field + submit-timing check +
 *   per-IP signup attempt throttling.
 * Layer 2 (optional): Cloudflare Turnstile CAPTCHA — active as soon as
 *   TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY secrets exist.
 */

const MIN_FILL_MS = 1500; // humans need at least this long to fill the form
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6; // per IP per window

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientIp(): string {
  try {
    const h = getRequest()?.headers;
    return (
      h?.get("cf-connecting-ip") ||
      h?.get("x-real-ip") ||
      h?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

function throttle(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  b.count += 1;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }
  return b.count <= MAX_ATTEMPTS;
}

/** Public config for the client: whether/how to render the CAPTCHA widget. */
export const getBotGuardConfig = createServerFn({ method: "GET" }).handler(async () => {
  const siteKey = process.env["TURNSTILE_SITE_KEY"] ?? "";
  const secret = process.env["TURNSTILE_SECRET_KEY"] ?? "";
  return { captchaEnabled: Boolean(siteKey && secret), siteKey };
});

export const verifyHuman = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().max(4096).optional(),
        honeypot: z.string().max(200).optional(),
        elapsedMs: z.number().int().min(0).max(86_400_000),
        action: z.string().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const ip = clientIp();

    if (!throttle(ip)) {
      return { ok: false as const, reason: "অনেক বেশি চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।" };
    }
    if (data.honeypot && data.honeypot.trim() !== "") {
      return { ok: false as const, reason: "স্বয়ংক্রিয় সাবমিশন শনাক্ত হয়েছে।" };
    }
    // Sign-in can legitimately be instant (password manager autofill), so the
    // minimum-fill-time heuristic only applies to account creation.
    if (data.action !== "login" && data.elapsedMs < MIN_FILL_MS) {
      return { ok: false as const, reason: "ফর্মটি খুব দ্রুত সাবমিট হয়েছে। আবার চেষ্টা করুন।" };
    }


    const secret = process.env["TURNSTILE_SECRET_KEY"];
    const siteKey = process.env["TURNSTILE_SITE_KEY"];
    if (!secret || !siteKey) return { ok: true as const };

    if (!data.token) {
      return { ok: false as const, reason: "অনুগ্রহ করে ভেরিফিকেশন সম্পন্ন করুন।" };
    }

    try {
      const body = new URLSearchParams({ secret, response: data.token });
      if (ip !== "unknown") body.set("remoteip", ip);
      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
      if (!json.success) {
        console.warn("[bot-guard] turnstile failed", json["error-codes"]);
        return { ok: false as const, reason: "ভেরিফিকেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।" };
      }
      return { ok: true as const };
    } catch (e) {
      console.error("[bot-guard] turnstile error", e);
      return { ok: false as const, reason: "ভেরিফিকেশন সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
    }
  });

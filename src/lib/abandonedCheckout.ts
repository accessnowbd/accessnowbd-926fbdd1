import { supabase } from "@/integrations/supabase/client";

type AbandonedItem = {
  slug?: string;
  name?: string;
  planPeriod?: string;
  qty?: number;
  price?: number;
  emoji?: string;
  gradient?: string;
};

type CaptureInput = {
  items: AbandonedItem[];
  subtotal?: number;
  total?: number;
  couponCode?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  source: string;
  stage: "intent" | "product_view" | "cart" | "contact" | "payment";
  metadata?: Record<string, unknown>;
  userId?: string | null;
};

const SESSION_KEY = "accessnow_abandoned_checkout_session";
const QUEUE_KEY = "accessnow_abandoned_checkout_queue";
const MAX_QUEUE = 12;

const cleanEmail = (value?: string | null) => {
  const v = (value ?? "").trim().toLowerCase();
  return v.includes("@") ? v : null;
};

const cleanPhone = (value?: string | null) => (value ?? "").replace(/[\s-]/g, "").trim();

const getGuestSessionKey = () => {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = `guest-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

type CapturePayload = {
  _session_key: string;
  _user_id: string | null;
  _full_name: string;
  _email: string | null;
  _phone: string;
  _items: AbandonedItem[];
  _subtotal: number;
  _total: number;
  _coupon_code: string | null;
  _source: string;
  _stage: CaptureInput["stage"];
  _page_url: string;
  _metadata: Record<string, unknown>;
};

const readQueue = (): CapturePayload[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_QUEUE) : [];
  } catch {
    return [];
  }
};

const writeQueue = (items: CapturePayload[]) => {
  if (typeof window === "undefined") return;
  try {
    if (!items.length) {
      window.localStorage.removeItem(QUEUE_KEY);
      return;
    }
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
  } catch {
    // ignore storage failures; live capture still runs
  }
};

const queuePayload = (payload: CapturePayload) => {
  const queue = readQueue().filter((item) => item._session_key !== payload._session_key);
  queue.push(payload);
  writeQueue(queue);
};

async function sendCapture(payload: CapturePayload) {
  const { error } = await supabase.rpc("capture_abandoned_checkout" as never, payload as never);
  if (error) throw new Error(error.message);
}

export async function flushAbandonedCheckoutQueue() {
  if (typeof window === "undefined") return;
  const queue = readQueue();
  if (!queue.length) return;
  const remaining: CapturePayload[] = [];
  for (const payload of queue) {
    try {
      await sendCapture(payload);
    } catch {
      remaining.push(payload);
    }
  }
  writeQueue(remaining);
}

export async function captureAbandonedCheckout(input: CaptureInput) {
  if (typeof window === "undefined" || !input.items?.length) return;

  let userId = input.userId;
  if (userId === undefined) {
    const { data } = await supabase.auth.getSession();
    userId = data.session?.user.id ?? null;
  }

  const sessionKey = userId ? `user-${userId}` : getGuestSessionKey();
  const items = input.items.map((it) => ({
    slug: it.slug,
    name: it.name || it.slug || "Selected product",
    planPeriod: it.planPeriod || "",
    qty: Math.max(1, Number(it.qty ?? 1) || 1),
    price: Number(it.price ?? 0) || 0,
    emoji: it.emoji || "🛒",
    gradient: it.gradient,
  }));
  const subtotal = Number(input.subtotal ?? items.reduce((sum, it) => sum + it.price * it.qty, 0)) || 0;
  const total = Number(input.total ?? subtotal) || 0;
  const now = new Date().toISOString();
  const payload: CapturePayload = {
    _session_key: sessionKey,
    _user_id: userId ?? null,
    _full_name: (input.fullName ?? "").trim(),
    _email: cleanEmail(input.email),
    _phone: cleanPhone(input.phone),
    _items: items,
    _subtotal: subtotal,
    _total: total,
    _coupon_code: input.couponCode || null,
    _source: input.source,
    _stage: input.stage,
    _page_url: window.location.href,
    _metadata: { capturedAt: now, ...(input.metadata ?? {}) },
  };

  queuePayload(payload);
  try {
    await sendCapture(payload);
    writeQueue(readQueue().filter((item) => item._session_key !== payload._session_key));
  } catch (error) {
    if (typeof console !== "undefined") {
      console.warn(
        "abandoned checkout capture failed",
        error instanceof Error ? error.message : "unknown error",
      );
    }
  }
}
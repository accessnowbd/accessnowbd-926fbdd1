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

export async function captureAbandonedCheckout(input: CaptureInput) {
  if (typeof window === "undefined" || !input.items?.length) return;

  let userId = input.userId;
  if (userId === undefined) {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
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
  const payload = {
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

  const { error } = await supabase.rpc("capture_abandoned_checkout" as never, payload as never);
  if (error && typeof console !== "undefined") {
    console.warn("abandoned checkout capture failed", error.message);
  }
}
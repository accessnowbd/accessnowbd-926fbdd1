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
    session_key: sessionKey,
    user_id: userId ?? null,
    full_name: (input.fullName ?? "").trim(),
    email: cleanEmail(input.email),
    phone: cleanPhone(input.phone),
    items,
    subtotal,
    total,
    coupon_code: input.couponCode || null,
    status: "pending",
    source: input.source,
    stage: input.stage,
    page_url: window.location.href,
    last_seen_at: now,
    metadata: input.metadata ?? {},
  };

  const table = supabase.from("abandoned_checkouts" as never) as unknown as {
    insert: (p: unknown) => Promise<{ error: { code?: string; message: string } | null }>;
    update: (p: unknown) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };

  const inserted = await table.insert(payload);
  if (!inserted.error) return;

  if (inserted.error.code === "23505") {
    const bySession = await table.update(payload).eq("session_key", sessionKey);
    if (!bySession.error) return;

    const email = payload.email;
    if (email) {
      const byEmail = await table.update(payload).eq("email", email);
      if (!byEmail.error) return;
    }
  }

  if (typeof console !== "undefined") {
    console.warn("abandoned checkout capture failed", inserted.error.message);
  }
}
/**
 * Visitor identification and client session state for Lucky Coupon System.
 * Works across page reloads and browser sessions.
 */

const STORAGE_VISITOR_ID_KEY = "accessnow_lucky_visitor_id";
const STORAGE_DISMISSED_KEY = "accessnow_lucky_modal_dismissed";
const STORAGE_WON_COUPON_KEY = "accessnow_lucky_won_coupon_v2";

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "ssr_visitor";

  try {
    let id = localStorage.getItem(STORAGE_VISITOR_ID_KEY);
    if (!id || id.length < 8) {
      id = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(STORAGE_VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `vid_${Date.now()}`;
  }
}

export function hasDismissedLuckyModal(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markLuckyModalDismissed(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_DISMISSED_KEY, "true");
  } catch {
    // Ignore
  }
}

export type LocalWonCoupon = {
  code: string;
  label: string;
  discount_value: number;
  discount_type: "percent" | "flat";
  min_order_amount: number;
  max_discount: number;
  expires_at: string;
  tier: string;
  claimed_at: string;
};

export function getLocalWonCoupon(): LocalWonCoupon | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_WON_COUPON_KEY);
    if (!raw) return null;
    const item = JSON.parse(raw) as LocalWonCoupon;
    if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) {
      return null;
    }
    return item;
  } catch {
    return null;
  }
}

export function saveLocalWonCoupon(coupon: LocalWonCoupon): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_WON_COUPON_KEY, JSON.stringify(coupon));
  } catch {
    // Ignore
  }
}

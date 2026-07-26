/** Client-side store of guest order tokens (orders placed without an account). */
const KEY = "guest:orders";

export type GuestOrderRef = { id: string; token: string };

export function loadGuestOrders(): GuestOrderRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as GuestOrderRef[]) : [];
  } catch {
    return [];
  }
}

export function rememberGuestOrder(id: string, token: string) {
  if (typeof window === "undefined") return;
  try {
    const next = [{ id, token }, ...loadGuestOrders().filter((o) => o.id !== id)].slice(0, 20);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function forgetGuestOrder(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(loadGuestOrders().filter((o) => o.id !== id)));
  } catch {
    /* ignore */
  }
}

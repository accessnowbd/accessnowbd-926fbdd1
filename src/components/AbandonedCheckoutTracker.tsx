import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { captureAbandonedCheckout, flushAbandonedCheckoutQueue } from "@/lib/abandonedCheckout";

const actionWords = /buy|cart|checkout|order|payment|কিনুন|কার্ট|অর্ডার|চেকআউট|পেমেন্ট/i;

function cleanLabel(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function slugToName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AbandonedCheckoutTracker() {
  const { items, total, ready } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") return;
    flushAbandonedCheckoutQueue();
    const onOnline = () => flushAbandonedCheckoutQueue();
    const onVisible = () => {
      if (document.visibilityState === "visible") flushAbandonedCheckoutQueue();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin")) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target?.closest("a,button,[role='button']");
      if (!trigger) return;

      const anchor = trigger.closest("a") as HTMLAnchorElement | null;
      const href = anchor?.getAttribute("href") ?? "";
      const productMatch = href.match(/\/product\/([^/?#]+)/);
      const label = cleanLabel(trigger.textContent || anchor?.ariaLabel || target?.getAttribute("aria-label"));

      if (productMatch) {
        const slug = decodeURIComponent(productMatch[1]);
        captureAbandonedCheckout({
          items: [{ slug, name: label || slugToName(slug), qty: 1, price: 0, emoji: "🛒" }],
          source: "site_product_click",
          stage: "intent",
          metadata: { clickedText: label, href, event: "pointerdown" },
        });
        return;
      }

      if (items.length && actionWords.test(`${label} ${href}`)) {
        captureAbandonedCheckout({
          items,
          subtotal: total,
          total,
          source: "site_action_click",
          stage: href.includes("checkout") || /checkout|চেকআউট/i.test(label) ? "payment" : "cart",
          metadata: { clickedText: label, href, event: "pointerdown" },
        });
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [items, total]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ready || !items.length || window.location.pathname.startsWith("/admin")) return;
    const handle = window.setTimeout(() => {
      captureAbandonedCheckout({
        items,
        subtotal: total,
        total,
        source: "cart_state",
        stage: "cart",
        metadata: { itemCount: items.reduce((sum, item) => sum + item.qty, 0) },
      });
    }, 500);
    return () => window.clearTimeout(handle);
  }, [items, ready, total]);

  return null;
}
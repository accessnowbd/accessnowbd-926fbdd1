import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products } from "@/data/products";

export type CartItem = {
  slug: string;
  planPeriod: string;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (slug: string, planPeriod: string) => void;
  setQty: (slug: string, planPeriod: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "accessnow_cart_v1";

const parsePrice = (p: string) => Number(p.replace(/[^\d]/g, "")) || 0;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const total = items.reduce((sum, it) => {
      const product = products.find((p) => p.slug === it.slug);
      const plan = product?.plans.find((pl) => pl.period === it.planPeriod);
      return sum + (plan ? parsePrice(plan.price) * it.qty : 0);
    }, 0);

    return {
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      total,
      add: (item) =>
        setItems((cur) => {
          const idx = cur.findIndex((c) => c.slug === item.slug && c.planPeriod === item.planPeriod);
          if (idx >= 0) {
            const next = [...cur];
            next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
            return next;
          }
          return [...cur, item];
        }),
      remove: (slug, planPeriod) => setItems((cur) => cur.filter((c) => !(c.slug === slug && c.planPeriod === planPeriod))),
      setQty: (slug, planPeriod, qty) =>
        setItems((cur) =>
          cur.map((c) => (c.slug === slug && c.planPeriod === planPeriod ? { ...c, qty: Math.max(1, qty) } : c)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

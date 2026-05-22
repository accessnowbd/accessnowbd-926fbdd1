import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Coupon = {
  id: string;
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  min_subtotal: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

export type AppliedCoupon = {
  code: string;
  valid: boolean;
  discount: number;
  label: string;
  reason?: string;
};

/** Validate a code against a loaded list of coupons & compute discount. */
export function applyCouponWith(
  list: Coupon[],
  code: string | undefined,
  subtotal: number,
): AppliedCoupon {
  if (!code) return { code: "", valid: false, discount: 0, label: "" };
  const normalized = code.trim().toUpperCase();
  const c = list.find((x) => x.code === normalized);
  if (!c) return { code: normalized, valid: false, discount: 0, label: "", reason: "Invalid code" };

  const now = Date.now();
  if (!c.is_active) return { code: c.code, valid: false, discount: 0, label: c.description, reason: "Inactive" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now)
    return { code: c.code, valid: false, discount: 0, label: c.description, reason: "Not started yet" };
  if (c.ends_at && new Date(c.ends_at).getTime() < now)
    return { code: c.code, valid: false, discount: 0, label: c.description, reason: "Expired" };
  if (c.usage_limit != null && c.used_count >= c.usage_limit)
    return { code: c.code, valid: false, discount: 0, label: c.description, reason: "Usage limit reached" };
  if (subtotal < (c.min_subtotal ?? 0))
    return {
      code: c.code, valid: false, discount: 0, label: c.description,
      reason: `Minimum order ৳${c.min_subtotal}`,
    };

  let discount =
    c.type === "percent"
      ? Math.round((subtotal * Number(c.value)) / 100)
      : Math.min(Number(c.value), subtotal);
  if (c.max_discount != null) discount = Math.min(discount, Number(c.max_discount));
  discount = Math.min(discount, subtotal);

  return { code: c.code, valid: true, discount, label: c.description || c.code };
}

/** Hook: load all active coupons from the DB. */
export function useActiveCoupons() {
  const [list, setList] = useState<Coupon[]>([]);
  useEffect(() => {
    let mounted = true;
    supabase
      .from("coupons")
      .select("id, code, description, type, value, min_subtotal, max_discount, usage_limit, used_count, starts_at, ends_at, is_active")
      .eq("is_active", true)
      .then(({ data }) => {
        if (!mounted) return;
        setList((data ?? []) as Coupon[]);
      });
    return () => { mounted = false; };
  }, []);
  return list;
}

/** Increment used_count for a successfully redeemed coupon. */
export async function redeemCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  const { data } = await supabase
    .from("coupons")
    .select("id, used_count")
    .eq("code", normalized)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("coupons")
    .update({ used_count: (data.used_count ?? 0) + 1 })
    .eq("id", data.id);
}

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppliedCoupon = {
  code: string;
  valid: boolean;
  discount: number;
  label: string;
  reason?: string;
};

const EMPTY: AppliedCoupon = { code: "", valid: false, discount: 0, label: "" };

/** Validate a single code server-side without exposing the coupon catalogue. */
export async function validateCoupon(
  code: string | undefined,
  subtotal: number,
): Promise<AppliedCoupon> {
  if (!code || !code.trim()) return EMPTY;
  const normalized = code.trim().toUpperCase();

  try {
    const { data, error } = await supabase.rpc(
      "validate_coupon" as never,
      { _code: normalized, _subtotal: subtotal } as never,
    );

    if (!error && data) {
      const row = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : (data as Record<string, unknown>);
      if (row && row.valid !== undefined) {
        return {
          code: String(row.code ?? normalized),
          valid: Boolean(row.valid),
          discount: Number(row.discount ?? 0),
          label: String(row.label ?? ""),
          reason: (row.reason as string | null) ?? undefined,
        };
      }
    }
  } catch {
    // Proceed to server fallback
  }

  // Resilient fallback using server function
  try {
    const { validateCouponServer } = await import("./lucky-coupon.functions");
    const result = await validateCouponServer({ data: { code: normalized, subtotal } });
    return {
      code: result.code,
      valid: result.valid,
      discount: result.discount,
      label: result.label,
      reason: result.reason,
    };
  } catch {
    return { code: normalized, valid: false, discount: 0, label: "", reason: "Invalid code" };
  }
}

/** Hook: debounced server-side coupon validation. */
export function useAppliedCoupon(code: string | undefined, subtotal: number): AppliedCoupon {
  const [applied, setApplied] = useState<AppliedCoupon>(EMPTY);
  const seq = useRef(0);
  useEffect(() => {
    if (!code || !code.trim()) {
      setApplied(EMPTY);
      return;
    }
    const my = ++seq.current;
    const t = setTimeout(async () => {
      const result = await validateCoupon(code, subtotal);
      if (seq.current === my) setApplied(result);
    }, 300);
    return () => clearTimeout(t);
  }, [code, subtotal]);
  return applied;
}

/** Increment used_count for a successfully redeemed coupon via secure RPC. */
export async function redeemCoupon(code: string) {
  const normalized = code.trim().toUpperCase();
  await supabase.rpc("redeem_coupon" as never, { _code: normalized } as never);
}

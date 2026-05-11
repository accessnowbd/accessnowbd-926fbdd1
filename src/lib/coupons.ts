// Simple coupon registry. Extend as needed.
type Coupon =
  | { code: string; type: "percent"; value: number; label: string }
  | { code: string; type: "flat"; value: number; label: string };

const COUPONS: Coupon[] = [
  { code: "SAVE10", type: "percent", value: 10, label: "10% off" },
  { code: "SAVE100", type: "flat", value: 100, label: "৳100 off" },
  { code: "WELCOME50", type: "flat", value: 50, label: "৳50 off" },
];

export function applyCoupon(code: string | undefined, subtotal: number) {
  if (!code) return { code: "", valid: false, discount: 0, label: "" };
  const c = COUPONS.find((x) => x.code === code.trim().toUpperCase());
  if (!c) return { code: code.toUpperCase(), valid: false, discount: 0, label: "" };
  const discount =
    c.type === "percent"
      ? Math.round((subtotal * c.value) / 100)
      : Math.min(c.value, subtotal);
  return { code: c.code, valid: true, discount, label: c.label };
}

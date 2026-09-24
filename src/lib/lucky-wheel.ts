import { supabase } from "@/integrations/supabase/client";

export type SpinWheelSlice = {
  id: string;
  label: string; // e.g., "10% OFF"
  coupon_code: string; // e.g., "LUCKY10"
  discount_type: "percent" | "flat";
  discount_value: number; // e.g., 10
  min_order_amount: number; // e.g., 0
  weight: number; // Probability weight out of total sum
  color: string; // Background color for slice
  text_color: string; // Text color on slice
  is_active: boolean;
};

export type LuckyWheelConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  button_text: string;
  delay_seconds: number;
  show_to: "new_visitors" | "all_visitors";
  show_once_per: "once_ever" | "session" | "24h";
  expiry_hours: number;
  celebration_title: string;
  celebration_message: string;
  slices: SpinWheelSlice[];
  stats: {
    views: number;
    spins: number;
    claims: number;
    used: number;
  };
  version: number;
};

export type WonCouponRecord = {
  id: string;
  slice_id: string;
  label: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  min_order_amount: number;
  won_at: string; // ISO string
  expires_at: string; // ISO string
  is_used: boolean;
};

/**
 * Default slices configured precisely according to the user's specifications:
 * - Total base weight pool: 1,000
 * - 30% JACKPOT: 1 in 1000 = 0.1% chance (weight: 1)
 * - 20% & 25%: 9 in 1000 = ~0.9% chance (together with 30%, exactly 10 in 1000 = 1 in 100)
 * - 15% OFF: 140 in 1000 = 14% chance
 * - 10% OFF: 650 in 1000 = 65% chance (Majority)
 * - 5% OFF: 200 in 1000 = 20% chance
 */
export const DEFAULT_LUCKY_WHEEL_CONFIG: LuckyWheelConfig = {
  enabled: true,
  title: "🎉 লাকি স্পিন ও জিতুন বিশেষ ডিসকাউন্ট!",
  subtitle: "চাকা ঘুরিয়ে জিতে নিন সর্বোচ্চ ৩০% পর্যন্ত এক্সক্লুসিভ ডিসকাউন্ট কুপন।",
  button_text: "স্পিন করুন",
  delay_seconds: 3,
  show_to: "new_visitors",
  show_once_per: "24h",
  expiry_hours: 24,
  celebration_title: "🎉 অভিনন্দন! আপনি জিতেছেন!",
  celebration_message: "আপনার স্পেশাল ডিসকাউন্ট কুপন কোড নিচে দেওয়া হলো। এখনই কেনাকাটায় ব্যবহার করুন!",
  stats: {
    views: 0,
    spins: 0,
    claims: 0,
    used: 0,
  },
  version: 1,
  slices: [
    {
      id: "slice-1",
      label: "10% OFF",
      coupon_code: "LUCKY10",
      discount_type: "percent",
      discount_value: 10,
      min_order_amount: 0,
      weight: 650, // 65% - majority
      color: "#6366F1",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-2",
      label: "5% OFF",
      coupon_code: "LUCKY5",
      discount_type: "percent",
      discount_value: 5,
      min_order_amount: 0,
      weight: 200, // 20%
      color: "#3B82F6",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-3",
      label: "15% OFF",
      coupon_code: "LUCKY15",
      discount_type: "percent",
      discount_value: 15,
      min_order_amount: 0,
      weight: 140, // 14%
      color: "#10B981",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-4",
      label: "20% OFF",
      coupon_code: "LUCKY20",
      discount_type: "percent",
      discount_value: 20,
      min_order_amount: 0,
      weight: 6, // 0.6% (1 in 166)
      color: "#F59E0B",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-5",
      label: "25% OFF",
      coupon_code: "LUCKY25",
      discount_type: "percent",
      discount_value: 25,
      min_order_amount: 0,
      weight: 3, // 0.3% (1 in 333)
      color: "#EC4899",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-6",
      label: "30% JACKPOT",
      coupon_code: "LUCKY30",
      discount_type: "percent",
      discount_value: 30,
      min_order_amount: 0,
      weight: 1, // 0.1% (1 in 1,000)
      color: "#8B5CF6",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-7",
      label: "10% MEGA",
      coupon_code: "LUCKY10",
      discount_type: "percent",
      discount_value: 10,
      min_order_amount: 0,
      weight: 0, // visual slice that maps to 10%
      color: "#14B8A6",
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "slice-8",
      label: "5% BONUS",
      coupon_code: "LUCKY5",
      discount_type: "percent",
      discount_value: 5,
      min_order_amount: 0,
      weight: 0, // visual slice that maps to 5%
      color: "#F97316",
      text_color: "#FFFFFF",
      is_active: true,
    },
  ],
};

const STORAGE_WON_COUPON_KEY = "accessnow_won_coupon_v1";
const STORAGE_DISMISSED_KEY = "accessnow_lucky_wheel_dismissed";
const STORAGE_VISITOR_VISITED_KEY = "accessnow_has_visited_before";

/**
 * Weighted Random Picker: selects a slice based on configured weights.
 */
export function pickWeightedSlice(slices: SpinWheelSlice[]): { slice: SpinWheelSlice; index: number } {
  const activeSlices = slices.filter((s) => s.is_active);
  if (activeSlices.length === 0) {
    return { slice: slices[0], index: 0 };
  }

  const totalWeight = activeSlices.reduce((acc, s) => acc + Math.max(0, s.weight), 0);
  if (totalWeight <= 0) {
    const randIdx = Math.floor(Math.random() * slices.length);
    return { slice: slices[randIdx], index: randIdx };
  }

  const randomPoint = Math.random() * totalWeight;
  let runningSum = 0;

  for (const slice of activeSlices) {
    runningSum += Math.max(0, slice.weight);
    if (randomPoint <= runningSum) {
      const originalIdx = slices.findIndex((s) => s.id === slice.id);
      return { slice, index: originalIdx >= 0 ? originalIdx : 0 };
    }
  }

  const fallback = activeSlices[0];
  const idx = slices.findIndex((s) => s.id === fallback.id);
  return { slice: fallback, index: idx >= 0 ? idx : 0 };
}

/**
 * LocalStorage Helpers
 */
export function getStoredWonCoupon(): WonCouponRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_WON_COUPON_KEY);
    if (!raw) return null;
    const item = JSON.parse(raw) as WonCouponRecord;
    // Check if expired
    if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) {
      return null;
    }
    return item;
  } catch {
    return null;
  }
}

export function saveWonCoupon(record: WonCouponRecord): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_WON_COUPON_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota
  }
}

export function clearWonCoupon(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_WON_COUPON_KEY);
  } catch {
    // Ignore
  }
}

export function isNewVisitor(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const visited = localStorage.getItem(STORAGE_VISITOR_VISITED_KEY);
    if (!visited) {
      localStorage.setItem(STORAGE_VISITOR_VISITED_KEY, new Date().toISOString());
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function shouldShowLuckyWheel(config: LuckyWheelConfig): boolean {
  if (typeof window === "undefined") return false;
  if (!config.enabled) return false;

  // If already won an active coupon, no need to spin again unless expired
  const activeCoupon = getStoredWonCoupon();
  if (activeCoupon && !activeCoupon.is_used) {
    return false;
  }

  // Check show_to setting
  if (config.show_to === "new_visitors") {
    const hasVisited = localStorage.getItem(STORAGE_VISITOR_VISITED_KEY);
    if (hasVisited) {
      // Not a brand-new visitor
      // However if they haven't seen/spun the wheel yet, we still allow once
      const spun = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (spun) return false;
    }
  }

  // Check frequency
  try {
    if (config.show_once_per === "once_ever") {
      const v = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (v) return false;
    } else if (config.show_once_per === "24h") {
      const v = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (v) {
        const time = new Date(v).getTime();
        if (Date.now() - time < 24 * 60 * 60 * 1000) {
          return false;
        }
      }
    } else if (config.show_once_per === "session") {
      const v = sessionStorage.getItem(STORAGE_DISMISSED_KEY);
      if (v) return false;
    }
  } catch {
    return true;
  }

  return true;
}

export function markLuckyWheelDismissed(frequency: LuckyWheelConfig["show_once_per"]): void {
  if (typeof window === "undefined") return;
  try {
    const now = new Date().toISOString();
    if (frequency === "session") {
      sessionStorage.setItem(STORAGE_DISMISSED_KEY, now);
    } else {
      localStorage.setItem(STORAGE_DISMISSED_KEY, now);
    }
  } catch {
    // Ignore
  }
}

/**
 * Fetch config from Supabase `admin_records` (kind = "lucky_wheel_settings")
 */
export async function fetchLuckyWheelConfig(): Promise<{ config: LuckyWheelConfig; recordId: string | null }> {
  try {
    const { data: rows, error } = await supabase
      .from("admin_records")
      .select("id, data, is_active")
      .eq("kind", "lucky_wheel_settings")
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return { config: DEFAULT_LUCKY_WHEEL_CONFIG, recordId: null };
    }

    const row = rows[0];
    const data = row.data as Partial<LuckyWheelConfig>;
    const merged: LuckyWheelConfig = {
      ...DEFAULT_LUCKY_WHEEL_CONFIG,
      ...data,
      enabled: row.is_active !== false && data.enabled !== false,
      stats: {
        ...DEFAULT_LUCKY_WHEEL_CONFIG.stats,
        ...(data.stats ?? {}),
      },
      slices: Array.isArray(data.slices) && data.slices.length > 0 ? data.slices : DEFAULT_LUCKY_WHEEL_CONFIG.slices,
    };

    return { config: merged, recordId: row.id };
  } catch {
    return { config: DEFAULT_LUCKY_WHEEL_CONFIG, recordId: null };
  }
}

/**
 * Save config to Supabase `admin_records` and sync coupons to `coupons` table
 */
export async function saveLuckyWheelConfig(
  config: LuckyWheelConfig,
  recordId: string | null
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const payload = {
      kind: "lucky_wheel_settings",
      data: config as never,
      is_active: config.enabled,
    };

    let savedId = recordId;
    if (recordId) {
      const { error } = await supabase.from("admin_records").update(payload).eq("id", recordId);
      if (error) return { success: false, error: error.message };
    } else {
      const { data: inserted, error } = await supabase
        .from("admin_records")
        .insert(payload)
        .select("id")
        .single();
      if (error) return { success: false, error: error.message };
      savedId = inserted?.id ?? null;
    }

    // Automatically sync slice coupons to `coupons` table
    await syncCouponsToDatabase(config.slices);

    return { success: true, id: savedId ?? undefined };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Ensure all coupons configured in slices exist in the `coupons` table
 * so that when users apply them at checkout, they work immediately!
 */
export async function syncCouponsToDatabase(slices: SpinWheelSlice[]): Promise<void> {
  try {
    for (const slice of slices) {
      if (!slice.coupon_code || !slice.coupon_code.trim()) continue;
      const code = slice.coupon_code.trim().toUpperCase();

      // Check if coupon already exists
      const { data: existing } = await supabase
        .from("coupons")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      const couponPayload = {
        code,
        description: `Lucky Wheel Promo (${slice.label})`,
        type: slice.discount_type,
        value: Number(slice.discount_value),
        min_subtotal: Number(slice.min_order_amount || 0),
        is_active: slice.is_active,
      };

      if (existing?.id) {
        await supabase.from("coupons").update(couponPayload).eq("id", existing.id);
      } else {
        await supabase.from("coupons").insert(couponPayload);
      }
    }
  } catch (err) {
    console.error("Failed to sync lucky coupons to database:", err);
  }
}

/**
 * Increment stats in database (views, spins, claims)
 */
export async function trackLuckyWheelEvent(event: "view" | "spin" | "claim" | "use"): Promise<void> {
  try {
    const { data: rows } = await supabase
      .from("admin_records")
      .select("id, data")
      .eq("kind", "lucky_wheel_settings")
      .limit(1);

    if (!rows || rows.length === 0) return;
    const row = rows[0];
    const data = (row.data as Partial<LuckyWheelConfig>) || {};
    const stats = {
      views: data.stats?.views ?? 0,
      spins: data.stats?.spins ?? 0,
      claims: data.stats?.claims ?? 0,
      used: data.stats?.used ?? 0,
    };

    if (event === "view") stats.views += 1;
    else if (event === "spin") stats.spins += 1;
    else if (event === "claim") stats.claims += 1;
    else if (event === "use") stats.used += 1;

    await supabase
      .from("admin_records")
      .update({ data: { ...data, stats } as never })
      .eq("id", row.id);
  } catch {
    // Non-blocking tracking
  }
}

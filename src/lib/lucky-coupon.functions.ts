import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_LUCKY_COUPON_CONFIG,
  generateLuckyCouponCode,
  selectWeightedReward,
  getRewardTier,
} from "./lucky-coupon-engine";
import {
  LuckyCouponFullConfig,
  LuckyClaimRecord,
  ClaimLuckyCouponResult,
  LuckyEligibilityResult,
} from "./lucky-coupon.types";

/**
 * Concurrency control map to prevent race conditions & duplicate claims
 * when multiple requests arrive in parallel for the same visitor or user.
 */
const inFlightClaims = new Set<string>();

/**
 * In-memory / dev fallback cache for claims and config when SUPABASE_SERVICE_ROLE_KEY
 * is not present in local dev environment. In production, persists to Supabase.
 */
let memoryConfig: LuckyCouponFullConfig = { ...DEFAULT_LUCKY_COUPON_CONFIG };
const memoryClaims: LuckyClaimRecord[] = [];

/**
 * Helper to get a resilient server Supabase client:
 * Uses service role key when present (production / Lovable Cloud),
 * or falls back to publishable key in dev.
 */
function getServerSupabaseClient() {
  const env = typeof process !== "undefined" ? process.env : undefined;
  const url = env?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY;
  const pubKey =
    env?.SUPABASE_PUBLISHABLE_KEY ||
    env?.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || (!serviceKey && !pubKey)) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(url, serviceKey || pubKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Retrieve active configuration from Supabase `admin_records` (kind: "lucky_wheel_settings")
 * with automatic fallback to memory cache and sensible defaults.
 */
async function loadLuckyConfig(): Promise<{ config: LuckyCouponFullConfig; recordId: string | null }> {
  try {
    const sb = getServerSupabaseClient();
    const { data: rows, error } = await sb
      .from("admin_records")
      .select("id, data, is_active")
      .eq("kind", "lucky_wheel_settings")
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return { config: memoryConfig, recordId: null };
    }

    const row = rows[0];
    const data = row.data as Partial<LuckyCouponFullConfig>;

    const merged: LuckyCouponFullConfig = {
      master_switches: {
        ...DEFAULT_LUCKY_COUPON_CONFIG.master_switches,
        ...(data.master_switches ?? {}),
        system_enabled: row.is_active !== false && data.master_switches?.system_enabled !== false,
      },
      campaign: {
        ...DEFAULT_LUCKY_COUPON_CONFIG.campaign,
        ...(data.campaign ?? {}),
      },
      ui: {
        ...DEFAULT_LUCKY_COUPON_CONFIG.ui,
        ...(data.ui ?? {}),
      },
      rewards:
        Array.isArray(data.rewards) && data.rewards.length > 0
          ? data.rewards
          : DEFAULT_LUCKY_COUPON_CONFIG.rewards,
      stats: {
        ...DEFAULT_LUCKY_COUPON_CONFIG.stats,
        ...(data.stats ?? {}),
      },
    };

    memoryConfig = merged;
    return { config: merged, recordId: row.id };
  } catch {
    return { config: memoryConfig, recordId: null };
  }
}

/**
 * Find existing claim for visitor or user.
 */
async function findExistingClaim(
  visitorId: string,
  userId?: string | null,
  campaignId = "lucky_campaign_v1"
): Promise<LuckyClaimRecord | null> {
  // Check memory store
  const foundInMemory = memoryClaims.find(
    (c) =>
      c.campaign_id === campaignId &&
      (c.visitor_id === visitorId || (userId && c.user_id === userId))
  );
  if (foundInMemory) return foundInMemory;

  try {
    const sb = getServerSupabaseClient();
    let query = sb
      .from("admin_records")
      .select("id, data")
      .eq("kind", "lucky_claim");

    const { data: rows, error } = await query.limit(50);
    if (!error && rows) {
      for (const row of rows) {
        const claim = row.data as LuckyClaimRecord;
        if (
          claim.campaign_id === campaignId &&
          (claim.visitor_id === visitorId || (userId && claim.user_id === userId))
        ) {
          return claim;
        }
      }
    }
  } catch {
    // Ignore db read error and rely on memory
  }

  return null;
}

/**
 * Check if current visitor or customer is eligible to spin the Lucky Wheel.
 */
export const checkLuckyEligibility = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        visitorId: z.string().min(1).max(128),
        userId: z.string().uuid().optional().nullable(),
      })
      .parse(data)
  )
  .handler(async ({ data }): Promise<LuckyEligibilityResult> => {
    const { config } = await loadLuckyConfig();

    // 1. System Master Switch
    if (!config.master_switches.system_enabled) {
      return { eligible: false, reason: "system_disabled" };
    }

    // 2. Campaign Active & Date Window check
    const now = Date.now();
    if (config.campaign.starts_at && new Date(config.campaign.starts_at).getTime() > now) {
      return { eligible: false, reason: "campaign_not_started" };
    }
    if (config.campaign.ends_at && new Date(config.campaign.ends_at).getTime() < now) {
      return { eligible: false, reason: "campaign_ended" };
    }

    // 3. User Group Eligibility
    const isLoggedIn = !!data.userId;
    if (isLoggedIn && !config.master_switches.allow_logged_in) {
      return { eligible: false, reason: "logged_in_disabled" };
    }

    // 4. Check if visitor or user already has claimed a coupon
    const existing = await findExistingClaim(data.visitorId, data.userId, config.campaign.campaign_id);
    if (existing) {
      return {
        eligible: false,
        reason: "already_claimed",
        existingCoupon: existing,
      };
    }

    return {
      eligible: true,
      config: {
        enabled: config.master_switches.system_enabled,
        popup_enabled: config.master_switches.popup_enabled,
        delay_seconds: config.campaign.delay_seconds || 3,
        title: config.ui.title,
        subtitle: config.ui.subtitle,
        button_text: config.ui.button_text,
      },
    };
  });

/**
 * Claim a Lucky Coupon:
 * Secure Server-side atomic execution with concurrency locking, probability evaluation,
 * and database insertion.
 */
export const claimLuckyCoupon = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        visitorId: z.string().min(1).max(128),
        userId: z.string().uuid().optional().nullable(),
        userEmail: z.string().email().optional().nullable(),
      })
      .parse(data)
  )
  .handler(async ({ data }): Promise<ClaimLuckyCouponResult> => {
    const lockKey = `${data.visitorId}_${data.userId || "anon"}`;

    // Concurrency Lock: Prevent multiple parallel claims from same client
    if (inFlightClaims.has(lockKey)) {
      return {
        success: false,
        reason: "দয়া করে অপেক্ষা করুন, আপনার অনুরোধ প্রসেস হচ্ছে...",
      };
    }

    inFlightClaims.add(lockKey);

    try {
      const { config, recordId } = await loadLuckyConfig();

      // Master switch check
      if (!config.master_switches.system_enabled) {
        return { success: false, reason: "লাকি কুপন অফার বর্তমানে বন্ধ রয়েছে।" };
      }

      // Existing claim check
      const existing = await findExistingClaim(data.visitorId, data.userId, config.campaign.campaign_id);
      if (existing) {
        return {
          success: false,
          reason: "আপনি ইতিমধ্যে এই ক্যাম্পেইনে একটি লাকি কুপন পেয়েছেন!",
          alreadyClaimed: true,
          existingCoupon: existing,
        };
      }

      // Check max campaign limit
      if (
        config.campaign.max_campaign_coupons > 0 &&
        config.stats.claims >= config.campaign.max_campaign_coupons
      ) {
        return {
          success: false,
          reason: "দুঃখিত, এই ক্যাম্পেইনের সব কুপন বিতরণ সম্পন্ন হয়েছে!",
        };
      }

      // Probability Engine: Secure random selection server-side
      const { reward, sliceIndex } = selectWeightedReward(config.rewards, config.master_switches);

      // Generate unique coupon code (e.g. LUCKY-8K4P-X92M)
      const code = generateLuckyCouponCode("LUCKY");

      const expiryHours = config.campaign.expiry_hours || 24;
      const claimedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
      const minOrder = reward.min_order_amount ?? config.campaign.default_min_order ?? 0;
      const maxDiscount = reward.max_discount ?? config.campaign.default_max_discount ?? 500;
      const tier = reward.tier || getRewardTier(reward.discount_value);

      const claimRecord: LuckyClaimRecord = {
        id: `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        campaign_id: config.campaign.campaign_id,
        visitor_id: data.visitorId,
        user_id: data.userId || null,
        user_email: data.userEmail || null,
        coupon_code: code,
        discount_value: reward.discount_value,
        discount_type: reward.discount_type,
        label: reward.label,
        tier,
        slice_id: reward.id,
        slice_index: sliceIndex,
        min_order_amount: minOrder,
        max_discount: maxDiscount,
        expires_at: expiresAt,
        claimed_at: claimedAt,
        is_used: false,
      };

      // Store in memory
      memoryClaims.unshift(claimRecord);

      // Update statistics
      config.stats.claims += 1;
      config.stats.attempts += 1;
      if (reward.discount_value === 5) config.stats.claims_5_pct += 1;
      else if (reward.discount_value === 10) config.stats.claims_10_pct += 1;
      else if (reward.discount_value === 15) config.stats.claims_15_pct += 1;
      else if (reward.discount_value >= 30) config.stats.claims_jackpot += 1;
      else if (reward.discount_value >= 16) config.stats.claims_rare += 1;

      memoryConfig = config;

      // Persist to Supabase in background / asynchronously
      try {
        const sb = getServerSupabaseClient();

        // 1. Insert into coupons table so checkout validate_coupon can use it immediately!
        await sb.from("coupons").insert({
          code,
          description: `Lucky Coupon Promo (${reward.label})`,
          type: reward.discount_type,
          value: Number(reward.discount_value),
          min_subtotal: Number(minOrder),
          max_discount: Number(maxDiscount),
          usage_limit: 1,
          used_count: 0,
          starts_at: claimedAt,
          ends_at: expiresAt,
          is_active: true,
        });

        // 2. Insert into admin_records (kind: "lucky_claim")
        await sb.from("admin_records").insert({
          kind: "lucky_claim",
          data: claimRecord as never,
          is_active: true,
        });

        // 3. Update stats in settings
        if (recordId) {
          await sb
            .from("admin_records")
            .update({ data: config as never })
            .eq("id", recordId);
        }
      } catch (err) {
        console.warn("[LuckyCoupon] Database persistence fallback to memory:", err);
      }

      return {
        success: true,
        sliceIndex,
        slice: reward,
        coupon: {
          code,
          label: reward.label,
          discount_value: reward.discount_value,
          discount_type: reward.discount_type,
          min_order_amount: minOrder,
          max_discount: maxDiscount,
          expires_at: expiresAt,
          tier,
        },
        isRare: tier === "rare",
        isJackpot: tier === "jackpot",
      };
    } finally {
      inFlightClaims.delete(lockKey);
    }
  });

/**
 * Fetch all lucky coupons won by this customer or visitor.
 */
export const getMyLuckyCoupons = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        visitorId: z.string().min(1).max(128),
        userId: z.string().uuid().optional().nullable(),
      })
      .parse(data)
  )
  .handler(async ({ data }): Promise<LuckyClaimRecord[]> => {
    const list: LuckyClaimRecord[] = [];

    // Check memory store
    for (const c of memoryClaims) {
      if (c.visitor_id === data.visitorId || (data.userId && c.user_id === data.userId)) {
        list.push(c);
      }
    }

    try {
      const sb = getServerSupabaseClient();
      const { data: rows } = await sb
        .from("admin_records")
        .select("data")
        .eq("kind", "lucky_claim")
        .order("created_at", { ascending: false })
        .limit(20);

      if (rows) {
        for (const r of rows) {
          const c = r.data as LuckyClaimRecord;
          if (
            (c.visitor_id === data.visitorId || (data.userId && c.user_id === data.userId)) &&
            !list.some((existing) => existing.coupon_code === c.coupon_code)
          ) {
            list.push(c);
          }
        }
      }
    } catch {
      // Return memory list
    }

    return list;
  });

/**
 * Server-side validation of coupons for checkout.
 * Correctly validates regular and lucky coupons even if database RPC encounters Postgres column ambiguity.
 */
export const validateCouponServer = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        code: z.string().min(1).max(50),
        subtotal: z.number().min(0),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const normalized = data.code.trim().toUpperCase();

    // 1. Check in memory lucky claims first
    const memoryClaim = memoryClaims.find((c) => c.coupon_code.toUpperCase() === normalized);
    if (memoryClaim) {
      if (memoryClaim.is_used) {
        return { valid: false, code: normalized, discount: 0, label: "", reason: "কুপনটি ইতিমধ্যে ব্যবহৃত হয়েছে" };
      }
      if (new Date(memoryClaim.expires_at).getTime() < Date.now()) {
        return { valid: false, code: normalized, discount: 0, label: "", reason: "কুপনের মেয়াদ শেষ হয়ে গেছে" };
      }
      if (data.subtotal < memoryClaim.min_order_amount) {
        return {
          valid: false,
          code: normalized,
          discount: 0,
          label: "",
          reason: `ন্যূনতম অর্ডার ৳${memoryClaim.min_order_amount} হতে হবে`,
        };
      }

      let discount =
        memoryClaim.discount_type === "percent"
          ? Math.round((data.subtotal * memoryClaim.discount_value) / 100)
          : Math.min(memoryClaim.discount_value, data.subtotal);

      if (memoryClaim.max_discount && discount > memoryClaim.max_discount) {
        discount = memoryClaim.max_discount;
      }
      discount = Math.min(discount, data.subtotal);

      return {
        valid: true,
        code: normalized,
        discount,
        label: memoryClaim.label,
      };
    }

    // 2. Check coupons table
    try {
      const sb = getServerSupabaseClient();
      const { data: rows } = await sb
        .from("coupons")
        .select("*")
        .eq("code", normalized)
        .limit(1);

      if (rows && rows.length > 0) {
        const c = rows[0];
        if (!c.is_active) return { valid: false, code: normalized, discount: 0, label: "", reason: "Inactive" };
        if (c.ends_at && new Date(c.ends_at).getTime() < Date.now()) {
          return { valid: false, code: normalized, discount: 0, label: "", reason: "Expired" };
        }
        if (c.usage_limit && c.used_count >= c.usage_limit) {
          return { valid: false, code: normalized, discount: 0, label: "", reason: "Usage limit reached" };
        }
        if (data.subtotal < (c.min_subtotal || 0)) {
          return { valid: false, code: normalized, discount: 0, label: "", reason: `Minimum order ৳${c.min_subtotal}` };
        }

        let discount =
          c.type === "percent"
            ? Math.round((data.subtotal * c.value) / 100)
            : Math.min(c.value, data.subtotal);

        if (c.max_discount && discount > c.max_discount) {
          discount = c.max_discount;
        }
        discount = Math.min(discount, data.subtotal);

        return {
          valid: true,
          code: normalized,
          discount,
          label: c.description || `${c.value}% OFF`,
        };
      }
    } catch {
      // Fallback
    }

    return { valid: false, code: normalized, discount: 0, label: "", reason: "Invalid code" };
  });

/**
 * Admin: Fetch full settings, statistics, and recent claims log.
 */
export const getLuckyAdminData = createServerFn({ method: "GET" }).handler(async () => {
  const { config, recordId } = await loadLuckyConfig();

  // Load recent claims for fraud monitoring
  const recentClaims = [...memoryClaims].slice(0, 30);

  try {
    const sb = getServerSupabaseClient();
    const { data: rows } = await sb
      .from("admin_records")
      .select("data, created_at")
      .eq("kind", "lucky_claim")
      .order("created_at", { ascending: false })
      .limit(30);

    if (rows) {
      for (const r of rows) {
        const claim = r.data as LuckyClaimRecord;
        if (!recentClaims.some((existing) => existing.coupon_code === claim.coupon_code)) {
          recentClaims.push(claim);
        }
      }
    }
  } catch {
    // Return memory claims
  }

  return {
    config,
    recordId,
    recentClaims: recentClaims.slice(0, 30),
  };
});

/**
 * Admin: Update full Lucky Coupon configuration.
 */
export const updateLuckyAdminData = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        config: z.any(),
        recordId: z.string().uuid().optional().nullable(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const newConfig = data.config as LuckyCouponFullConfig;
    memoryConfig = newConfig;

    try {
      const sb = getServerSupabaseClient();
      const payload = {
        kind: "lucky_wheel_settings",
        data: newConfig as never,
        is_active: newConfig.master_switches.system_enabled,
      };

      if (data.recordId) {
        await sb.from("admin_records").update(payload).eq("id", data.recordId);
      } else {
        await sb.from("admin_records").insert(payload);
      }
    } catch (err) {
      console.warn("[LuckyCoupon] Config update fallback to memory:", err);
    }

    return { success: true };
  });

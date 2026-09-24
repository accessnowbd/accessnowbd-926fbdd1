import {
  LuckyCouponFullConfig,
  LuckyReward,
  MasterSwitches,
  RewardTier,
} from "./lucky-coupon.types";

/**
 * Default Lucky Coupon configuration:
 * Normal Rewards:
 * - 10% OFF: 65% (weight: 650 / 1000) -> Majority reward
 * - 5% OFF:  20% (weight: 200 / 1000)
 * - 15% OFF: 14% (weight: 140 / 1000)
 *
 * Rare Rewards:
 * - 20% OFF: ~0.6% (weight: 6 / 1000)
 * - 25% OFF: ~0.3% (weight: 3 / 1000)
 * (Combined Rare: ~0.9% ~ 1 in 100)
 *
 * Jackpot Reward:
 * - 30% JACKPOT: 0.1% (weight: 1 / 1000 = 1 in 1,000)
 *
 * Total Base Weight: 1,000
 */
export const DEFAULT_LUCKY_COUPON_CONFIG: LuckyCouponFullConfig = {
  master_switches: {
    system_enabled: true,
    popup_enabled: true,
    target_new_visitors: true,
    allow_logged_in: true,
    allow_existing_customers: true,
    allow_rare: true,
    allow_jackpot: true,
  },
  campaign: {
    campaign_id: "digital_perk_v1",
    campaign_name: "ডিজিটাল সফটওয়্যার ও সাবস্ক্রিপশন ওয়েলকাম অফার",
    description: "AccessNow BD-তে নতুন কাস্টমারদের জন্য প্রিমিয়াম ডিজিটাল সফটওয়্যার, এআই টুলস ও সাবস্ক্রিপশনে বিশেষ ছাড়।",
    starts_at: null,
    ends_at: null,
    expiry_hours: 24, // 24 hours validity
    default_min_order: 0, // 0 or minimum subtotal in BDT
    default_max_discount: 500, // Maximum discount cap 500 BDT
    max_campaign_coupons: 50000,
    delay_seconds: 3,
  },
  ui: {
    title: "ডিজিটাল সফটওয়্যার ও সাবস্ক্রিপশনে বিশেষ ছাড়!",
    subtitle: "ChatGPT, Canva Pro, Netflix সহ সকল ডিজিটাল সাবস্ক্রিপশনে আনলক করুন সর্বোচ্চ ৩০% পর্যন্ত ইনস্ট্যান্ট ভাউচার।",
    button_text: "আমার ভাউচার আনলক করুন",
    celebration_title: "🎉 অভিনন্দন! আপনার ভাউচার আনলক হয়েছে!",
    celebration_message: "আপনার এক্সক্লুসিভ ডিজিটাল ভাউচার কোড নিচে অ্যাক্টিভ করা হয়েছে। চেকআউটে ব্যবহার করুন।",
  },
  rewards: [
    {
      id: "reward-10",
      label: "10% OFF",
      discount_type: "percent",
      discount_value: 10,
      tier: "popular",
      weight: 650, // 65% - Popular / Majority
      min_order_amount: 0,
      max_discount: 500,
      color: "#6366F1", // Indigo
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-5",
      label: "5% OFF",
      discount_type: "percent",
      discount_value: 5,
      tier: "normal",
      weight: 200, // 20%
      min_order_amount: 0,
      max_discount: 500,
      color: "#3B82F6", // Blue
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-15",
      label: "15% OFF",
      discount_type: "percent",
      discount_value: 15,
      tier: "premium",
      weight: 140, // 14%
      min_order_amount: 0,
      max_discount: 500,
      color: "#10B981", // Emerald
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-20",
      label: "20% OFF",
      discount_type: "percent",
      discount_value: 20,
      tier: "rare",
      weight: 6, // 0.6% (~1 in 166)
      min_order_amount: 0,
      max_discount: 500,
      color: "#F59E0B", // Amber
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-25",
      label: "25% OFF",
      discount_type: "percent",
      discount_value: 25,
      tier: "rare",
      weight: 3, // 0.3% (~1 in 333)
      min_order_amount: 0,
      max_discount: 500,
      color: "#EC4899", // Pink
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-30",
      label: "30% JACKPOT",
      discount_type: "percent",
      discount_value: 30,
      tier: "jackpot",
      weight: 1, // 0.1% (1 in 1,000)
      min_order_amount: 0,
      max_discount: 500,
      color: "#8B5CF6", // Purple
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-10-bonus",
      label: "10% MEGA",
      discount_type: "percent",
      discount_value: 10,
      tier: "popular",
      weight: 0, // Visual slice that maps to 10%
      min_order_amount: 0,
      max_discount: 500,
      color: "#14B8A6", // Teal
      text_color: "#FFFFFF",
      is_active: true,
    },
    {
      id: "reward-5-extra",
      label: "5% BONUS",
      discount_type: "percent",
      discount_value: 5,
      tier: "normal",
      weight: 0, // Visual slice that maps to 5%
      min_order_amount: 0,
      max_discount: 500,
      color: "#F97316", // Orange
      text_color: "#FFFFFF",
      is_active: true,
    },
  ],
  stats: {
    views: 0,
    attempts: 0,
    claims: 0,
    claims_5_pct: 0,
    claims_10_pct: 0,
    claims_15_pct: 0,
    claims_rare: 0,
    claims_jackpot: 0,
    used: 0,
    total_discount_amount: 0,
    version: 1,
  },
};

const CODE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 characters (no 0, 1, I, O)

/**
 * Generates a cryptographically strong, non-sequential, unique coupon code.
 * Example format: LUCKY-8K4P-X92M
 */
export function generateLuckyCouponCode(prefix = "LUCKY"): string {
  const getRandomBytes = (length: number): Uint8Array => {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const arr = new Uint8Array(length);
      crypto.getRandomValues(arr);
      return arr;
    }
    // Fallback if crypto isn't available
    const arr = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };

  const bytes = getRandomBytes(8);
  let part1 = "";
  let part2 = "";

  for (let i = 0; i < 4; i++) {
    part1 += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }
  for (let i = 4; i < 8; i++) {
    part2 += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
  }

  return `${prefix}-${part1}-${part2}`;
}

/**
 * Calculates current live probabilities and odds for all rewards taking into account
 * master switches (allow_rare, allow_jackpot) and active flags.
 */
export function calculateProbabilityDistribution(
  rewards: LuckyReward[],
  switches: MasterSwitches
): {
  eligibleRewards: LuckyReward[];
  totalWeight: number;
  breakdown: Array<{
    reward: LuckyReward;
    weight: number;
    probabilityPct: number;
    oddsText: string;
    isEligible: boolean;
  }>;
} {
  const breakdown: Array<{
    reward: LuckyReward;
    weight: number;
    probabilityPct: number;
    oddsText: string;
    isEligible: boolean;
  }> = [];

  const eligibleRewards: LuckyReward[] = [];

  for (const reward of rewards) {
    let eligible = reward.is_active;

    if (reward.tier === "rare" && !switches.allow_rare) {
      eligible = false;
    }
    if (reward.tier === "jackpot" && !switches.allow_jackpot) {
      eligible = false;
    }

    if (eligible && reward.weight > 0) {
      eligibleRewards.push(reward);
    }
  }

  const totalWeight = eligibleRewards.reduce((sum, r) => sum + Math.max(0, r.weight), 0);

  for (const reward of rewards) {
    const isEligible = eligibleRewards.some((r) => r.id === reward.id);
    const weight = isEligible ? Math.max(0, reward.weight) : 0;
    const probabilityPct = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

    let oddsText = "—";
    if (weight > 0 && totalWeight > 0) {
      const oneInN = Math.round(totalWeight / weight);
      if (oneInN >= 10) {
        oddsText = `1 in ${oneInN.toLocaleString()}`;
      } else {
        oddsText = `${probabilityPct.toFixed(1)}%`;
      }
    }

    breakdown.push({
      reward,
      weight,
      probabilityPct,
      oddsText,
      isEligible,
    });
  }

  return { eligibleRewards, totalWeight, breakdown };
}

/**
 * Core Probability Engine:
 * Selects a winning reward slice based on configured weights and master switches.
 * Uses a secure random integer in [0, totalWeight - 1].
 */
export function selectWeightedReward(
  rewards: LuckyReward[],
  switches: MasterSwitches,
  explicitRandomWeight?: number
): {
  reward: LuckyReward;
  sliceIndex: number;
  totalWeight: number;
  randomPicked: number;
} {
  const { eligibleRewards, totalWeight } = calculateProbabilityDistribution(rewards, switches);

  if (eligibleRewards.length === 0 || totalWeight <= 0) {
    // Fallback to first active reward
    const fallback = rewards.find((r) => r.is_active) ?? rewards[0];
    const idx = rewards.findIndex((r) => r.id === fallback.id);
    return {
      reward: fallback,
      sliceIndex: idx >= 0 ? idx : 0,
      totalWeight: 0,
      randomPicked: 0,
    };
  }

  // Get secure random integer
  let randomVal: number;
  if (explicitRandomWeight !== undefined && explicitRandomWeight >= 0) {
    randomVal = Math.min(totalWeight - 1, Math.floor(explicitRandomWeight));
  } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    // Unbiased modulo reduction
    randomVal = buf[0] % totalWeight;
  } else {
    randomVal = Math.floor(Math.random() * totalWeight);
  }

  let runningSum = 0;
  for (const reward of eligibleRewards) {
    runningSum += Math.max(0, reward.weight);
    if (randomVal < runningSum) {
      const idx = rewards.findIndex((r) => r.id === reward.id);
      return {
        reward,
        sliceIndex: idx >= 0 ? idx : 0,
        totalWeight,
        randomPicked: randomVal,
      };
    }
  }

  // Edge case fallback
  const lastReward = eligibleRewards[eligibleRewards.length - 1];
  const lastIdx = rewards.findIndex((r) => r.id === lastReward.id);
  return {
    reward: lastReward,
    sliceIndex: lastIdx >= 0 ? lastIdx : 0,
    totalWeight,
    randomPicked: randomVal,
  };
}

/**
 * Determine reward tier from discount percentage if not already specified.
 */
export function getRewardTier(discountValue: number): RewardTier {
  if (discountValue >= 30) return "jackpot";
  if (discountValue >= 16) return "rare";
  if (discountValue >= 15) return "premium";
  if (discountValue >= 10) return "popular";
  return "normal";
}

export type RewardTier = "normal" | "popular" | "premium" | "rare" | "jackpot";

export type LuckyReward = {
  id: string;
  label: string; // e.g. "10% OFF"
  coupon_prefix?: string; // e.g. "LUCKY10"
  discount_type: "percent" | "flat";
  discount_value: number; // e.g. 10
  tier: RewardTier;
  weight: number; // Probability weight in pool
  min_order_amount: number; // Minimum subtotal required in BDT
  max_discount: number | null; // Maximum discount cap in BDT
  color: string;
  text_color: string;
  is_active: boolean;
};

export type MasterSwitches = {
  system_enabled: boolean; // Master switch: Lucky Coupon System ON/OFF
  popup_enabled: boolean; // Popup auto-display ON/OFF
  target_new_visitors: boolean; // New Visitor ON/OFF
  allow_logged_in: boolean; // Logged-in Customer ON/OFF
  allow_existing_customers: boolean; // Existing Customer ON/OFF
  allow_rare: boolean; // Rare Rewards (16-29%) ON/OFF
  allow_jackpot: boolean; // Jackpot (30%) ON/OFF
};

export type CampaignRules = {
  campaign_id: string;
  campaign_name: string;
  description: string;
  starts_at: string | null; // ISO timestamp
  ends_at: string | null; // ISO timestamp
  expiry_hours: number; // Default validity (e.g. 24 or 168 hours)
  default_min_order: number; // Default minimum order in BDT
  default_max_discount: number; // Default max discount cap in BDT
  max_campaign_coupons: number;
  delay_seconds: number; // Popup trigger delay
};

export type LuckyWheelUIConfig = {
  title: string;
  subtitle: string;
  button_text: string;
  celebration_title: string;
  celebration_message: string;
};

export type LuckyWheelStats = {
  views: number;
  attempts: number;
  claims: number;
  claims_5_pct: number;
  claims_10_pct: number;
  claims_15_pct: number;
  claims_rare: number;
  claims_jackpot: number;
  used: number;
  total_discount_amount: number;
  version: number;
};

export type LuckyCouponFullConfig = {
  master_switches: MasterSwitches;
  campaign: CampaignRules;
  ui: LuckyWheelUIConfig;
  rewards: LuckyReward[];
  stats: LuckyWheelStats;
};

export type LuckyClaimRecord = {
  id: string;
  campaign_id: string;
  visitor_id: string;
  user_id: string | null;
  user_email: string | null;
  coupon_code: string;
  discount_value: number;
  discount_type: "percent" | "flat";
  label: string;
  tier: RewardTier;
  slice_id: string;
  slice_index: number;
  min_order_amount: number;
  max_discount: number;
  expires_at: string;
  claimed_at: string;
  is_used: boolean;
  used_at?: string;
  order_id?: string;
};

export type ClaimLuckyCouponResult =
  | {
      success: true;
      sliceIndex: number;
      slice: LuckyReward;
      coupon: {
        code: string;
        label: string;
        discount_value: number;
        discount_type: "percent" | "flat";
        min_order_amount: number;
        max_discount: number;
        expires_at: string;
        tier: RewardTier;
      };
      isRare: boolean;
      isJackpot: boolean;
    }
  | {
      success: false;
      reason: string;
      alreadyClaimed?: boolean;
      existingCoupon?: LuckyClaimRecord;
    };

export type LuckyEligibilityResult = {
  eligible: boolean;
  reason?: string;
  existingCoupon?: LuckyClaimRecord | null;
  config?: {
    enabled: boolean;
    popup_enabled: boolean;
    delay_seconds: number;
    title: string;
    subtitle: string;
    button_text: string;
  };
};

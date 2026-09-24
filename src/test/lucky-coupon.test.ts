import { describe, it, expect } from "vitest";
import {
  DEFAULT_LUCKY_COUPON_CONFIG,
  generateLuckyCouponCode,
  calculateProbabilityDistribution,
  selectWeightedReward,
  getRewardTier,
} from "../lib/lucky-coupon-engine";

describe("Lucky Coupon System - Probability Engine & Code Generator", () => {
  it("generates a unique, high-entropy code with LUCKY-XXXX-XXXX format", () => {
    const code = generateLuckyCouponCode("LUCKY");
    expect(code).toMatch(/^LUCKY-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);

    // Verify 100 codes are all distinct
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(generateLuckyCouponCode("LUCKY"));
    }
    expect(set.size).toBe(100);
  });

  it("calculates correct default probability distribution", () => {
    const { totalWeight, breakdown } = calculateProbabilityDistribution(
      DEFAULT_LUCKY_COUPON_CONFIG.rewards,
      DEFAULT_LUCKY_COUPON_CONFIG.master_switches
    );

    // Total base weight pool: 1,000
    expect(totalWeight).toBe(1000);

    const jackpotItem = breakdown.find((b) => b.reward.discount_value === 30);
    expect(jackpotItem).toBeDefined();
    // 1 in 1,000 = 0.1%
    expect(jackpotItem?.probabilityPct).toBeCloseTo(0.1, 2);
    expect(jackpotItem?.oddsText).toBe("1 in 1,000");

    const tenPercentItem = breakdown.find((b) => b.reward.discount_value === 10 && b.weight > 0);
    expect(tenPercentItem).toBeDefined();
    // 650 / 1000 = 65% - majority
    expect(tenPercentItem?.probabilityPct).toBeCloseTo(65, 1);

    const fivePercentItem = breakdown.find((b) => b.reward.discount_value === 5 && b.weight > 0);
    expect(fivePercentItem).toBeDefined();
    // 200 / 1000 = 20%
    expect(fivePercentItem?.probabilityPct).toBeCloseTo(20, 1);

    const fifteenPercentItem = breakdown.find((b) => b.reward.discount_value === 15);
    expect(fifteenPercentItem).toBeDefined();
    // 140 / 1000 = 14%
    expect(fifteenPercentItem?.probabilityPct).toBeCloseTo(14, 1);

    // Rare pool combined (20% & 25%) = 6 + 3 = 9 in 1000 (~0.9% ~ 1 in 100)
    const rareWeight = breakdown
      .filter((b) => b.reward.tier === "rare")
      .reduce((sum, b) => sum + b.weight, 0);
    expect(rareWeight).toBe(9);
  });

  it("disables jackpot and rare rewards when master switches are toggled off", () => {
    const disabledSwitches = {
      ...DEFAULT_LUCKY_COUPON_CONFIG.master_switches,
      allow_jackpot: false,
      allow_rare: false,
    };

    const { eligibleRewards, totalWeight, breakdown } = calculateProbabilityDistribution(
      DEFAULT_LUCKY_COUPON_CONFIG.rewards,
      disabledSwitches
    );

    expect(eligibleRewards.some((r) => r.tier === "jackpot")).toBe(false);
    expect(eligibleRewards.some((r) => r.tier === "rare")).toBe(false);

    const jackpotEntry = breakdown.find((b) => b.reward.tier === "jackpot");
    expect(jackpotEntry?.isEligible).toBe(false);
    expect(jackpotEntry?.probabilityPct).toBe(0);

    // Normal pool weight: 650 + 200 + 140 = 990
    expect(totalWeight).toBe(990);
  });

  it("accurately distributes rewards over 20,000 Monte Carlo simulations", () => {
    const counts: Record<number, number> = {
      5: 0,
      10: 0,
      15: 0,
      20: 0,
      25: 0,
      30: 0,
    };

    const N = 20000;
    for (let i = 0; i < N; i++) {
      const { reward } = selectWeightedReward(
        DEFAULT_LUCKY_COUPON_CONFIG.rewards,
        DEFAULT_LUCKY_COUPON_CONFIG.master_switches
      );
      counts[reward.discount_value] = (counts[reward.discount_value] || 0) + 1;
    }

    const pct10 = (counts[10] / N) * 100;
    const pct5 = (counts[5] / N) * 100;
    const pct15 = (counts[15] / N) * 100;
    const rareCount = counts[20] + counts[25];
    const jackpotCount = counts[30];

    // 10% should be the majority (~65% ± 3%)
    expect(pct10).toBeGreaterThan(58);
    expect(pct10).toBeLessThan(72);

    // 5% should be ~20% ± 3%
    expect(pct5).toBeGreaterThan(15);
    expect(pct5).toBeLessThan(25);

    // 15% should be ~14% ± 3%
    expect(pct15).toBeGreaterThan(10);
    expect(pct15).toBeLessThan(18);

    // Rare pool combined should be ~1 in 100 (~1% of 20000 = ~200, within 100-300)
    expect(rareCount).toBeGreaterThan(80);
    expect(rareCount).toBeLessThan(350);

    // Jackpot is ~1 in 1000 (~20 in 20000)
    expect(jackpotCount).toBeGreaterThan(3);
    expect(jackpotCount).toBeLessThan(50);
  });

  it("correctly identifies reward tiers", () => {
    expect(getRewardTier(5)).toBe("normal");
    expect(getRewardTier(10)).toBe("popular");
    expect(getRewardTier(15)).toBe("premium");
    expect(getRewardTier(20)).toBe("rare");
    expect(getRewardTier(25)).toBe("rare");
    expect(getRewardTier(30)).toBe("jackpot");
  });
});

import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Save,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Gift,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Flame,
  Percent,
  Trophy,
  ShieldCheck,
  Settings2,
  BarChart3,
  Users,
  Check,
  Copy,
  Activity,
  Sliders,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AdminStatCard, AdminStatGrid, AdminGlassCard } from "@/components/admin/AdminStatCard";
import { SpinWheelCanvas } from "@/components/SpinWheelCanvas";
import {
  DEFAULT_LUCKY_COUPON_CONFIG,
  calculateProbabilityDistribution,
  selectWeightedReward,
} from "@/lib/lucky-coupon-engine";
import {
  LuckyCouponFullConfig,
  LuckyReward,
  MasterSwitches,
  LuckyClaimRecord,
} from "@/lib/lucky-coupon.types";
import {
  getLuckyAdminData,
  updateLuckyAdminData,
} from "@/lib/lucky-coupon.functions";

export const Route = createFileRoute("/admin/lucky-wheel")({
  component: AdminLuckyWheelPage,
});

const PRESET_COLORS = [
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#EF4444", // Red
  "#06B6D4", // Cyan
];

function AdminLuckyWheelPage() {
  const [config, setConfig] = useState<LuckyCouponFullConfig>(DEFAULT_LUCKY_COUPON_CONFIG);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [recentClaims, setRecentClaims] = useState<LuckyClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"slices" | "campaign" | "claims" | "simulator">("slices");

  // Live test spin in preview
  const [testSpinning, setTestSpinning] = useState(false);
  const [testTargetIdx, setTestTargetIdx] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Monte Carlo simulation state
  const [simulationCount, setSimulationCount] = useState<1000 | 10000>(1000);
  const [simResults, setSimResults] = useState<Record<string, { count: number; pct: number }> | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Load configuration & claim log
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLuckyAdminData();
      if (res.config) {
        setConfig(res.config);
      }
      setRecordId(res.recordId);
      if (res.recentClaims) {
        setRecentClaims(res.recentClaims);
      }
    } catch (err) {
      console.warn("Failed to load admin lucky data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live probabilities
  const { totalWeight, breakdown } = useMemo(() => {
    return calculateProbabilityDistribution(config.rewards, config.master_switches);
  }, [config.rewards, config.master_switches]);

  // Update Master Switches
  const toggleSwitch = (key: keyof MasterSwitches) => {
    setConfig((prev) => ({
      ...prev,
      master_switches: {
        ...prev.master_switches,
        [key]: !prev.master_switches[key],
      },
    }));
  };

  // Update Campaign Field
  const updateCampaign = <K extends keyof LuckyCouponFullConfig["campaign"]>(
    key: K,
    value: LuckyCouponFullConfig["campaign"][K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      campaign: { ...prev.campaign, [key]: value },
    }));
  };

  // Update a specific reward slice
  const updateReward = (index: number, patch: Partial<LuckyReward>) => {
    setConfig((prev) => {
      const nextRewards = [...prev.rewards];
      nextRewards[index] = { ...nextRewards[index], ...patch };
      return { ...prev, rewards: nextRewards };
    });
  };

  // Add new reward slice
  const addReward = () => {
    const nextColor = PRESET_COLORS[config.rewards.length % PRESET_COLORS.length];
    const newReward: LuckyReward = {
      id: `reward-${Date.now()}`,
      label: "10% OFF",
      discount_type: "percent",
      discount_value: 10,
      tier: "popular",
      weight: 100,
      min_order_amount: 0,
      max_discount: 500,
      color: nextColor,
      text_color: "#FFFFFF",
      is_active: true,
    };
    setConfig((prev) => ({ ...prev, rewards: [...prev.rewards, newReward] }));
  };

  // Delete reward slice
  const deleteReward = (index: number) => {
    if (config.rewards.length <= 2) {
      return toast.error("কমপক্ষে ২টি রিওয়ার্ড স্লাইস থাকতে হবে!");
    }
    setConfig((prev) => ({
      ...prev,
      rewards: prev.rewards.filter((_, idx) => idx !== index),
    }));
  };

  // Save Settings to Database
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLuckyAdminData({
        data: {
          config,
          recordId,
        },
      });
      toast.success("লাকি কুপন সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে!");
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (confirm("আপনি কি নিশ্চিত যে ডিফল্ট সেটিংস রিস্টোর করতে চান?")) {
      setConfig(DEFAULT_LUCKY_COUPON_CONFIG);
      toast.info("ডিফল্ট কনফিগারেশন লোড করা হয়েছে। সেভ বাটনে ক্লিক করুন।");
    }
  };

  // Preview test spin
  const handleTestSpin = () => {
    if (testSpinning) return;
    const { sliceIndex, reward } = selectWeightedReward(config.rewards, config.master_switches);
    setTestTargetIdx(sliceIndex);
    setTestSpinning(true);
    setTestResult(null);

    // After animation finishes
    setTimeout(() => {
      setTestSpinning(false);
      setTestResult(`${reward.label} (${reward.discount_value}% - ${reward.tier.toUpperCase()})`);
    }, 4200);
  };

  // Run Monte Carlo Simulation
  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      const counts: Record<string, number> = {};
      for (const r of config.rewards) {
        counts[r.label] = 0;
      }

      for (let i = 0; i < simulationCount; i++) {
        const { reward } = selectWeightedReward(config.rewards, config.master_switches);
        counts[reward.label] = (counts[reward.label] || 0) + 1;
      }

      const results: Record<string, { count: number; pct: number }> = {};
      for (const [key, cnt] of Object.entries(counts)) {
        results[key] = {
          count: cnt,
          pct: (cnt / simulationCount) * 100,
        };
      }

      setSimResults(results);
      setSimulating(false);
      toast.success(`${simulationCount.toLocaleString()} স্পিন সিমুলেশন সম্পন্ন হয়েছে!`);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Clock className="h-5 w-5 animate-spin text-purple-600" />
          <span>লাকি কুপন ডেটা লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              ডিজিটাল ওয়েলকাম ভাউচার ও ডিসকাউন্ট পার্ক ম্যানেজমেন্ট
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                config.master_switches.system_enabled
                  ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 border border-rose-500/30"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  config.master_switches.system_enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                }`}
              />
              {config.master_switches.system_enabled ? "সিস্টেম সক্রিয়" : "সিস্টেম বন্ধ"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            ডিজিটাল সফটওয়্যার ও সাবস্ক্রিপশন ওয়েলকাম অফার, প্রবাবিলিটি ইঞ্জিন, রেয়ার রিওয়ার্ড এবং কুপন ফ্রড প্রোটেকশন কনফিগার করুন।
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>ডিফল্ট রিস্টোর</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-md shadow-purple-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}</span>
          </button>
        </div>
      </div>

      {/* MASTER SWITCHES CARD */}
      <AdminGlassCard className="p-5 border border-purple-500/20 bg-gradient-to-r from-purple-950/10 via-slate-900/5 to-indigo-950/10">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <Sliders className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-bold text-foreground">সিস্টেম মাস্টার সুইচ ও অ্যাক্সেস রুলস</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            (কোড পরিবর্তন না করেই সম্পূর্ণ সিস্টেম নিয়ন্ত্রণযোগ্য)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* Master System */}
          <div
            onClick={() => toggleSwitch("system_enabled")}
            className={`cursor-pointer rounded-2xl p-3 border transition select-none ${
              config.master_switches.system_enabled
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">লাকি কুপন সিস্টেম</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  config.master_switches.system_enabled ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {config.master_switches.system_enabled ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">সম্পূর্ণ লাকি সিস্টেম গ্লোবাল অন/অফ</p>
          </div>

          {/* Popup Auto-Show */}
          <div
            onClick={() => toggleSwitch("popup_enabled")}
            className={`cursor-pointer rounded-2xl p-3 border transition select-none ${
              config.master_switches.popup_enabled
                ? "bg-indigo-500/10 border-indigo-500/30"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">অটো পপআপ উইন্ডো</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  config.master_switches.popup_enabled ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {config.master_switches.popup_enabled ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">হোমপেজে অটোমেটিক পপআপ ডিসপ্লে</p>
          </div>

          {/* Target New Visitors */}
          <div
            onClick={() => toggleSwitch("target_new_visitors")}
            className={`cursor-pointer rounded-2xl p-3 border transition select-none ${
              config.master_switches.target_new_visitors
                ? "bg-purple-500/10 border-purple-500/30"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">নতুন ভিজিটর</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  config.master_switches.target_new_visitors
                    ? "bg-purple-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {config.master_switches.target_new_visitors ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">নতুন ব্রাউজার ভিজিটরদের সুযোগ</p>
          </div>

          {/* Logged in customers */}
          <div
            onClick={() => toggleSwitch("allow_logged_in")}
            className={`cursor-pointer rounded-2xl p-3 border transition select-none ${
              config.master_switches.allow_logged_in
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">লগড-ইন কাস্টমার</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  config.master_switches.allow_logged_in ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {config.master_switches.allow_logged_in ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">রেজিস্টার্ড একাউন্ট থাকলে স্পিন</p>
          </div>

          {/* Rare Rewards (16-29%) */}
          <div
            onClick={() => toggleSwitch("allow_rare")}
            className={`cursor-pointer rounded-2xl p-3 border transition select-none ${
              config.master_switches.allow_rare ? "bg-pink-500/10 border-pink-500/30" : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">রেয়ার রিওয়ার্ড (১৬-২৯%)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  config.master_switches.allow_rare ? "bg-pink-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {config.master_switches.allow_rare ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">১০০ জনের ১ জন পাবার পুল</p>
          </div>

          {/* Jackpot (30%) */}
          <div
            onClick={() => toggleSwitch("allow_jackpot")}
            className={`cursor-pointer rounded-2xl p-3 border transition select-none ${
              config.master_switches.allow_jackpot
                ? "bg-amber-500/10 border-amber-500/30"
                : "bg-muted/40 border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">জ্যাকপট (৩০%)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-black ${
                  config.master_switches.allow_jackpot ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {config.master_switches.allow_jackpot ? "ON" : "OFF"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">১০০০ জনের ১ জন পাবার পুল</p>
          </div>
        </div>
      </AdminGlassCard>

      {/* STATISTICS GRID */}
      <AdminStatGrid>
        <AdminStatCard
          label="মোট ভিউ / ওপেন"
          value={config.stats.views.toLocaleString()}
          icon={Eye}
          color="indigo"
          description="হোমপেজে যতবার স্পিন হুইল প্রদর্শন হয়েছে"
        />
        <AdminStatCard
          label="মোট কুপন জেনারেট"
          value={config.stats.claims.toLocaleString()}
          icon={Gift}
          color="emerald"
          description="সফলভাবে ডিসকাউন্ট জেনারেট ও ক্লেইম"
        />
        <AdminStatCard
          label="১০% কুপন (পপুলার)"
          value={config.stats.claims_10_pct.toLocaleString()}
          icon={Percent}
          color="blue"
          description="অধিকাংশ ভিজিটররা এই কুপন পেয়েছে"
        />
        <AdminStatCard
          label="রেয়ার ও জ্যাকপট"
          value={`${config.stats.claims_rare + config.stats.claims_jackpot} টি`}
          icon={Trophy}
          color="amber"
          description={`রেয়ার: ${config.stats.claims_rare} | জ্যাকপট: ${config.stats.claims_jackpot}`}
        />
      </AdminStatGrid>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("slices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "slices"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Percent className="h-3.5 w-3.5" />
          <span>স্লাইস ও প্রবাবিলিটি সেটিংস</span>
        </button>

        <button
          onClick={() => setActiveTab("campaign")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "campaign"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
          <span>ক্যাম্পেইন রুলস ও সময়সীমা</span>
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "claims"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>ফ্রড মনিটরিং ও ক্লেইম লগ ({recentClaims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "simulator"
              ? "bg-purple-600 text-white shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>মন্টে কার্লো সিমুলেটর</span>
        </button>
      </div>

      {/* TAB CONTENT 1: SLICES & PROBABILITY */}
      {activeTab === "slices" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Slices List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">রিওয়ার্ড স্লাইস ও প্রবাবিলিটি কনফিগারেশন</h3>
                <p className="text-xs text-muted-foreground">
                  মোট স্লাইস ওয়েট পুল: <span className="font-bold text-purple-600">{totalWeight}</span>
                </p>
              </div>
              <button
                onClick={addReward}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>নতুন স্লাইস যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-3">
              {config.rewards.map((reward, index) => {
                const prob = breakdown.find((b) => b.reward.id === reward.id);
                const isJackpot = reward.tier === "jackpot";
                const isRare = reward.tier === "rare";

                return (
                  <AdminGlassCard
                    key={reward.id || index}
                    className={`p-4 border transition ${
                      !reward.is_active
                        ? "opacity-60 bg-muted/20"
                        : isJackpot
                        ? "border-amber-500/40 bg-amber-500/5"
                        : isRare
                        ? "border-pink-500/40 bg-pink-500/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Color and Label */}
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={reward.color}
                          onChange={(e) => updateReward(index, { color: e.target.value })}
                          className="h-8 w-8 rounded-lg cursor-pointer border-0 bg-transparent"
                          title="স্লাইস কালার"
                        />
                        <div>
                          <input
                            type="text"
                            value={reward.label}
                            onChange={(e) => updateReward(index, { label: e.target.value })}
                            className="font-bold text-sm bg-transparent border-b border-dashed border-border focus:border-purple-500 outline-none text-foreground px-1"
                            placeholder="যেমন: 10% OFF"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                isJackpot
                                  ? "bg-amber-400 text-slate-950"
                                  : isRare
                                  ? "bg-pink-500 text-white"
                                  : reward.tier === "premium"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-indigo-500 text-white"
                              }`}
                            >
                              {reward.tier}
                            </span>
                            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                              {prob?.oddsText || "0%"} ({prob?.probabilityPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Value & Weight Inputs */}
                      <div className="grid grid-cols-3 gap-2.5 sm:w-80">
                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">ছাড় (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={reward.discount_value}
                            onChange={(e) =>
                              updateReward(index, {
                                discount_value: Number(e.target.value),
                                tier: Number(e.target.value) >= 30 ? "jackpot" : Number(e.target.value) >= 16 ? "rare" : "normal",
                              })
                            }
                            className="w-full text-xs font-bold rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">ওয়েট (Weight)</label>
                          <input
                            type="number"
                            min="0"
                            value={reward.weight}
                            onChange={(e) => updateReward(index, { weight: Math.max(0, Number(e.target.value)) })}
                            className="w-full text-xs font-bold rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground block mb-0.5">ন্যূনতম অর্ডার</label>
                          <input
                            type="number"
                            min="0"
                            value={reward.min_order_amount || 0}
                            onChange={(e) =>
                              updateReward(index, { min_order_amount: Math.max(0, Number(e.target.value)) })
                            }
                            className="w-full text-xs font-bold rounded-lg border border-border bg-background px-2.5 py-1.5 text-foreground"
                            placeholder="৳0"
                          />
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => updateReward(index, { is_active: !reward.is_active })}
                          className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition ${
                            reward.is_active
                              ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {reward.is_active ? "সক্রিয়" : "বন্ধ"}
                        </button>
                        <button
                          onClick={() => deleteReward(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </AdminGlassCard>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Interactive Digital Voucher Pass Preview */}
          <div className="lg:col-span-4 sticky top-6 space-y-4">
            <AdminGlassCard className="p-5 border border-purple-500/20 text-center">
              <h3 className="text-sm font-bold text-foreground mb-1">লাইভ ডিজিটাল ভাউচার প্রিভিউ</h3>
              <p className="text-xs text-muted-foreground mb-4">
                কাস্টমাররা যে ডিজিটাল ভাউচার ইন্টারফেস দেখবেন তার লাইভ প্রিভিউ
              </p>

              {/* Digital Pass Preview Box */}
              <div className="rounded-2xl bg-gradient-to-br from-[#1E1B4B]/80 via-[#0F172A] to-[#020617] border border-purple-500/40 p-4 text-left shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 pb-2 border-b border-white/10">
                  <span className="font-bold text-indigo-300">ACCESSNOW SOFTWARE PASS</span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[9px]">
                    LIVE PREVIEW
                  </span>
                </div>

                {testResult ? (
                  <div className="space-y-3 py-1">
                    <div className="text-center">
                      <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        আনলকড ভাউচার
                      </span>
                      <h4 className="text-xl font-black text-amber-300 tracking-tight">
                        {testResult}
                      </h4>
                    </div>

                    <div className="bg-black/60 rounded-xl px-3 py-2 border border-white/15 text-center">
                      <span className="font-mono text-sm font-black tracking-widest text-amber-300">
                        LUCKY-PREVIEW-PASS
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-300 space-y-1 border-t border-white/10 pt-2">
                      <p>✓ AI, Streaming ও সকল সফটওয়্যারে প্রযোজ্য</p>
                      <p>✓ মেয়াদ: {config.campaign.expiry_hours} ঘণ্টা</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-xl bg-purple-600/30 text-purple-400 flex items-center justify-center border border-purple-500/30">
                      <Zap className="h-5 w-5 text-yellow-300" />
                    </div>
                    <span className="block text-xs font-bold text-white">
                      ওয়েলকাম ডিজিটাল ভাউচার
                    </span>
                    <p className="text-[10px] text-slate-400">
                      ৫% থেকে ৩০% পর্যন্ত বিশেষ ডিসকাউন্ট
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 pt-1">
                      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-300">AI Tools</span>
                      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-300">Canva</span>
                      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-300">Streaming</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <button
                  onClick={handleTestSpin}
                  disabled={testSpinning}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>{testSpinning ? "ভাউচার ডিক্রিপ্ট হচ্ছে..." : "টেস্ট ভাউচার আনলক করুন"}</span>
                </button>
              </div>
            </AdminGlassCard>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: CAMPAIGN RULES */}
      {activeTab === "campaign" && (
        <AdminGlassCard className="p-6 border border-border max-w-3xl space-y-5">
          <h3 className="text-sm font-bold text-foreground border-b pb-3">ক্যাম্পেইন সেটিংস ও মেয়াদ নির্ধারণ</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">ক্যাম্পেইনের নাম</label>
              <input
                type="text"
                value={config.campaign.campaign_name}
                onChange={(e) => updateCampaign("campaign_name", e.target.value)}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="যেমন: স্পেশাল লাকি ডিসকাউন্ট ২০২৬"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">কুপনের মেয়াদ (ঘণ্টা)</label>
              <input
                type="number"
                min="1"
                value={config.campaign.expiry_hours}
                onChange={(e) => updateCampaign("expiry_hours", Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="24 (১ দিন) বা 168 (৭ দিন)"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {config.campaign.expiry_hours} ঘণ্টা = {(config.campaign.expiry_hours / 24).toFixed(1)} দিন
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">ডিফল্ট ন্যূনতম অর্ডার (BDT)</label>
              <input
                type="number"
                min="0"
                value={config.campaign.default_min_order}
                onChange={(e) => updateCampaign("default_min_order", Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="0"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">সর্বোচ্চ ডিসকাউন্ট ক্যাপ (BDT)</label>
              <input
                type="number"
                min="0"
                value={config.campaign.default_max_discount}
                onChange={(e) => updateCampaign("default_max_discount", Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">পপআপ খোলার ডিলে (সেকেন্ড)</label>
              <input
                type="number"
                min="0"
                value={config.campaign.delay_seconds}
                onChange={(e) => updateCampaign("delay_seconds", Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="3"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">কুপন বার দেখানোর সময় (সেকেন্ড)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.campaign.launcher_hide_seconds}
                onChange={(e) => updateCampaign("launcher_hide_seconds", Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="10"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">কুপন পাওয়ার পর ছোট বারটি সর্বোচ্চ ১০ সেকেন্ড থাকবে।</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">সর্বোচ্চ ক্যাম্পেইন কুপন সীমা</label>
              <input
                type="number"
                min="0"
                value={config.campaign.max_campaign_coupons}
                onChange={(e) => updateCampaign("max_campaign_coupons", Number(e.target.value))}
                className="w-full text-xs font-medium rounded-xl border border-border bg-background px-3 py-2 text-foreground"
                placeholder="50000"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition"
            >
              <Save className="h-4 w-4" />
              <span>ক্যাম্পেইন রুলস সংরক্ষণ করুন</span>
            </button>
          </div>
        </AdminGlassCard>
      )}

      {/* TAB CONTENT 3: CLAIMS & FRAUD MONITORING */}
      {activeTab === "claims" && (
        <AdminGlassCard className="p-6 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">সাম্প্রতিক লাকি কুপন বিতরণ ও ক্লেইম অডিট লগ</h3>
              <p className="text-xs text-muted-foreground">
                সার্ভার-সাইড ভ্যালিডেশন দ্বারা সংরক্ষিত রিয়েল-টাইম ক্লেইম রেকর্ডস
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>রিফ্রেশ</span>
            </button>
          </div>

          {recentClaims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">সময়</th>
                    <th className="py-2.5 px-3">কুপন কোড</th>
                    <th className="py-2.5 px-3">রিওয়ার্ড</th>
                    <th className="py-2.5 px-3">টিয়ার</th>
                    <th className="py-2.5 px-3">ভিজিটর / ইউজার</th>
                    <th className="py-2.5 px-3">মেয়াদ</th>
                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentClaims.map((claim, idx) => {
                    const isUsed = claim.is_used;
                    const isExpired = new Date(claim.expires_at).getTime() < Date.now();
                    const statusText = isUsed ? "ব্যবহৃত" : isExpired ? "মেয়াদোত্তীর্ণ" : "সক্রিয়";
                    const statusColor = isUsed
                      ? "bg-slate-500/15 text-slate-500"
                      : isExpired
                      ? "bg-rose-500/15 text-rose-500"
                      : "bg-emerald-500/15 text-emerald-600";

                    return (
                      <tr key={claim.id || idx} className="hover:bg-muted/30 transition">
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                          {new Date(claim.claimed_at).toLocaleTimeString("bn-BD", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-500 select-all">
                          {claim.coupon_code}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {claim.label}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                              claim.tier === "jackpot"
                                ? "bg-amber-400 text-slate-950"
                                : claim.tier === "rare"
                                ? "bg-pink-500 text-white"
                                : "bg-indigo-500 text-white"
                            }`}
                          >
                            {claim.tier}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground truncate max-w-xs">
                          {claim.user_email || claim.visitor_id.substring(0, 14) + "..."}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground text-[11px]">
                          {new Date(claim.expires_at).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs">এখনো পর্যন্ত কোনো ক্লেইম রেকর্ড রেজিস্টার হয়নি।</p>
            </div>
          )}
        </AdminGlassCard>
      )}

      {/* TAB CONTENT 4: MONTE CARLO PROBABILITY SIMULATOR */}
      {activeTab === "simulator" && (
        <AdminGlassCard className="p-6 border border-border max-w-3xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-foreground">মন্টে কার্লো প্রবাবিলিটি ইঞ্জিন ভেরিফিকেশন</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              হাজার হাজার স্পিন সিমুলেশন চালিয়ে নিশ্চিত করুন যে বাস্তব ফলাফল কনফিগার করা গাণিতিক সম্ভাবনার সাথে হুবহু মিলছে।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={simulationCount}
              onChange={(e) => setSimulationCount(Number(e.target.value) as 1000 | 10000)}
              className="text-xs font-bold rounded-xl border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="1000">১,০০০ স্পিন সিমুলেশন</option>
              <option value="10000">১০,০০০ স্পিন সিমুলেশন</option>
            </select>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition disabled:opacity-50"
            >
              <Activity className="h-4 w-4" />
              <span>{simulating ? "সিমুলেশন চলছে..." : "সিমুলেশন শুরু করুন"}</span>
            </button>
          </div>

          {simResults && (
            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-xs font-bold text-foreground">
                ফলাফল ({simulationCount.toLocaleString()} স্পিন টেস্ট):
              </h4>

              <div className="space-y-2">
                {Object.entries(simResults).map(([label, res]) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">{label}</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">
                        {res.count} বার ({res.pct.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(1, res.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AdminGlassCard>
      )}
    </div>
  );
}

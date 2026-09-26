import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  X,
  Sparkles,
  Gift,
  Copy,
  Check,
  Clock,
  ArrowRight,
  Trophy,
  Flame,
  ExternalLink,
  ShieldCheck,
  Zap,
  KeyRound,
  Layers,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import {
  getOrCreateVisitorId,
  hasDismissedLuckyModal,
  markLuckyModalDismissed,
  getLocalWonCoupon,
  saveLocalWonCoupon,
  LocalWonCoupon,
} from "@/lib/lucky-visitor";
import {
  checkLuckyEligibility,
  claimLuckyCoupon,
} from "@/lib/lucky-coupon.functions";
import { DEFAULT_LUCKY_COUPON_CONFIG } from "@/lib/lucky-coupon-engine";

// Canvas confetti celebration
function fireConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#06B6D4", "#FDE047"];
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    vRot: number;
    opacity: number;
  }> = [];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 - 50,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.7) * 20,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    });
  }

  const start = performance.now();
  const duration = 2800;

  function render(time: number) {
    const elapsed = time - start;
    if (elapsed > duration || !ctx) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.vRot;
      p.opacity = Math.max(0, 1 - elapsed / duration);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

export const LuckyWheelModal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [wonCoupon, setWonCoupon] = useState<LocalWonCoupon | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFloatingLauncher, setShowFloatingLauncher] = useState(true);
  const [uiConfig, setUiConfig] = useState(DEFAULT_LUCKY_COUPON_CONFIG.ui);
  const [launcherHideSeconds, setLauncherHideSeconds] = useState(
    DEFAULT_LUCKY_COUPON_CONFIG.campaign.launcher_hide_seconds,
  );

  const hasTriggeredRef = useRef(false);

  // Initialize eligibility check on mount
  useEffect(() => {
    let cancelled = false;

    // Check cached coupon first
    const cached = getLocalWonCoupon();
    if (cached) {
      setWonCoupon(cached);
      setShowFloatingLauncher(true);
    }

    (async () => {
      const visitorId = getOrCreateVisitorId();
      try {
        const res = await checkLuckyEligibility({
          data: {
            visitorId,
            userId: user?.id ?? undefined,
          },
        });

        if (cancelled) return;

        if (res.reason === "system_disabled") {
          setShowFloatingLauncher(false);
          return;
        }

        if (res.config) {
          setLauncherHideSeconds(res.config.launcher_hide_seconds);
          setUiConfig((prev) => ({
            ...prev,
            title: res.config?.title || prev.title,
            subtitle: res.config?.subtitle || prev.subtitle,
            button_text: res.config?.button_text || prev.button_text,
          }));
        }

        // If visitor already won in backend, sync to local state
        if (res.existingCoupon) {
          const synced: LocalWonCoupon = {
            code: res.existingCoupon.coupon_code,
            label: res.existingCoupon.label,
            discount_value: res.existingCoupon.discount_value,
            discount_type: res.existingCoupon.discount_type,
            min_order_amount: res.existingCoupon.min_order_amount,
            max_discount: res.existingCoupon.max_discount,
            expires_at: res.existingCoupon.expires_at,
            tier: res.existingCoupon.tier,
            claimed_at: res.existingCoupon.claimed_at,
          };
          saveLocalWonCoupon(synced);
          setWonCoupon(synced);
          setShowFloatingLauncher(true);
          return;
        }

        if (res.eligible) {
          setShowFloatingLauncher(true);

          // Auto-open modal if popup is enabled and not dismissed in this session
          if (res.config?.popup_enabled !== false && !hasDismissedLuckyModal() && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            const delay = (res.config?.delay_seconds || 3) * 1000;
            setTimeout(() => {
              if (!cancelled) {
                setIsOpen(true);
              }
            }, delay);
          }
        }
      } catch (err) {
        console.warn("[LuckyCouponModal] Eligibility check error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!wonCoupon || !showFloatingLauncher || isOpen) return;
    const timeout = window.setTimeout(
      () => setShowFloatingLauncher(false),
      Math.min(10, Math.max(1, launcherHideSeconds)) * 1000,
    );
    return () => window.clearTimeout(timeout);
  }, [wonCoupon, showFloatingLauncher, isOpen, launcherHideSeconds]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isUnlocking) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isUnlocking]);

  const handleClose = () => {
    if (isUnlocking) return;
    setIsOpen(false);
    markLuckyModalDismissed();
  };

  // User clicks "Unlock My Discount"
  const handleUnlockDiscount = useCallback(async () => {
    if (isUnlocking) return;

    setIsUnlocking(true);
    setUnlockProgress(10);
    const visitorId = getOrCreateVisitorId();

    // Smooth progressive decryption progress animation
    const progressInterval = setInterval(() => {
      setUnlockProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + 15;
      });
    }, 180);

    try {
      const claimResult = await claimLuckyCoupon({
        data: {
          visitorId,
          userId: user?.id ?? undefined,
          userEmail: user?.email ?? undefined,
        },
      });

      clearInterval(progressInterval);
      setUnlockProgress(100);

      // Short aesthetic delay for the reveal
      setTimeout(() => {
        setIsUnlocking(false);

        if (!claimResult.success) {
          if (claimResult.alreadyClaimed && claimResult.existingCoupon) {
            const synced: LocalWonCoupon = {
              code: claimResult.existingCoupon.coupon_code,
              label: claimResult.existingCoupon.label,
              discount_value: claimResult.existingCoupon.discount_value,
              discount_type: claimResult.existingCoupon.discount_type,
              min_order_amount: claimResult.existingCoupon.min_order_amount,
              max_discount: claimResult.existingCoupon.max_discount,
              expires_at: claimResult.existingCoupon.expires_at,
              tier: claimResult.existingCoupon.tier,
              claimed_at: claimResult.existingCoupon.claimed_at,
            };
            saveLocalWonCoupon(synced);
            setWonCoupon(synced);
          }
          toast.info(claimResult.reason);
          return;
        }

        const wonRecord: LocalWonCoupon = {
          code: claimResult.coupon.code,
          label: claimResult.coupon.label,
          discount_value: claimResult.coupon.discount_value,
          discount_type: claimResult.coupon.discount_type,
          min_order_amount: claimResult.coupon.min_order_amount,
          max_discount: claimResult.coupon.max_discount,
          expires_at: claimResult.coupon.expires_at,
          tier: claimResult.coupon.tier,
          claimed_at: new Date().toISOString(),
        };

        saveLocalWonCoupon(wonRecord);
        setWonCoupon(wonRecord);
        fireConfetti();

        if (claimResult.isJackpot) {
          toast.success("🏆 জ্যাকপট ভাউচার আনলকড! ৩০% ফ্ল্যাট ডিসকাউন্ট!");
        } else if (claimResult.isRare) {
          toast.success("🎉 অভিনন্দন! রেয়ার ডিজিটাল প্রোডাক্ট ভাউচার আনলকড!");
        } else {
          toast.success(`🎉 অভিনন্দন! ${claimResult.coupon.label} ডিজিটাল ভাউচার অ্যাক্টিভ হয়েছে!`);
        }
      }, 500);
    } catch (err: unknown) {
      clearInterval(progressInterval);
      setIsUnlocking(false);
      toast.error(err instanceof Error ? err.message : "ভাউচার আনলক করতে সমস্যা হয়েছে!");
    }
  }, [isUnlocking, user?.id, user?.email]);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`কুপন কোড "${code}" কপি করা হয়েছে!`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.info(`কুপন কোড: ${code}`);
    }
  };

  const handleShopNowWithCoupon = (code: string) => {
    handleCopyCode(code);
    setIsOpen(false);
    navigate({ to: "/products" });
  };

  const isRareTier = wonCoupon?.tier === "rare";
  const isJackpotTier = wonCoupon?.tier === "jackpot";

  return (
    <>
      {/* Sleek Floating Launcher Pill */}
      {showFloatingLauncher && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lucky-launcher fixed bottom-20 left-4 z-50 group grid max-w-[calc(100vw-2rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-full px-3 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="ডিজিটাল ওয়েলকাম ভাউচার"
          aria-label="Open Digital Welcome Voucher"
        >
          <div className="lucky-launcher-icon relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
            <Zap className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <span className="min-w-0 truncate font-bold text-xs md:text-sm">
            {wonCoupon ? `🎉 ভাউচার: ${wonCoupon.code}` : "🎁 ডিজিটাল ওয়েলকাম অফার"}
          </span>
          <span className="lucky-live-dot flex h-2 w-2 shrink-0 rounded-full animate-pulse" />
        </button>
      )}

      {/* Main Digital Perk Voucher Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="perk-modal-title"
          className="lucky-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-4 backdrop-blur-md animate-in fade-in duration-300"
          onClick={handleClose}
        >
          <div
            className="lucky-modal relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl p-5 text-card-foreground md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Tech Glow Background */}
            <div className="lucky-modal-glow pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isUnlocking}
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30"
              title="বন্ধ করুন (Esc)"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* STATE 1: UNLOCKED VOUCHER PASS */}
            {wonCoupon ? (
              <div className="flex flex-col items-center text-center py-1 animate-in zoom-in-95 duration-300">
                {/* Status Pill */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold mb-3 border ${
                    isJackpotTier
                      ? "bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm"
                      : isRareTier
                      ? "bg-pink-500/20 text-pink-300 border-pink-400/40 shadow-sm"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                  }`}
                >
                  {isJackpotTier ? (
                    <Trophy className="h-3.5 w-3.5 text-amber-300" />
                  ) : isRareTier ? (
                    <Flame className="h-3.5 w-3.5 text-pink-300" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span>
                    {isJackpotTier
                      ? "🏆 30% JACKPOT DIGITAL PASS"
                      : isRareTier
                      ? "🎉 RARE VIP SOFTWARE VOUCHER"
                      : "VERIFIED SOFTWARE VOUCHER"}
                  </span>
                </div>

                <h2
                  id="perk-modal-title"
                  className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1.5"
                >
                  {isJackpotTier ? (
                    "অবিশ্বাস্য! আনলক হয়েছে "
                  ) : isRareTier ? (
                    "অসাধারণ! আনলক হয়েছে "
                  ) : (
                    "অভিনন্দন! আপনার ভাউচার: "
                  )}
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-pink-400 bg-clip-text text-transparent">
                    {wonCoupon.label}
                  </span>
                </h2>

                <p className="text-xs md:text-sm text-slate-300 max-w-sm mb-5 leading-relaxed">
                  আপনার এক্সক্লুসিভ ডিজিটাল সাবস্ক্রিপশন ভাউচার সফলভাবে অ্যাক্টিভ হয়েছে। নিচের কোডটি দিয়ে আপনার অর্ডার সম্পন্ন করুন।
                </p>

                {/* Digital Voucher Pass Card (Apple Wallet / Tech Ticket style) */}
                <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1E293B]/80 to-[#0F172A]/95 border border-indigo-500/30 p-4 mb-5 shadow-2xl relative">
                  {/* Digital pass header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3 text-[11px] text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                      <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                      <span>ACCESSNOW BD DIGITAL PASS</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[10px]">
                      ACTIVE
                    </span>
                  </div>

                  {/* Coupon Code Container */}
                  <div className="flex items-center justify-between gap-3 bg-black/60 rounded-xl px-4 py-3 border border-white/15 shadow-inner">
                    <div className="text-left">
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        ভাউচার কোড
                      </span>
                      <span className="font-mono text-xl md:text-2xl font-black tracking-widest text-amber-300 select-all">
                        {wonCoupon.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(wonCoupon.code)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 text-xs font-bold transition active:scale-95 shadow-md"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-950" /> কপি হয়েছে!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> কপি করুন
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feature checklist */}
                  <div className="mt-3.5 space-y-1.5 text-left text-[11px] text-slate-300 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>ChatGPT, Canva Pro, Netflix সহ সকল ডিজিটাল প্রোডাক্টে প্রযোজ্য</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span>ইনস্ট্যান্ট লাইসেন্স ডেলিভারি ও ফুল ওয়ারেন্টি সাপোর্ট</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>
                        মেয়াদ: {wonCoupon.expires_at ? new Date(wonCoupon.expires_at).toLocaleDateString("bn-BD") : "২৪ ঘণ্টা"} পর্যন্ত
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                  <button
                    onClick={() => handleShopNowWithCoupon(wonCoupon.code)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 font-bold text-xs md:text-sm text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    <span>প্রোডাক্ট ব্রাউজ করুন ও ছাড় নিন</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate({ to: "/dashboard" });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 text-xs font-semibold text-slate-300 hover:bg-white/20 transition"
                  >
                    <span>ড্যাশবোর্ড</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* STATE 2: UNCLAIMED DIGITAL PERK PASS */
              <div className="flex flex-col items-center text-center py-1">
                {/* Header Tag */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-400/40 mb-3 shadow-sm">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  EXCLUSIVE DIGITAL SUBSCRIBER PERK
                </div>

                <h2
                  id="perk-modal-title"
                  className="text-xl md:text-2xl font-black text-card-foreground mb-1.5"
                >
                  {uiConfig.title}
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground max-w-md mb-5 leading-relaxed">
                  {uiConfig.subtitle}
                </p>

                {/* Futuristic Cyber Card Visual Box */}
                <div className="lucky-pass-card w-full max-w-sm rounded-2xl border border-border p-5 mb-5 relative overflow-hidden group">

                  {/* Top card info */}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[11px] text-muted-foreground mb-4 pb-2 border-b border-border">
                    <div className="flex min-w-0 items-center gap-1.5 text-primary font-bold">
                      <Layers className="h-3.5 w-3.5 shrink-0" />
                      <span>ACCESSNOW SOFTWARE PASS</span>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Sparkles className="h-2.5 w-2.5" />
                      ৫% - ৩০% নিশ্চিত ছাড়
                    </span>
                  </div>

                  {/* Center Card Content */}
                  <div className="py-2 flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="lucky-key-icon flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-lg">
                        {isUnlocking ? (
                          <Cpu className="h-7 w-7 animate-spin" />
                        ) : (
                          <KeyRound className="h-7 w-7" />
                        )}
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                      </span>
                    </div>

                    <span className="text-base font-bold text-card-foreground">
                      {isUnlocking ? "ডিজিটাল ভাউচার ডিক্রিপ্ট হচ্ছে..." : "ওয়েলকাম সফটওয়্যার ভাউচার"}
                    </span>

                    {/* Progress bar when unlocking */}
                    {isUnlocking ? (
                      <div className="w-full mt-3 space-y-1.5">
                        <div className="h-2 w-full rounded-full bg-black/60 overflow-hidden border border-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-200"
                            style={{ width: `${unlockProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-cyan-300">
                          [ SECURING SERVER REWARD: {unlockProgress}% ]
                        </span>
                      </div>
                    ) : (
                      /* Supported categories pill list */
                      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                        <span className="lucky-category text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                          ⚡ AI (ChatGPT, Claude)
                        </span>
                        <span className="lucky-category text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                          🎨 Canva & Adobe
                        </span>
                        <span className="lucky-category text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                          🎬 Streaming
                        </span>
                        <span className="lucky-category text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                          🛡️ VPN & Security
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Big Unlock Button */}
                <div className="w-full max-w-sm">
                  <button
                    onClick={handleUnlockDiscount}
                    disabled={isUnlocking}
                    className="lucky-unlock-button w-full relative group overflow-hidden rounded-2xl p-0.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  >
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 font-bold text-sm md:text-base text-primary-foreground transition">
                      <Zap className={`h-4 w-4 ${isUnlocking ? "animate-spin" : "animate-pulse text-yellow-300"}`} />
                      <span>{isUnlocking ? "ভাউচার জেনারেট হচ্ছে..." : uiConfig.button_text}</span>
                    </div>
                  </button>

                  <p className="mt-2.5 text-[11px] text-muted-foreground">
                    🔒 প্রতিটি কাস্টমারের জন্য ১ বার ব্যবহারযোগ্য ইউনিক সার্ভার ভাউচার
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

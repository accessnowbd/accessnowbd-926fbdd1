import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type WelcomeBannerData = {
  enabled?: boolean;
  title?: string;
  message?: string;
  emoji?: string;
  bg_from?: string;
  bg_to?: string;
  text_color?: string;
  icon_bg?: string;
  dismissible?: boolean;
  version?: number;
};

const DEFAULTS: Required<WelcomeBannerData> = {
  enabled: true,
  title: "স্বাগতম AccessNow BD-তে!",
  message: "সেরা দামে প্রিমিয়াম সাবস্ক্রিপশন উপভোগ করুন। যেকোনো সাহায্যের জন্য আমাদের সাপোর্ট টিম ২৪/৭ আছে।",
  emoji: "👋",
  bg_from: "#8b5cf6",
  bg_to: "#ec4899",
  text_color: "#ffffff",
  icon_bg: "rgba(255,255,255,0.2)",
  dismissible: true,
  version: 1,
};

export function WelcomeBanner() {
  const [data, setData] = useState<Required<WelcomeBannerData> | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("admin_records")
        .select("data,is_active")
        .eq("kind", "welcome_banner")
        .limit(1);
      const row = rows?.[0];
      if (!row || row.is_active === false) return setData(null);
      const merged = { ...DEFAULTS, ...((row.data ?? {}) as WelcomeBannerData) };
      setData(merged);
      const key = `welcome_banner_dismissed_v${merged.version}`;
      if (typeof window !== "undefined" && localStorage.getItem(key) === "1") {
        setDismissed(true);
      }
    })();
  }, []);

  if (!data || !data.enabled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`welcome_banner_dismissed_v${data.version}`, "1");
    } catch {}
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-lg border border-white/20"
      style={{
        background: `linear-gradient(135deg, ${data.bg_from}, ${data.bg_to})`,
        color: data.text_color,
      }}
    >
      {/* Decorative sparkles */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20" style={{ background: "white" }} />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10" style={{ background: "white" }} />
      <Sparkles className="absolute top-3 right-14 w-4 h-4 opacity-40" />
      <Sparkles className="absolute bottom-4 left-1/3 w-3 h-3 opacity-30" />

      <div className="relative flex items-start gap-4 p-4 md:p-5">
        <div
          className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl grid place-items-center text-2xl md:text-3xl backdrop-blur-sm"
          style={{ background: data.icon_bg }}
        >
          {data.emoji}
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-extrabold text-base md:text-lg leading-tight">
            {data.title}
          </h3>
          {data.message && (
            <p className="mt-1 text-xs md:text-sm opacity-95 leading-relaxed">
              {data.message}
            </p>
          )}
        </div>
        {data.dismissible && (
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/20 transition"
            style={{ color: data.text_color }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BannerData = {
  category?: string;
  title?: string;
  subtitle?: string;
  price_text?: string;
  color_preset?: BannerPaletteKey;
  cta?: string;
  link?: string;
  secondary_cta?: string;
  secondary_link?: string;
  image_url?: string;
  bg_color?: string;
  accent_color?: string;
  delivery_text?: string;
  support_text?: string;
  rating_text?: string;
};

type BannerRow = {
  id: string;
  is_active: boolean;
  sort_order: number;
  data: BannerData;
};

type BannerPaletteKey = keyof typeof BANNER_PALETTES;

const BANNER_PALETTES = {
  ruby: { bg: "#31070b", accent: "#ffcc00", name: "Ruby Gold" },
  ocean: { bg: "#061f3d", accent: "#ff6b35", name: "Ocean Orange" },
  violet: { bg: "#210b46", accent: "#00f5d4", name: "Violet Mint" },
  emerald: { bg: "#063326", accent: "#ff4d8d", name: "Emerald Pink" },
  graphite: { bg: "#111318", accent: "#38bdf8", name: "Graphite Sky" },
  indigo: { bg: "#10124a", accent: "#facc15", name: "Indigo Yellow" },
} as const;

const PALETTE_KEYS = Object.keys(BANNER_PALETTES) as BannerPaletteKey[];

const FALLBACK: BannerRow[] = [
  {
    id: "fallback-netflix",
    is_active: true,
    sort_order: 0,
    data: {
      color_preset: "ruby",
      category: "STREAMING · DIGITAL",
      title: "Netflix Premium Subscription",
      subtitle: "অ্যাড-ফ্রি স্ট্রিমিং উপভোগ করুন — মাত্র ৳350 থেকে",
      cta: "এখনই কিনুন",
      link: "/streaming",
      secondary_cta: "Details",
      secondary_link: "/streaming",
      image_url: "",
      delivery_text: "Instant",
      support_text: "24/7",
      rating_text: "4.9 ★",
    },
  },
  {
    id: "fallback-windows",
    is_active: true,
    sort_order: 1,
    data: {
      color_preset: "ocean",
      category: "SOFTWARE · DIGITAL",
      title: "Windows 10/11 Pro — Upgrade Now",
      subtitle: "সেরা দামে অরিজিনাল Windows 11 Pro কিনুন — মাত্র ৳450",
      cta: "এখনই কিনুন",
      link: "/products",
      secondary_cta: "Details",
      secondary_link: "/products",
      image_url: "",
      delivery_text: "Instant",
      support_text: "24/7",
      rating_text: "4.9 ★",
    },
  },
  {
    id: "fallback-eid",
    is_active: true,
    sort_order: 2,
    data: {
      color_preset: "violet",
      category: "PREMIUM · DIGITAL",
      title: "Eid Digital Subscription ৫০-১০০৳ Discount RxBEiD001",
      subtitle: "RxB Premium Store ঈদ স্পেশাল অফার",
      cta: "অর্ডার করুন",
      link: "/products",
      secondary_cta: "Details",
      secondary_link: "/products",
      image_url: "",
      delivery_text: "Instant",
      support_text: "24/7",
      rating_text: "4.9 ★",
    },
  },
  {
    id: "fallback-ai",
    is_active: true,
    sort_order: 3,
    data: {
      color_preset: "emerald",
      category: "AI TOOLS · DIGITAL",
      title: "ChatGPT Plus & Claude Pro",
      subtitle: "সেরা AI সাবস্ক্রিপশন এক জায়গায় — মাত্র ৳800 থেকে",
      cta: "এখনই কিনুন",
      link: "/ai-tools",
      secondary_cta: "Details",
      secondary_link: "/ai-tools",
      image_url: "",
      delivery_text: "Instant",
      support_text: "24/7",
      rating_text: "4.9 ★",
    },
  },
];

export function HeroBannerCarousel() {
  const [rows, setRows] = useState<BannerRow[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("admin_records")
      .select("id, is_active, sort_order, data")
      .eq("kind", "banner_slider")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!mounted) return;
        const list = (data ?? []) as BannerRow[];
        setRows(list);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const banners = rows.length ? rows : FALLBACK;
  const current = banners[active] ?? banners[0];

  useEffect(() => {
    if (banners.length < 2) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  const accent = current.data.accent_color || "#e50914";
  const bg = current.data.bg_color || "#3a0a0a";

  const gradient = useMemo(
    () =>
      [
        // very subtle top vignette for depth
        `radial-gradient(ellipse 100% 60% at 50% 0%, ${mix(bg, "#ffffff", 0.08)} 0%, transparent 70%)`,
        // bottom-edge darkening for grounding
        `radial-gradient(ellipse 120% 50% at 50% 100%, ${mix(bg, "#000000", 0.55)} 0%, transparent 70%)`,
        // mostly uniform deep base — single dominant tone
        `linear-gradient(180deg, ${bg} 0%, ${mix(bg, "#000000", 0.25)} 100%)`,
      ].join(", "),
    [bg],
  );

  const go = (dir: 1 | -1) =>
    setActive((i) => (i + dir + banners.length) % banners.length);

  return (
    <section className="px-4 md:px-10 pt-6 pb-4">
      <div className="relative mx-auto max-w-[1280px]">
        <div
          className="relative overflow-hidden rounded-[32px] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
          style={{ background: gradient, minHeight: 440 }}
        >
          <div className="grid items-center gap-8 px-6 py-10 md:grid-cols-2 md:gap-10 md:px-12 md:py-14">
            {/* LEFT */}
            <div className="space-y-5 text-white">
              {current.data.category && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 backdrop-blur-md">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: accent }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
                    {current.data.category}
                  </span>
                </div>
              )}

              <h1
                className="font-extrabold tracking-tight"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 4.2vw, 52px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {current.data.title}
              </h1>

              {current.data.subtitle && (
                <p className="max-w-xl text-sm md:text-base text-white/80 leading-relaxed">
                  {current.data.subtitle}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                {current.data.cta && (
                  <Link
                    to={(current.data.link || "/products") as string}
                    className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:-translate-y-0.5"
                    style={{
                      background: accent,
                      boxShadow: `0 14px 30px -10px ${hexAlpha(accent, 0.6)}`,
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {current.data.cta}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                )}
                {current.data.secondary_cta && (
                  <Link
                    to={(current.data.secondary_link || "/products") as string}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10"
                  >
                    {current.data.secondary_cta}
                  </Link>
                )}
              </div>

              <div className="grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-5">
                <Stat label="DELIVERY" value={current.data.delivery_text || "Instant"} />
                <Stat label="SUPPORT" value={current.data.support_text || "24/7"} />
                <Stat label="RATING" value={current.data.rating_text || "4.9 ★"} />
              </div>
            </div>

            {/* RIGHT — image card with contrasting accent frame */}
            <div className="relative">
              {/* outer accent glow halo */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-4 rounded-[28px] opacity-60 blur-2xl"
                style={{ background: `radial-gradient(ellipse at center, ${hexAlpha(accent, 0.55)} 0%, transparent 70%)` }}
              />
              {/* accent gradient border via padding wrapper */}
              <div
                className="relative rounded-2xl p-[2px]"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${hexAlpha(accent, 0.25)} 50%, ${accent} 100%)`,
                  boxShadow: `0 0 40px -8px ${hexAlpha(accent, 0.55)}, 0 20px 60px -15px rgba(0,0,0,0.55)`,
                }}
              >
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px]"
                  style={{ background: mix(bg, "#000000", 0.2) }}
                >
                  {current.data.image_url ? (
                    <img
                      src={current.data.image_url}
                      alt={current.data.title ?? "banner"}
                      loading="eager"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-white/40 text-sm">
                      No image
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-5 left-6 flex items-center gap-1.5 md:left-12">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === active ? 28 : 8,
                    background: i === active ? accent : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Arrows */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 md:right-8">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/15"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/15"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
        {label}
      </div>
      <div className="mt-1 text-base font-extrabold text-white">{value}</div>
    </div>
  );
}

function hexAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return `rgba(229,9,20,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return [r, g, b];
}

function mix(a: string, b: string, t: number) {
  const A = parseHex(a) ?? [0, 0, 0];
  const B = parseHex(b) ?? [0, 0, 0];
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

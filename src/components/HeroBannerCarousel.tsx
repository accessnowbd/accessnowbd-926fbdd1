import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BgStyle = "aurora" | "spotlight" | "mesh" | "nebula";
type OverlayIntensity = "low" | "medium" | "high";

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
  glow_color?: string;
  bg_style?: BgStyle;
  overlay_intensity?: OverlayIntensity;
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
  ruby:     { bg: "#1a0408", accent: "#ff1f3a", glow: "#ff6b8a", name: "Ruby" },
  ocean:    { bg: "#03102a", accent: "#3b9dff", glow: "#7dd3fc", name: "Ocean" },
  violet:   { bg: "#150634", accent: "#a855f7", glow: "#e879f9", name: "Violet" },
  emerald:  { bg: "#03241b", accent: "#14e8a4", glow: "#5eead4", name: "Emerald" },
  graphite: { bg: "#0a0c12", accent: "#38bdf8", glow: "#a5b4fc", name: "Graphite" },
  indigo:   { bg: "#080a3a", accent: "#facc15", glow: "#fde68a", name: "Indigo" },
  spotify:  { bg: "#02160c", accent: "#1ed760", glow: "#86efac", name: "Spotify Green" },
  canva:    { bg: "#0a0a3a", accent: "#7c5cff", glow: "#22d3ee", name: "Canva Blue/Purple" },
  eid:      { bg: "#1b0633", accent: "#f43f95", glow: "#fbbf24", name: "Eid Festive" },
  sunset:   { bg: "#2a0612", accent: "#ff7a45", glow: "#fbbf24", name: "Sunset" },
} as const;

const PALETTE_KEYS = Object.keys(BANNER_PALETTES) as BannerPaletteKey[];

const FALLBACK: BannerRow[] = [
  {
    id: "fallback-netflix", is_active: true, sort_order: 0,
    data: {
      color_preset: "ruby", bg_style: "spotlight",
      category: "STREAMING · DIGITAL",
      title: "Netflix Premium Subscription",
      subtitle: "অ্যাড-ফ্রি স্ট্রিমিং উপভোগ করুন — মাত্র ৳350 থেকে",
      cta: "এখনই কিনুন", link: "/streaming",
      secondary_cta: "Details", secondary_link: "/streaming",
      delivery_text: "Instant", support_text: "24/7", rating_text: "4.9 ★",
    },
  },
  {
    id: "fallback-spotify", is_active: true, sort_order: 1,
    data: {
      color_preset: "spotify", bg_style: "aurora",
      category: "MUSIC · DIGITAL",
      title: "Spotify Premium Family",
      subtitle: "অ্যাড-ফ্রি মিউজিক ৬ জন ব্যবহারকারীর জন্য — মাত্র ৳299",
      cta: "এখনই কিনুন", link: "/products",
      secondary_cta: "Details", secondary_link: "/products",
      delivery_text: "Instant", support_text: "24/7", rating_text: "4.9 ★",
    },
  },
  {
    id: "fallback-eid", is_active: true, sort_order: 2,
    data: {
      color_preset: "eid", bg_style: "nebula",
      category: "PREMIUM · DIGITAL",
      title: "Eid Digital Subscription ৫০-১০০৳ Discount RxBEiD001",
      subtitle: "RxB Premium Store ঈদ স্পেশাল অফার",
      cta: "অর্ডার করুন", link: "/products",
      secondary_cta: "Details", secondary_link: "/products",
      delivery_text: "Instant", support_text: "24/7", rating_text: "4.9 ★",
    },
  },
  {
    id: "fallback-canva", is_active: true, sort_order: 3,
    data: {
      color_preset: "canva", bg_style: "mesh",
      category: "DESIGN · DIGITAL",
      title: "Canva Pro Subscription",
      subtitle: "প্রিমিয়াম ডিজাইন টুলস — মাত্র ৳450 থেকে",
      cta: "এখনই কিনুন", link: "/products",
      secondary_cta: "Details", secondary_link: "/products",
      delivery_text: "Instant", support_text: "24/7", rating_text: "4.9 ★",
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
        setRows((data ?? []) as BannerRow[]);
      });
    return () => { mounted = false; };
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

  const fallbackPalette = BANNER_PALETTES[PALETTE_KEYS[active % PALETTE_KEYS.length]];
  const selectedPalette = current.data.color_preset
    ? BANNER_PALETTES[current.data.color_preset] ?? fallbackPalette
    : fallbackPalette;

  const bg = current.data.bg_color || selectedPalette.bg;
  const accent = current.data.accent_color || selectedPalette.accent;
  const glow = current.data.glow_color || selectedPalette.glow;
  const style: BgStyle = current.data.bg_style || "spotlight";
  const intensity: OverlayIntensity = current.data.overlay_intensity || "medium";

  const intensityMul = intensity === "low" ? 0.65 : intensity === "high" ? 1.35 : 1;

  // Cinematic layered background — multiple radial glows + linear depth
  const background = useMemo(() => {
    const a = (n: number) => Math.min(0.95, n * intensityMul);
    const base = `linear-gradient(135deg, ${mix(bg, "#000", 0.05)} 0%, ${bg} 45%, ${mix(bg, "#000", 0.55)} 100%)`;
    switch (style) {
      case "aurora":
        return [
          `radial-gradient(ellipse 70% 60% at 10% 10%, ${hexAlpha(accent, a(0.55))} 0%, transparent 55%)`,
          `radial-gradient(ellipse 60% 55% at 90% 20%, ${hexAlpha(glow, a(0.45))} 0%, transparent 60%)`,
          `radial-gradient(ellipse 80% 50% at 50% 110%, ${hexAlpha(accent, a(0.4))} 0%, transparent 65%)`,
          base,
        ].join(", ");
      case "mesh":
        return [
          `radial-gradient(circle at 20% 30%, ${hexAlpha(accent, a(0.5))} 0%, transparent 40%)`,
          `radial-gradient(circle at 80% 20%, ${hexAlpha(glow, a(0.4))} 0%, transparent 45%)`,
          `radial-gradient(circle at 70% 90%, ${hexAlpha(accent, a(0.45))} 0%, transparent 45%)`,
          `radial-gradient(circle at 10% 80%, ${hexAlpha(glow, a(0.35))} 0%, transparent 45%)`,
          base,
        ].join(", ");
      case "nebula":
        return [
          `radial-gradient(ellipse 90% 70% at 30% 50%, ${hexAlpha(glow, a(0.5))} 0%, transparent 55%)`,
          `radial-gradient(ellipse 70% 60% at 80% 70%, ${hexAlpha(accent, a(0.6))} 0%, transparent 60%)`,
          `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,255,255,${a(0.08)}) 0%, transparent 70%)`,
          base,
        ].join(", ");
      case "spotlight":
      default:
        return [
          `radial-gradient(ellipse 65% 75% at 85% 50%, ${hexAlpha(accent, a(0.55))} 0%, transparent 55%)`,
          `radial-gradient(ellipse 50% 60% at 15% 25%, ${hexAlpha(glow, a(0.28))} 0%, transparent 60%)`,
          `radial-gradient(ellipse 90% 30% at 50% 0%, rgba(255,255,255,${a(0.06)}) 0%, transparent 70%)`,
          base,
        ].join(", ");
    }
  }, [bg, accent, glow, style, intensityMul]);

  const go = (dir: 1 | -1) =>
    setActive((i) => (i + dir + banners.length) % banners.length);

  return (
    <section className="px-4 md:px-10 pt-6 pb-4">
      <div className="relative mx-auto max-w-[1280px]">
        <div
          className="group/banner relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)] transition-all duration-700"
          style={{ background, minHeight: 430 }}
        >
          {/* Floating blur orbs for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl animate-pulse"
            style={{ background: hexAlpha(accent, 0.45 * intensityMul), animationDuration: "6s" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full opacity-55 blur-3xl animate-pulse"
            style={{ background: hexAlpha(glow, 0.4 * intensityMul), animationDuration: "8s", animationDelay: "1.5s" }}
          />

          {/* Subtle grid / noise overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 80%)",
            }}
          />

          {/* Top glass sheen */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${hexAlpha("#ffffff", 0.35)}, transparent)` }}
          />

          <div className="relative grid items-center gap-7 px-5 py-10 md:grid-cols-2 md:gap-10 md:px-12 md:py-14">
            {/* LEFT */}
            <div className="space-y-5 text-white">
              {current.data.category && (
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-md"
                  style={{
                    borderColor: hexAlpha(accent, 0.4),
                    background: `linear-gradient(135deg, ${hexAlpha(accent, 0.18)}, ${hexAlpha("#ffffff", 0.05)})`,
                    boxShadow: `0 0 24px -6px ${hexAlpha(accent, 0.45)}`,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                    {current.data.category}
                  </span>
                </div>
              )}

              <h1
                className="font-extrabold tracking-tight text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(28px, 4.4vw, 56px)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.02em",
                  textShadow: `0 6px 30px ${hexAlpha("#000", 0.35)}`,
                }}
              >
                {current.data.title}
              </h1>

              {current.data.subtitle && (
                <p className="max-w-xl text-sm md:text-base text-white/85 leading-relaxed">
                  {current.data.subtitle}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                {current.data.cta && (
                  <Link
                    to={(current.data.link || "/products") as string}
                    className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${mix(accent, glow, 0.4)})`,
                      boxShadow: `0 18px 40px -12px ${hexAlpha(accent, 0.75)}, inset 0 1px 0 ${hexAlpha("#fff", 0.3)}`,
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
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15 hover:border-white/40"
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

            {/* RIGHT — premium glass image card */}
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 rounded-[28px] opacity-80 blur-3xl"
                style={{ background: `radial-gradient(ellipse at center, ${hexAlpha(accent, 0.55)} 0%, ${hexAlpha(glow, 0.25)} 45%, transparent 75%)` }}
              />
              <div
                className="relative rounded-[24px] p-[2px] transition-transform duration-500 hover:scale-[1.015]"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${hexAlpha(glow, 0.5)} 50%, ${accent} 100%)`,
                  boxShadow: `0 0 60px -12px ${hexAlpha(accent, 0.7)}, 0 30px 80px -20px rgba(0,0,0,0.7)`,
                }}
              >
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] backdrop-blur-xl"
                  style={{
                    background: `linear-gradient(135deg, ${hexAlpha("#ffffff", 0.08)}, ${hexAlpha("#000000", 0.35)}), linear-gradient(135deg, ${mix(bg, "#fff", 0.04)}, ${mix(bg, "#000", 0.3)})`,
                  }}
                >
                  {/* glass top highlight */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
                    style={{ background: `linear-gradient(180deg, ${hexAlpha("#ffffff", 0.12)}, transparent)` }}
                  />
                  {current.data.image_url ? (
                    <img
                      src={current.data.image_url}
                      alt={current.data.title ?? "banner"}
                      loading="eager"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center px-10 text-center">
                      <div
                        className="flex aspect-square w-36 items-center justify-center rounded-[28px] text-5xl font-black text-white md:w-44 md:text-6xl"
                        style={{
                          background: `linear-gradient(135deg, ${accent}, ${mix(accent, glow, 0.5)})`,
                          boxShadow: `0 25px 55px -18px ${hexAlpha(accent, 0.95)}, inset 0 1px 0 ${hexAlpha("#fff", 0.3)}`,
                        }}
                      >
                        {current.data.title?.slice(0, 1) ?? "A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-5 left-6 z-10 flex items-center gap-1.5 md:left-12">
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
                    boxShadow: i === active ? `0 0 12px ${hexAlpha(accent, 0.7)}` : undefined,
                  }}
                />
              ))}
            </div>
          )}

          {/* Arrows */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 md:right-8">
              <button
                type="button" onClick={() => go(-1)} aria-label="Previous"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/15 hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button" onClick={() => go(1)} aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/5 text-white backdrop-blur-md transition hover:bg-white/15 hover:scale-105"
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
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{label}</div>
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

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
  min_height?: number;
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
  eid:      { bg: "#04140d", accent: "#d4af37", glow: "#10b981", name: "Eid Royal Gold" },
  sunset:   { bg: "#2a0612", accent: "#ff7a45", glow: "#fbbf24", name: "Sunset" },
} as const;

const PALETTE_KEYS = Object.keys(BANNER_PALETTES) as BannerPaletteKey[];

// Brand auto-detection — match keywords in banner title to a brand palette + product slug.
// Each brand has its own real signature color so the background takes on the product's identity.
type BrandDef = { keywords: string[]; slug?: string; bg: string; accent: string; glow: string };
const BRANDS: BrandDef[] = [
  { keywords: ["netflix"],            slug: "netflix-premium",      bg: "#1a0408", accent: "#e50914", glow: "#ff4d6a" },
  { keywords: ["spotify"],            slug: "spotify-premium",      bg: "#03160c", accent: "#1ed760", glow: "#86efac" },
  { keywords: ["youtube"],            slug: "youtube-premium",      bg: "#1a0606", accent: "#ff0033", glow: "#ff7a90" },
  { keywords: ["prime video", "amazon"], slug: "amazon-prime-video", bg: "#03152a", accent: "#00a8e1", glow: "#7dd3fc" },
  { keywords: ["canva"],              slug: "canva-pro",            bg: "#0a0a3a", accent: "#7c5cff", glow: "#22d3ee" },
  { keywords: ["chatgpt", "openai"],  slug: "chatgpt-plus",         bg: "#04201a", accent: "#10a37f", glow: "#5eead4" },
  { keywords: ["perplexity"],         slug: "perplexity-pro",       bg: "#021820", accent: "#20b8cd", glow: "#67e8f9" },
  { keywords: ["adobe", "creative cloud"], slug: "adobe-creative-cloud", bg: "#1a0303", accent: "#fa0f00", glow: "#ff6b6b" },
  { keywords: ["grammarly"],          slug: "grammarly-premium",    bg: "#04241c", accent: "#15c39a", glow: "#86efac" },
  { keywords: ["quillbot"],           slug: "quillbot-premium",     bg: "#04201c", accent: "#11a683", glow: "#5eead4" },
  { keywords: ["capcut"],             slug: "capcut-pro",           bg: "#0a0118", accent: "#ff3b5c", glow: "#a78bfa" },
  { keywords: ["coursera"],           slug: "coursera-plus",        bg: "#020e2a", accent: "#0056d3", glow: "#60a5fa" },
  { keywords: ["nordvpn", "nord"],    slug: "nordvpn",              bg: "#020a24", accent: "#4687ff", glow: "#93c5fd" },
  { keywords: ["surfshark"],          slug: "surfshark-vpn",        bg: "#020a24", accent: "#1ee696", glow: "#86efac" },
  { keywords: ["expressvpn", "express"], slug: "expressvpn",        bg: "#1a0408", accent: "#da3940", glow: "#ff8080" },
  { keywords: ["windows 11", "windows 10", "windows"], slug: "windows-11-pro", bg: "#03102a", accent: "#0078d4", glow: "#7dd3fc" },
  { keywords: ["office 365", "office", "microsoft"], slug: "office-365", bg: "#1a0808", accent: "#d83b01", glow: "#fb923c" },
  { keywords: ["apple", "itunes", "app store"], slug: "itunes-giftcard", bg: "#0a0a0a", accent: "#a3a3a3", glow: "#e5e5e5" },
  { keywords: ["eid", "ঈদ", "qurbani", "কোরবানি"],                  bg: "#04140d", accent: "#d4af37", glow: "#10b981" },
];

function detectBrand(title?: string): BrandDef | null {
  if (!title) return null;
  const t = title.toLowerCase();
  for (const b of BRANDS) if (b.keywords.some((k) => t.includes(k))) return b;
  return null;
}

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
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [productsLoaded, setProductsLoaded] = useState(false);
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
    supabase
      .from("products")
      .select("slug, image_url")
      .eq("is_active", true)
      .then(({ data }) => {
        if (!mounted) return;
        const map: Record<string, string> = {};
        for (const p of (data ?? []) as { slug: string; image_url: string }[]) {
          if (p.slug && p.image_url) map[p.slug] = p.image_url;
        }
        setProductMap(map);
        setProductsLoaded(true);
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

  // Auto-detect brand from banner title — drives both colors and product image
  const brand = useMemo(() => detectBrand(current.data.title), [current.data.title]);
  const fallbackPalette = BANNER_PALETTES[PALETTE_KEYS[active % PALETTE_KEYS.length]];
  const selectedPalette = current.data.color_preset
    ? BANNER_PALETTES[current.data.color_preset] ?? fallbackPalette
    : fallbackPalette;

  // Priority: explicit custom color > detected brand > preset > fallback
  const bg = current.data.bg_color || brand?.bg || selectedPalette.bg;
  const accent = current.data.accent_color || brand?.accent || selectedPalette.accent;
  const glow = current.data.glow_color || brand?.glow || selectedPalette.glow;
  const style: BgStyle = current.data.bg_style || "spotlight";
  const intensity: OverlayIntensity = current.data.overlay_intensity || "medium";

  // Resolve image: explicit URL > product's image by brand slug
  const resolvedImage = current.data.image_url || (brand?.slug ? productMap[brand.slug] : undefined);

  // Eid / Qurbani detection — adds festive overlay (crescent, mosque, lanterns, sparkles)
  const isEid = useMemo(() => {
    const t = (current.data.title || "") + " " + (current.data.category || "") + " " + (current.data.subtitle || "");
    return /eid|ঈদ|qurbani|কোরবানি/i.test(t);
  }, [current.data.title, current.data.category, current.data.subtitle]);

  const intensityMul = intensity === "low" ? 0.65 : intensity === "high" ? 1.35 : 1;


  // Glass + Brand Glow — deep neutral glass base with soft brand-tinted edge glows.
  // The product card sits on top of a clean frosted surface; the brand color only
  // breathes through the corners and an inner rim so it harmonises without overpowering.
  const background = useMemo(() => {
    const a = (n: number) => Math.min(0.95, n * intensityMul);
    // Deep glassy neutral base, very lightly tinted by the brand color
    const deep = mix(bg, "#0a0d18", 0.55);
    const tinted = mix(deep, accent, 0.10);
    const base = `linear-gradient(140deg, ${mix(tinted, "#ffffff", 0.04)} 0%, ${deep} 55%, ${mix(deep, accent, 0.14)} 100%)`;

    // Style-specific glow placement, but always the same calm glass recipe
    const glowLayers = (() => {
      switch (style) {
        case "aurora":
          return [
            `radial-gradient(ellipse 55% 50% at 12% 8%, ${hexAlpha(accent, a(0.32))} 0%, transparent 60%)`,
            `radial-gradient(ellipse 50% 45% at 88% 18%, ${hexAlpha(glow, a(0.26))} 0%, transparent 65%)`,
            `radial-gradient(ellipse 70% 40% at 50% 115%, ${hexAlpha(accent, a(0.22))} 0%, transparent 70%)`,
          ];
        case "mesh":
          return [
            `radial-gradient(circle at 18% 28%, ${hexAlpha(accent, a(0.28))} 0%, transparent 45%)`,
            `radial-gradient(circle at 82% 22%, ${hexAlpha(glow, a(0.24))} 0%, transparent 50%)`,
            `radial-gradient(circle at 72% 88%, ${hexAlpha(accent, a(0.22))} 0%, transparent 50%)`,
          ];
        case "nebula":
          return [
            `radial-gradient(ellipse 75% 55% at 28% 50%, ${hexAlpha(glow, a(0.28))} 0%, transparent 60%)`,
            `radial-gradient(ellipse 60% 50% at 82% 72%, ${hexAlpha(accent, a(0.32))} 0%, transparent 62%)`,
          ];
        case "spotlight":
        default:
          return [
            `radial-gradient(ellipse 60% 65% at 88% 50%, ${hexAlpha(accent, a(0.30))} 0%, transparent 60%)`,
            `radial-gradient(ellipse 45% 50% at 12% 22%, ${hexAlpha(glow, a(0.18))} 0%, transparent 65%)`,
          ];
      }
    })();

    // Top frosted sheen — gives the glass surface its highlight
    const sheen = `linear-gradient(180deg, ${hexAlpha("#ffffff", 0.06)} 0%, transparent 35%, transparent 100%)`;

    return [sheen, ...glowLayers, base].join(", ");
  }, [bg, accent, glow, style, intensityMul]);


  const go = (dir: 1 | -1) =>
    setActive((i) => (i + dir + banners.length) % banners.length);

  return (
    <section className="px-4 md:px-10 pt-6 pb-4">
      <div className="relative mx-auto max-w-[1280px]">
        <div
          className="force-dark-canvas group/banner banner-fast relative overflow-hidden rounded-[28px] border border-white/15 backdrop-blur-xl transition-colors duration-500"
          style={{
            background,
            minHeight: Math.max(240, Math.min(900, Number(current.data.min_height) || 430)),
            boxShadow: `0 30px 80px -30px ${hexAlpha(accent, 0.35)}, 0 8px 32px -12px ${hexAlpha(glow, 0.22)}, inset 0 1px 0 ${hexAlpha("#ffffff", 0.14)}, inset 0 0 0 1px ${hexAlpha(accent, 0.12)}, inset 0 0 60px ${hexAlpha(accent, 0.08)}`,
          }}
        >
          {/* Static soft glows for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-2xl"
            style={{ background: hexAlpha(accent, 0.35 * intensityMul) }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full opacity-45 blur-2xl"
            style={{ background: hexAlpha(glow, 0.3 * intensityMul) }}
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

          {/* Eid / Qurbani festive ornament layer */}
          {isEid && (
            <>
              {/* Crescent moon top-right */}
              <div aria-hidden className="pointer-events-none absolute right-6 top-6 md:right-10 md:top-8">
                <svg width="86" height="86" viewBox="0 0 100 100" className="drop-shadow-[0_0_30px_rgba(212,175,55,0.6)]">
                  <defs>
                    <radialGradient id="moonGrad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="60%" stopColor={accent} />
                      <stop offset="100%" stopColor={mix(accent, "#000", 0.4)} />
                    </radialGradient>
                  </defs>
                  <path d="M50 8 a42 42 0 1 0 30 71 a32 32 0 1 1 0 -62 a42 42 0 0 0 -30 -9 z" fill="url(#moonGrad)" opacity="0.95" />
                </svg>
              </div>

              {/* Tiny stars scattered */}
              <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                {[
                  { l: "12%", t: "18%", s: 10, d: "0s" },
                  { l: "28%", t: "8%",  s: 6,  d: "1.2s" },
                  { l: "48%", t: "14%", s: 8,  d: "0.6s" },
                  { l: "62%", t: "22%", s: 5,  d: "2s" },
                  { l: "78%", t: "55%", s: 7,  d: "1.5s" },
                  { l: "8%",  t: "62%", s: 6,  d: "0.9s" },
                  { l: "38%", t: "72%", s: 9,  d: "1.8s" },
                  { l: "92%", t: "30%", s: 5,  d: "0.3s" },
                ].map((st, i) => (
                  <div
                    key={i}
                    className="absolute animate-pulse"
                    style={{
                      left: st.l, top: st.t, width: st.s, height: st.s,
                      animationDuration: "2.4s", animationDelay: st.d,
                      background: `radial-gradient(circle, ${accent} 0%, ${hexAlpha(accent, 0.5)} 50%, transparent 70%)`,
                      borderRadius: "50%",
                      boxShadow: `0 0 ${st.s * 2}px ${hexAlpha(accent, 0.8)}`,
                    }}
                  />
                ))}
              </div>

              {/* Mosque silhouette bottom band */}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 md:h-32 opacity-25">
                <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="h-full w-full">
                  <defs>
                    <linearGradient id="mosqueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity="0" />
                      <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,160 L0,120 L60,120 L60,90 Q60,70 80,70 Q100,70 100,90 L100,120 L160,120 L160,100 L180,100 L180,60 Q180,40 200,40 L200,20 Q210,10 220,20 L220,40 Q240,40 240,60 L240,100 L260,100 L260,120 L340,120 L340,95 Q340,75 360,75 Q380,75 380,95 L380,120 L460,120 L460,100 L480,100 L480,55 Q480,30 500,30 L500,10 Q512,0 524,10 L524,30 Q544,30 544,55 L544,100 L564,100 L564,120 L660,120 L660,90 Q660,70 680,70 Q700,70 700,90 L700,120 L780,120 L780,100 L800,100 L800,60 Q800,40 820,40 L820,20 Q830,10 840,20 L840,40 Q860,40 860,60 L860,100 L880,100 L880,120 L960,120 L960,95 Q960,75 980,75 Q1000,75 1000,95 L1000,120 L1080,120 L1080,100 L1100,100 L1100,55 Q1100,30 1120,30 L1120,10 Q1132,0 1144,10 L1144,30 Q1164,30 1164,55 L1164,100 L1184,100 L1184,120 L1200,120 L1200,160 Z"
                    fill="url(#mosqueGrad)"
                  />
                </svg>
              </div>

              {/* Gold ornament corner — top-left arabesque */}
              <div aria-hidden className="pointer-events-none absolute -left-4 -top-4 opacity-40">
                <svg width="160" height="160" viewBox="0 0 200 200">
                  <g fill="none" stroke={accent} strokeWidth="1.2" opacity="0.7">
                    <circle cx="40" cy="40" r="56" />
                    <circle cx="40" cy="40" r="42" />
                    <circle cx="40" cy="40" r="28" />
                    <path d="M40 -16 L40 96 M-16 40 L96 40 M0 0 L80 80 M80 0 L0 80" strokeOpacity="0.4" />
                  </g>
                </svg>
              </div>

              {/* Hanging lantern — left mid */}
              <div aria-hidden className="pointer-events-none absolute left-8 top-1/2 hidden -translate-y-1/2 md:block" style={{ animation: "swing 4s ease-in-out infinite" }}>
                <svg width="44" height="80" viewBox="0 0 44 80">
                  <line x1="22" y1="0" x2="22" y2="16" stroke={accent} strokeWidth="1" opacity="0.6" />
                  <path d="M14 16 L30 16 L30 20 L14 20 Z" fill={accent} opacity="0.85" />
                  <path d="M10 22 Q22 18 34 22 L32 54 Q22 60 12 54 Z" fill={hexAlpha(accent, 0.25)} stroke={accent} strokeWidth="1.2" />
                  <circle cx="22" cy="38" r="6" fill={glow} opacity="0.9" style={{ filter: `drop-shadow(0 0 8px ${glow})` }} />
                  <path d="M14 56 L30 56 L28 62 L16 62 Z" fill={accent} opacity="0.85" />
                  <line x1="22" y1="62" x2="22" y2="72" stroke={accent} strokeWidth="1" opacity="0.6" />
                  <circle cx="22" cy="74" r="3" fill={accent} />
                </svg>
              </div>

              <style>{`@keyframes swing { 0%,100% { transform: translateY(-50%) rotate(-4deg); } 50% { transform: translateY(-50%) rotate(4deg); } }`}</style>
            </>
          )}

          <div className="relative grid items-center gap-7 px-5 py-10 md:grid-cols-2 md:gap-10 md:px-12 md:py-14">
            {/* LEFT */}
            <div className="space-y-5 text-white">
              {current.data.category && (
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5"
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
                className="font-extrabold tracking-tight text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                style={{
                  fontFamily: "var(--font-display)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.02em",
                  textShadow: `0 1px 2px ${hexAlpha("#000", 0.18)}, 0 0 40px ${hexAlpha(glow, 0.18)}`,
                }}
              >
                {current.data.title}
              </h1>

              {current.data.subtitle && (
                <p className="max-w-xl text-white/85 leading-relaxed text-sm md:text-base lg:text-lg">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/15 hover:border-white/40"
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
                className="pointer-events-none absolute -inset-6 rounded-[28px] opacity-55 blur-2xl"
                style={{ background: `radial-gradient(ellipse at center, ${hexAlpha(accent, 0.55)} 0%, ${hexAlpha(glow, 0.25)} 45%, transparent 75%)` }}
              />
              <div
                className="relative rounded-[24px] p-[1.5px] transition-shadow duration-300"
                style={{
                  background: `linear-gradient(135deg, ${hexAlpha("#ffffff", 0.5)} 0%, ${hexAlpha(accent, 0.6)} 35%, ${hexAlpha("#ffffff", 0.15)} 65%, ${hexAlpha(glow, 0.55)} 100%)`,
                  boxShadow: `0 0 50px -10px ${hexAlpha(accent, 0.45)}, 0 20px 60px -20px ${hexAlpha(glow, 0.35)}, inset 0 1px 0 ${hexAlpha("#ffffff", 0.3)}`,
                }}
              >
                <div
                  className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px]"
                  style={{
                    background: `linear-gradient(135deg, ${hexAlpha("#ffffff", 0.18)} 0%, ${hexAlpha("#ffffff", 0.06)} 50%, ${hexAlpha(accent, 0.1)} 100%), linear-gradient(135deg, ${hexAlpha(bg, 0.55)}, ${hexAlpha(mix(bg, accent, 0.25), 0.4)})`,
                    boxShadow: `inset 0 1px 0 ${hexAlpha("#ffffff", 0.25)}, inset 0 0 40px ${hexAlpha("#ffffff", 0.05)}`,
                  }}
                >
                  {/* glass top highlight */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-2/5"
                    style={{ background: `linear-gradient(180deg, ${hexAlpha("#ffffff", 0.22)} 0%, ${hexAlpha("#ffffff", 0.04)} 60%, transparent 100%)` }}
                  />
                  {/* diagonal glass sheen */}
                  <div aria-hidden className="pointer-events-none absolute -inset-px bg-white/[0.03]" />
                  {resolvedImage ? (
                    <div className="relative flex h-full w-full items-center justify-center p-4 md:p-6">
                      <img
                        src={resolvedImage}
                        alt={current.data.title ?? "banner"}
                        loading="eager"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : isEid ? (
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                      <img
                        src="/banners/eid-mubarak.png"
                        alt="Eid Mubarak — ঈদুল আযহার শুভেচ্ছা — Coupon ACCESSEID25"
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                    </div>

                  ) : brand?.slug && !productsLoaded ? (
                    // Products still loading — show shimmering skeleton instead of a one-letter fallback
                    <div className="grid h-full w-full place-items-center px-10">
                      <div
                        className="aspect-square w-36 animate-pulse rounded-[28px] md:w-44"
                        style={{
                          background: `linear-gradient(135deg, ${hexAlpha(accent, 0.35)}, ${hexAlpha(glow, 0.2)})`,
                          boxShadow: `0 25px 55px -18px ${hexAlpha(accent, 0.55)}, inset 0 1px 0 ${hexAlpha("#fff", 0.15)}`,
                        }}
                      />
                    </div>
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
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/15"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button" onClick={() => go(1)} aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/15"
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

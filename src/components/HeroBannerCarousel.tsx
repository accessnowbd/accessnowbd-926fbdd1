import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ShoppingCart, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BannerData = {
  category?: string;
  title?: string;
  subtitle?: string;
  price_text?: string;
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

const FALLBACK: BannerRow[] = [
  {
    id: "fallback-netflix",
    is_active: true,
    sort_order: 0,
    data: {
      category: "STREAMING · DIGITAL",
      title: "Netflix Premium Subscription",
      subtitle: "অ্যাড-ফ্রি স্ট্রিমিং উপভোগ করুন — মাত্র ৳350 থেকে",
      cta: "এখনই কিনুন",
      link: "/streaming",
      secondary_cta: "Details",
      secondary_link: "/streaming",
      image_url: "",
      bg_color: "#3a0a0a",
      accent_color: "#e50914",
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
      category: "SOFTWARE · DIGITAL",
      title: "Windows 10/11 Pro — Upgrade Now",
      subtitle: "সেরা দামে অরিজিনাল Windows 11 Pro কিনুন — মাত্র ৳450",
      cta: "এখনই কিনুন",
      link: "/products",
      secondary_cta: "Details",
      secondary_link: "/products",
      image_url: "",
      bg_color: "#0a1a3a",
      accent_color: "#1e88ff",
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
      category: "PREMIUM · DIGITAL",
      title: "Eid Digital Subscription ৫০-১০০৳ Discount RxBEiD001",
      subtitle: "RxB Premium Store ঈদ স্পেশাল অফার",
      cta: "অর্ডার করুন",
      link: "/products",
      secondary_cta: "Details",
      secondary_link: "/products",
      image_url: "",
      bg_color: "#1a0a3a",
      accent_color: "#8b5cf6",
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
      category: "AI TOOLS · DIGITAL",
      title: "ChatGPT Plus & Claude Pro",
      subtitle: "সেরা AI সাবস্ক্রিপশন এক জায়গায় — মাত্র ৳800 থেকে",
      cta: "এখনই কিনুন",
      link: "/ai-tools",
      secondary_cta: "Details",
      secondary_link: "/ai-tools",
      image_url: "",
      bg_color: "#0a2a1f",
      accent_color: "#10b981",
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
        // top-left soft glow
        `radial-gradient(ellipse 60% 70% at 15% 20%, ${hexAlpha(accent, 0.55)} 0%, transparent 60%)`,
        // bottom-right accent glow
        `radial-gradient(ellipse 50% 60% at 90% 95%, ${hexAlpha(accent, 0.35)} 0%, transparent 65%)`,
        // top sheen
        `radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)`,
        // base depth: bg → mid → near-black
        `linear-gradient(135deg, ${bg} 0%, ${mix(bg, "#000000", 0.45)} 60%, #050505 100%)`,
      ].join(", "),
    [accent, bg],
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

            {/* RIGHT — image card */}
            <div className="relative">
              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.45)]"
                style={{
                  boxShadow: `0 0 0 1px ${hexAlpha(accent, 0.25)}, 0 20px 50px -15px rgba(0,0,0,0.45)`,
                }}
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Headphones,
  MonitorSmartphone,
  Palette,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { LazyMount } from "@/components/LazyMount";
import type { Product } from "@/data/products";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AccessNow BD — Digital Products & Software" },
      { name: "description", content: "Buy verified digital products, subscriptions, software licenses, AI tools, OTT, VPN and education services in Bangladesh with fast delivery." },
      { property: "og:title", content: "AccessNow BD — Digital Products & Software" },
      { property: "og:description", content: "White glassmorphism digital marketplace for premium software, subscriptions and services." },
    ],
  }),
});

const CATEGORY_DECK = [
  { title: "OTT & Streaming", label: "Netflix · Prime · Hoichoi", icon: PlayCircle, to: "/streaming" as const, count: "12+" },
  { title: "AI Tools", label: "ChatGPT · Claude · Gemini", icon: Bot, to: "/ai-tools" as const, count: "8+" },
  { title: "Office & Windows", label: "Windows · Office · 365", icon: MonitorSmartphone, to: "/products" as const, count: "10+" },
  { title: "Design & Editing", label: "Canva · Adobe · CapCut", icon: Palette, to: "/products" as const, count: "9+" },
  { title: "Education", label: "Coursera · Grammarly", icon: GraduationCap, to: "/education" as const, count: "6+" },
  { title: "VPN & Security", label: "NordVPN · Surfshark", icon: ShieldCheck, to: "/products" as const, count: "5+" },
];

const TRUST_ITEMS = [
  { icon: Clock3, title: "10 মিনিটে ডেলিভারি", text: "পেমেন্ট কনফার্ম হলেই দ্রুত প্রসেসিং" },
  { icon: ShieldCheck, title: "ভেরিফাইড সার্ভিস", text: "অরিজিনাল লাইসেন্স ও প্রিমিয়াম অ্যাক্সেস" },
  { icon: Headphones, title: "লাইভ সাপোর্ট", text: "অর্ডার থেকে সেটআপ পর্যন্ত সহায়তা" },
  { icon: CheckCircle2, title: "ওয়ারেন্টি কাভার", text: "সমস্যা হলে রিপ্লেসমেন্ট সাপোর্ট" },
];

const FEATURE_BUNDLES = [
  { title: "Creator Stack", items: ["Canva Pro", "CapCut Pro", "Adobe CC", "Freepik"], price: "৳499+" },
  { title: "Student Stack", items: ["ChatGPT", "Grammarly", "Coursera", "Google One"], price: "৳399+" },
  { title: "Entertainment Stack", items: ["Netflix", "Prime Video", "Spotify", "YouTube"], price: "৳299+" },
];

const ACTIVITY = [
  "Tahsin K. · ChatGPT Plus অর্ডার করেছেন",
  "Maliha R. · Canva Pro অ্যাক্টিভ করেছেন",
  "Rakib H. · Netflix Premium নিয়েছেন",
  "Sajid I. · Windows 11 Pro কিনেছেন",
];

const RAIL_PLACEHOLDER_TITLES: string[] = [
  "OTT & Streaming",
  "AI & Education",
  "Microsoft Office",
  "Editing Tools",
  "Software & Productivity",
  "VPN & Security",
  "Windows",
  "Giftcards",
];

function Index() {
  const { products, isLoading } = useProducts();
  const top = useMemo(() => pickTopProducts(products), [products]);
  const byCategory = useMemo(() => {
    const desired = [
      "OTT & Streaming",
      "AI & Education",
      "Microsoft Office",
      "Editing Tools",
      "Software & Productivity",
      "VPN & Security",
      "Windows",
      "Giftcards",
    ];
    return desired
      .map((category) => ({
        category,
        items: products.filter((p) => p.category === category).slice(0, 8),
      }))
      .filter((g) => g.items.length > 0);
  }, [products]);

  return (
    <div className="min-h-screen">

      <main>
        <HeroExperience />

        <CategoryPillBar />

        <FeaturedProducts items={top} isLoading={isLoading} />
        {isLoading && byCategory.length === 0
          ? RAIL_PLACEHOLDER_TITLES.map((title) => (
              <ProductRail key={title} title={title} items={[]} isLoading />
            ))
          : byCategory.map((section) => (
              <LazyMount key={section.category} minHeight={420}>
                <ProductRail title={section.category} items={section.items} />
              </LazyMount>
            ))}
      </main>
      <SiteFooter />
    </div>
  );
}

const PILL_CATEGORIES = [
  { id: "home", label: "🏠 Home", to: "/" as const },
  { id: "shop", label: "🛍️ Shop", to: "/products" as const },
  { id: "top-picks", label: "⭐ Top Picks", to: "/products" as const },
  { id: "ott", label: "OTT & Streaming", to: "/products" as const },
  { id: "windows", label: "Windows", to: "/products" as const },
  { id: "office", label: "Microsoft Office", to: "/products" as const },
  { id: "ai", label: "AI & Education", to: "/products" as const },
  { id: "software", label: "Software & Productivity", to: "/products" as const },
  { id: "vpn", label: "VPN & Security", to: "/products" as const },
];

function CategoryPillBar() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string>("home");
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 pt-2 pb-1">
      <div className="relative">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll categories left"
          className={`hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-background/90 backdrop-blur border border-border shadow-md hover:bg-primary hover:text-primary-foreground transition ${canLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Edge fade hints */}
        <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-background to-transparent z-10 transition-opacity ${canLeft ? "opacity-100" : "opacity-0"}`} />
        <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background to-transparent z-10 transition-opacity ${canRight ? "opacity-100" : "opacity-0"}`} />

        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto pb-2 scroll-smooth -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="navigation"
          aria-label="Browse categories"
        >
          {PILL_CATEGORIES.map((c) => {
            const isActive = activeId === c.id;
            return (
              <Link
                key={c.id}
                to={c.to}
                onClick={(e) => {
                  setActiveId(c.id);
                  // Ripple effect
                  const target = e.currentTarget;
                  const rect = target.getBoundingClientRect();
                  const ripple = document.createElement("span");
                  const size = Math.max(rect.width, rect.height);
                  ripple.style.cssText = `position:absolute;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;width:${size}px;height:${size}px;border-radius:9999px;background:rgba(255,255,255,0.45);transform:scale(0);opacity:1;pointer-events:none;transition:transform 520ms ease-out,opacity 620ms ease-out;`;
                  target.appendChild(ripple);
                  requestAnimationFrame(() => {
                    ripple.style.transform = "scale(2.4)";
                    ripple.style.opacity = "0";
                  });
                  setTimeout(() => ripple.remove(), 700);
                }}
                aria-current={isActive ? "page" : undefined}
                className={`relative overflow-hidden shrink-0 inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-[13px] font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.55)] scale-[1.03]"
                    : "glass-soft border-white/10 text-foreground hover:border-primary/40 hover:bg-primary/10"
                }`}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll categories right"
          className={`hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-background/90 backdrop-blur border border-border shadow-md hover:bg-primary hover:text-primary-foreground transition ${canRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}


function pickTopProducts(products: Product[]) {
  const seen = new Set<string>();
  const picked: Product[] = [];
  for (const product of products) {
    if (!seen.has(product.category)) {
      picked.push(product);
      seen.add(product.category);
    }
    if (picked.length >= 8) break;
  }
  return picked.length ? picked : products.slice(0, 8);
}

const HERO_BRANDS: { name: string; domain: string; color: string; logo?: string }[] = [
  { name: "Netflix", domain: "netflix.com", color: "#E50914" },
  { name: "ChatGPT", domain: "openai.com", color: "#10A37F" },
  { name: "Spotify", domain: "spotify.com", color: "#1DB954" },
  { name: "Canva", domain: "canva.com", color: "#00C4CC" },
  { name: "Adobe", domain: "adobe.com", color: "#FF0000" },
  { name: "Office 365", domain: "office.com", color: "#EA3E23", logo: "/images/office-365.webp" },
  { name: "Prime Video", domain: "primevideo.com", color: "#00A8E1" },
  { name: "Grammarly", domain: "grammarly.com", color: "#27AE60" },
  { name: "NordVPN", domain: "nordvpn.com", color: "#4687FF" },
  { name: "Coursera", domain: "coursera.org", color: "#0056D2" },
  { name: "YouTube", domain: "youtube.com", color: "#FF0000" },
  { name: "Claude", domain: "claude.ai", color: "#D97757" },
];

const brandLogo = (b: { domain: string; logo?: string }) =>
  b.logo ?? `https://www.google.com/s2/favicons?domain=${b.domain}&sz=128`;


function HeroExperience() {
  return (
    <section
      className="relative px-4 md:px-10 pt-6 pb-12 md:pt-10 md:pb-16 overflow-hidden"
    >
      {/* Subtle deep aurora layers — pushed below to avoid bleeding above hero cards */}
      <div className="pointer-events-none absolute top-40 -left-32 h-[460px] w-[460px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.55), transparent 65%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(0, 229, 255, 0.45), transparent 65%)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 70%)" }} />


      <div className="relative mx-auto max-w-[1280px] grid lg:grid-cols-[1.15fr_0.85fr] gap-5 lg:gap-7 items-stretch">
        {/* LEFT — Headline panel */}
        <div className="relative glass-strong rounded-[var(--radius-2xl)] p-6 md:p-8 lg:p-10 min-h-[460px] flex flex-col justify-between overflow-hidden noise-overlay">
          {/* gradient ring corner */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-conic opacity-30 blur-2xl" style={{ animation: "spinSlow 30s linear infinite" }} />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1.5 text-[11px] font-bold text-aurora-strong neon-border">
                #1 Premium Marketplace · BD
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-[11px] font-bold text-white">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
                  ))}
                </span>
                <span>4.9 · 12K+ রিভিউ</span>
              </div>
            </div>

            <h1
              className="mt-5 max-w-2xl text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 48px)", lineHeight: 1.08, fontWeight: 900, letterSpacing: "-0.02em" }}
            >
              <span
                className="block text-white"
                style={{ textShadow: "0 2px 18px rgba(0,0,0,0.55), 0 0 24px rgba(0,229,255,0.35)" }}
              >
                Premium Software
              </span>
              <span
                className="block mt-1 text-aqua"
                style={{ textShadow: "0 0 22px rgba(0,229,255,0.55), 0 2px 14px rgba(0,0,0,0.5)" }}
              >
                এক ক্লিকেই, আপনার হাতে।
              </span>
            </h1>

            <p className="mt-3 max-w-lg text-sm md:text-[15px] text-white/75 leading-relaxed">
              ভেরিফাইড লাইসেন্স · 10 মিনিটে ডেলিভারি · 24/7 লাইভ সাপোর্ট
            </p>

            {/* Trust ribbon */}
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl glass-soft px-4 py-2.5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-white">
                <ShieldCheck className="h-4 w-4 text-aqua" /> 100% Verified
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5 text-white">
                <CheckCircle2 className="h-4 w-4 text-success" /> Warranty
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5 text-white">
                <Zap className="h-4 w-4 text-[var(--gold)]" /> Instant
              </span>
            </div>
          </div>

          <div className="relative mt-7 flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-aurora group relative overflow-hidden inline-flex h-[50px] items-center justify-center gap-2 rounded-full px-7 text-sm font-extrabold">
              <span className="relative z-10">সব প্রোডাক্ট দেখুন</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-1" />
              <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-md animate-shine" />
            </Link>
            <Link to="/contact" className="glass inline-flex h-[50px] items-center justify-center gap-2 rounded-full px-7 text-sm font-extrabold text-white hover:shadow-[var(--shadow-glow-aqua)] transition">
              <Headphones className="h-4 w-4 text-aqua" /> কাস্টম অর্ডার
            </Link>
          </div>

          <div className="relative mt-7 grid grid-cols-3 gap-2.5">
            {[
              ["36+", "Products", ShieldCheck],
              ["10মিনিট", "Delivery", Clock3],
              ["24/7", "Support", Headphones],
            ].map(([value, label, Icon]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <div key={label as string} className="gradient-border-soft p-3 transition-[box-shadow,border-color] duration-300">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-aurora text-white shadow-[var(--shadow-glow-aqua)]">
                      <I className="h-3.5 w-3.5" />
                    </span>
                    <div className="text-base md:text-lg font-extrabold text-white drop-shadow-[0_2px_10px_rgba(0,229,255,0.5)]">{value as string}</div>
                  </div>
                  <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">{label as string}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Hero visual stack */}
        <div className="relative grid grid-rows-[1fr_auto] gap-4">
          <div className="relative glass-strong rounded-[var(--radius-2xl)] p-5 md:p-6 overflow-hidden min-h-[340px] isolate">
            {/* Soft static ambient glow — behind content, fully clipped */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full -z-10 opacity-30" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.55), transparent 70%)", filter: "blur(30px)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full -z-10 opacity-25" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.55), transparent 70%)", filter: "blur(36px)" }} />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-aqua">Trusted Brands</span>
                <span className="rounded-full glass-soft px-2.5 py-0.5 text-[10px] font-bold text-white inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)] animate-pulse" /> Live
                </span>
              </div>
              <h3 className="mt-2 text-xl md:text-[22px] font-extrabold text-white" style={{ fontFamily: "var(--font-display)", lineHeight: 1.15, textShadow: "0 2px 18px rgba(0,0,0,0.4)" }}>
                <span className="text-neon">বিশ্বস্ত</span> ব্র্যান্ড সমূহ
              </h3>
            </div>

            {/* Brand logo grid — premium tiles */}
            <div className="relative mt-4 grid grid-cols-3 gap-2.5">
              {HERO_BRANDS.slice(0, 6).map((b, i) => (
                <div
                  key={b.name}
                  className="group relative glass-soft rounded-xl aspect-[5/4] flex flex-col items-center justify-center gap-1.5 p-2 border border-white/10 hover:border-aqua/40 hover:shadow-[var(--shadow-glow-aqua)] transition-[border-color,box-shadow,background-color] duration-300 overflow-hidden"
                >
                  <span
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                    style={{ background: `radial-gradient(circle at 50% 30%, ${b.color}33, transparent 70%)` }}
                  />
                  <img
                    src={brandLogo(b)}
                    alt={b.name}
                    loading="lazy"
                    width={28}
                    height={28}
                    className="relative h-7 w-7 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                  />
                  <span className="relative text-[10px] font-bold text-white/85 truncate max-w-full">{b.name}</span>
                </div>
              ))}
            </div>

            {/* Marquee strip with fade edges */}
            <div
              className="relative mt-4 overflow-hidden rounded-xl glass-soft py-2"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0, #000 8%, #000 92%, transparent 100%)",
              }}
            >
              <div className="flex gap-8 whitespace-nowrap animate-marquee">
                {[...HERO_BRANDS, ...HERO_BRANDS].map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs font-bold text-white/85">
                    <span className="h-1.5 w-1.5 rounded-full bg-aqua shadow-[0_0_8px_var(--aqua)]" />
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Special offer / promo card */}
          <div className="relative glass rounded-[var(--radius-2xl)] p-4 md:p-5 overflow-hidden">
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-aurora opacity-30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-violet-grad opacity-25 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full glass-soft px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-aqua">
                  Limited Offer
                </div>
                <h4 className="mt-2 text-lg md:text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)", lineHeight: 1.15 }}>
                  প্রথম অর্ডারে <span className="text-aurora">20% ছাড়</span>
                </h4>
                <p className="mt-1 text-[11px] md:text-xs text-white/70">
                  Coupon: <span className="font-mono font-bold text-white">WELCOME20</span> · সকল প্রোডাক্টে প্রযোজ্য
                </p>
                <Link to="/products" className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-aqua hover:gap-2.5 transition-all">
                  এখনই কিনুন <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="hidden sm:grid h-16 w-16 place-items-center rounded-2xl bg-aurora text-primary-foreground shadow-[var(--shadow-glow-violet)] animate-pulse-glow shrink-0">
                <Zap className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryExperience() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <SectionTitle eyebrow="Browse category" title="আপনার প্রয়োজন অনুযায়ী সার্ভিস বেছে নিন" subtitle="পুরো ওয়েবসাইট এখন software-service marketplace structure-এ সাজানো।" />
      <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORY_DECK.map((category) => (
          <Link
            key={category.title}
            to={category.to}
            className="group relative glass-strong rounded-2xl p-3.5 flex flex-col items-center text-center gap-2 transition-[border-color,box-shadow] duration-300 ease-out hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_var(--color-primary)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary transition-transform duration-300 ease-out group-hover:scale-110">
              <category.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 w-full">
              <span className="block text-[13px] font-extrabold text-foreground leading-tight truncate">{category.title}</span>
              <span className="mt-0.5 block text-[10.5px] text-muted-foreground truncate">{category.label}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrustPanel() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="glass rounded-3xl p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <item.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-extrabold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.015] p-4 h-[320px]">
      <div className="h-32 rounded-2xl bg-white/[0.03]" />
      <div className="mt-4 h-4 w-3/4 rounded bg-white/[0.04]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.03]" />
      <div className="mt-6 h-9 rounded-full bg-white/[0.03]" />
    </div>
  );
}

function FeaturedProducts({ items, isLoading }: { items: Product[]; isLoading?: boolean }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
      <SectionTitle eyebrow="Popular Picks" title="Today's Bestselling Digital Services" subtitle="The most ordered software and subscriptions, handpicked for you." action="View All" to="/products" />
      <div className="mt-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {items.length
          ? items.map((product) => <ProductCard key={product.slug} product={product} />)
          : Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
      </div>
      {!isLoading && !items.length && (
        <p className="mt-4 text-center text-sm text-white/60">প্রোডাক্ট লোড হচ্ছে… একটু পরে রিফ্রেশ করুন।</p>
      )}
    </section>
  );
}

function ProductRail({ title, items, isLoading }: { title: string; items: Product[]; isLoading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  const showSkeleton = isLoading || items.length === 0;
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <div className="flex items-end justify-between gap-4">
        <SectionTitle eyebrow="Collection" title={title} compact />
        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="glass grid h-10 w-10 place-items-center rounded-full text-foreground" aria-label="Scroll left"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => scroll(1)} className="glass grid h-10 w-10 place-items-center rounded-full text-foreground" aria-label="Scroll right"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="mt-6 flex gap-4 md:gap-5 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {showSkeleton
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-[68%] sm:w-[44%] md:w-[30%] lg:w-[23%]">
                <ProductSkeleton />
              </div>
            ))
          : items.map((product) => (
              <div key={product.slug} className="snap-start shrink-0 w-[68%] sm:w-[44%] md:w-[30%] lg:w-[23%]">
                <ProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, subtitle, action, to, compact = false }: { eyebrow: string; title: string; subtitle?: string; action?: string; to?: "/products"; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 ${compact ? "" : ""}`}>
      <div>
        <span className="inline-flex rounded-full glass-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">{eyebrow}</span>
        <h2 className="mt-3 text-2xl md:text-4xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-display)", lineHeight: 1.08 }}>{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {action && to && (
        <Link to={to} className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-foreground">
          {action} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

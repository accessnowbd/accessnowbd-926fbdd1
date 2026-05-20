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
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";

import { HeroBannerCarousel } from "@/components/HeroBannerCarousel";
import type { Product } from "@/data/products";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    try {
      const products = await listProducts();
      return { products };
    } catch {
      return { products: [] as Product[] };
    }
  },
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
  const loaderData = Route.useLoaderData();
  const initialProducts = (loaderData?.products ?? []) as Product[];
  const { products: liveProducts, isLoading } = useProducts(initialProducts);
  const products: Product[] = liveProducts.length ? liveProducts : initialProducts;
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

      <div>
        <HeroBannerCarousel />


        <CategoryPillBar />

        <FeaturedProducts items={top} isLoading={isLoading} />
        {isLoading && byCategory.length === 0
          ? RAIL_PLACEHOLDER_TITLES.map((title) => (
              <ProductRail key={title} title={title} items={[]} isLoading />
            ))
          : byCategory.map((section) => (
              <ProductRail key={section.category} title={section.category} items={section.items} />
            ))}
      </div>
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

        {/* Edge fade hints — soft white blur */}
        <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-14 z-10 transition-opacity backdrop-blur-md [mask-image:linear-gradient(to_right,black,transparent)] bg-gradient-to-r from-white/70 via-white/30 to-transparent dark:from-white/15 dark:via-white/5 ${canLeft ? "opacity-100" : "opacity-0"}`} />
        <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-14 z-10 transition-opacity backdrop-blur-md [mask-image:linear-gradient(to_left,black,transparent)] bg-gradient-to-l from-white/70 via-white/30 to-transparent dark:from-white/15 dark:via-white/5 ${canRight ? "opacity-100" : "opacity-0"}`} />

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
  const netflix = HERO_BRANDS[0];
  const chatgpt = HERO_BRANDS[1];
  const spotify = HERO_BRANDS[2];

  return (
    <section className="relative overflow-hidden px-4 md:px-10 pt-6 pb-10 md:pt-8 md:pb-12">
      {/* Soft blue gradient base — like the reference */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(135deg,#eaf2ff 0%,#f4f7ff 40%,#eef4ff 70%,#e6edff 100%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px]">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 right-1/3 h-56 w-56 rounded-full blur-[2px] opacity-70"
          style={{
            background:
              "radial-gradient(circle at 50% 50%,#7c3aed 0%,rgba(124,58,237,0) 70%)",
          }}
        />

        {/* Frosted glass panel */}
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/60 px-6 pt-8 pb-7 md:px-10 md:pt-10 md:pb-9 lg:px-12 lg:pt-12 shadow-[0_30px_80px_-30px_rgba(79,70,229,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]"
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(28px) saturate(140%)",
            WebkitBackdropFilter: "blur(28px) saturate(140%)",
          }}
        >
          {/* subtle inner highlight */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            {/* LEFT — Content */}
            <div className="space-y-5">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-indigo-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                  #1 Premium Marketplace · BD
                </span>
                <span className="mx-1 h-3 w-px bg-indigo-200" />
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-800">4.9</span>
                  <span className="text-[11px] font-medium text-slate-500">· 12K+ Reviews</span>
                </span>
              </div>

              <h1
                className="font-extrabold tracking-tight text-slate-900"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(26px, 3.6vw, 44px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
              >
                <span className="block">Premium Software</span>
                <span
                  className="mt-2 block bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#7C3AED,#4F46E5,#0891B2)" }}
                >
                  এক ক্লিকেই, আপনার হাতে।
                </span>
              </h1>

              <p className="max-w-xl text-sm md:text-base leading-relaxed text-slate-700">
                ভেরিফাইড লাইসেন্স · ১০ মিনিটে ডেলিভারি · ২৪/৭ লাইভ সাপোর্ট। বাংলাদেশের সবচেয়ে বিশ্বস্ত সাবস্ক্রিপশন শপ।
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200/80 transition-all hover:-translate-y-0.5 hover:shadow-indigo-300/80"
                  style={{ backgroundImage: "linear-gradient(90deg,#4F46E5,#7C3AED)" }}
                >
                  সব প্রোডাক্ট দেখুন
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/60 px-5 py-3 text-sm font-bold text-slate-800 backdrop-blur-md transition-all hover:bg-white/80"
                >
                  <Headphones className="h-4 w-4 text-indigo-600" /> কাস্টম অর্ডার
                </Link>
              </div>

              <div className="grid max-w-md grid-cols-3 gap-6 pt-2">
                {[
                  ["36+", "Products"],
                  ["10 Min", "Delivery"],
                  ["24/7", "Support"],
                ].map(([value, label]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">{value}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Glass bento brand showcase */}
            <div className="relative grid h-[340px] grid-cols-2 gap-3 md:h-[380px]">
              {[
                { brand: netflix, sub: "Premium 4K HDR", className: "self-start" },
                { brand: chatgpt, sub: "GPT-4 Plus", className: "mt-8" },
                { brand: spotify, sub: "Family & Individual", className: "" },
              ].map(({ brand, sub, className }) => (
                <div
                  key={brand.name}
                  className={`${className} rounded-2xl border border-white/70 p-4 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform duration-500 hover:scale-[1.03]`}
                  style={{
                    background: "rgba(255,255,255,0.35)",
                    backdropFilter: "blur(22px) saturate(140%)",
                    WebkitBackdropFilter: "blur(22px) saturate(140%)",
                  }}
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
                    style={{ backgroundColor: brand.color }}
                  >
                    <img src={brandLogo(brand)} alt={brand.name} loading="lazy" width={20} height={20} className="h-5 w-5 object-contain drop-shadow" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{brand.name}</h3>
                  <p className="text-[11px] text-slate-600">{sub}</p>
                </div>
              ))}

              {/* Offer card — bottom-right with gradient border */}
              <div className="-mt-6 self-end overflow-hidden rounded-2xl p-[2px]" style={{ backgroundImage: "linear-gradient(135deg,#7C3AED,#4F46E5,#EC4899)" }}>
                <div
                  className="group h-full rounded-[calc(1rem-2px)] p-4"
                  style={{
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(22px) saturate(140%)",
                    WebkitBackdropFilter: "blur(22px) saturate(140%)",
                  }}
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600">Limited Offer</p>
                  <h4 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                    ২০% ছাড়
                  </h4>
                  <div className="mt-2 inline-block rounded-lg bg-white/70 px-3 py-1 border border-white/80">
                    <p className="font-mono text-[10px] font-bold text-slate-700">CODE: WELCOME20</p>
                  </div>
                  <Link to="/products" className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-900 transition-all group-hover:gap-2">
                    এখুনি কিনুন
                    <ArrowRight className="h-3 w-3 text-indigo-600" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Trust badge strip */}
          <div className="mt-14 grid grid-cols-2 gap-6 border-t border-white/60 pt-8 md:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "১০০% ভেরিফাইড", bg: "bg-indigo-50", fg: "text-indigo-600" },
              { icon: CheckCircle2, label: "ফুল ওয়ারেন্টি", bg: "bg-cyan-50", fg: "text-cyan-600" },
              { icon: Zap, label: "ইনস্ট্যান্ট ডেলিভারি", bg: "bg-pink-50", fg: "text-pink-600" },
              { icon: Clock3, label: "১০ মিনিটে অ্যাক্টিভেশন", bg: "bg-emerald-50", fg: "text-emerald-600" },
            ].map(({ icon: Icon, label, bg, fg }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-full ${bg} ${fg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold text-slate-800">{label}</span>
              </div>
            ))}
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
        <p className="mt-4 text-center text-sm text-white/70">প্রোডাক্ট লোড হচ্ছে… একটু পরে রিফ্রেশ করুন।</p>
      )}
    </section>
  );
}

function ProductRail({ title, items, isLoading }: { title: string; items: Product[]; isLoading?: boolean }) {
  const showSkeleton = isLoading || items.length === 0;
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <SectionTitle eyebrow="Collection" title={title} compact />
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {showSkeleton
          ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          : items.map((product) => <ProductCard key={product.slug} product={product} />)}
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

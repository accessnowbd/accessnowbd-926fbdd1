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
import { LazyMount } from "@/components/LazyMount";
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
  const leftBrands = [HERO_BRANDS[0], HERO_BRANDS[1]]; // Netflix, ChatGPT
  const rightFeatured = HERO_BRANDS[2]; // Spotify

  return (
    <section className="relative px-4 md:px-10 pt-6 pb-12 md:pt-10 md:pb-16">
      <div className="force-dark-canvas relative mx-auto max-w-[1280px] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl bg-[#111420]">
        {/* Background glows */}
        <div className="pointer-events-none absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-purple-600/25 blur-[120px] rounded-full" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 p-7 md:p-12 lg:p-16 items-center">
          {/* LEFT — Content */}
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold text-cyan-300 tracking-wider uppercase">#1 Premium Marketplace · BD</span>
              <span className="w-px h-3 bg-white/20 mx-1" />
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                <Star className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" /> 4.9 · 12K+ Reviews
              </span>
            </div>

            <h1
              className="font-extrabold text-white leading-[1.1]"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 5vw, 64px)", letterSpacing: "-0.02em" }}
            >
              <span className="block">Premium Software</span>
              <span className="block mt-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                এক ক্লিকেই, আপনার হাতে।
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
              ভেরিফাইড লাইসেন্স · ১০ মিনিটে ডেলিভারি · ২৪/৭ লাইভ সাপোর্ট। বাংলাদেশের সবচেয়ে বিশ্বস্ত সাবস্ক্রিপশন শপ।
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5"
              >
                সব প্রোডাক্ট দেখুন
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-7 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-2xl border border-white/10 backdrop-blur-sm transition-all"
              >
                <Headphones className="h-4 w-4 text-cyan-400" /> কাস্টম অর্ডার
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-4 max-w-md">
              {[
                ["36+", "Products"],
                ["10 Min", "Delivery"],
                ["24/7", "Support"],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{value}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Floating brand card stack */}
          <div className="lg:col-span-5 relative">
            <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/25 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/25 rounded-full blur-3xl" />

            <div className="relative z-20 grid grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-4">
                {leftBrands.map((b) => (
                  <div
                    key={b.name}
                    className="group p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:bg-white/10 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg"
                      style={{ backgroundColor: b.color }}
                    >
                      <img
                        src={brandLogo(b)}
                        alt={b.name}
                        loading="lazy"
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain drop-shadow"
                      />
                    </div>
                    <h3 className="text-white font-bold text-sm">{b.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Premium Access</p>
                  </div>
                ))}
              </div>

              {/* Right column (offset down) */}
              <div className="space-y-4 pt-10">
                {featuredRight.slice(0, 1).map(() => {
                  const b = HERO_BRANDS[1]; // ChatGPT
                  return (
                    <div
                      key={b.name}
                      className="group p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:bg-white/10 transition-colors"
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg"
                        style={{ backgroundColor: b.color }}
                      >
                        <img
                          src={brandLogo(b)}
                          alt={b.name}
                          loading="lazy"
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain drop-shadow"
                        />
                      </div>
                      <h3 className="text-white font-bold text-sm">{b.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Plus (Official)</p>
                    </div>
                  );
                })}

                {/* Offer card */}
                <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-[2px] shadow-xl shadow-purple-500/20">
                  <div className="h-full w-full bg-[#111420] rounded-[22px] p-5">
                    <div className="text-purple-300 text-[10px] font-extrabold uppercase tracking-[0.18em] mb-2">Limited Offer</div>
                    <div className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>20% ছাড়</div>
                    <div className="text-[10px] text-slate-400 font-mono mb-4">CODE: WELCOME20</div>
                    <Link to="/products" className="text-[11px] font-extrabold text-white inline-flex items-center gap-1 hover:gap-2 transition-all">
                      এখুনি কিনুন <ArrowRight className="h-3 w-3 text-purple-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative bg-white/5 border-t border-white/10 px-6 py-5 flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
          {[
            { icon: ShieldCheck, label: "100% ভেরিফাইড", tone: "cyan", color: "text-cyan-400 bg-cyan-500/15" },
            { icon: CheckCircle2, label: "ফুল ওয়ারেন্টি", tone: "blue", color: "text-blue-400 bg-blue-500/15" },
            { icon: Zap, label: "ইনস্ট্যান্ট ডেলিভারি", tone: "purple", color: "text-purple-400 bg-purple-500/15" },
            { icon: Clock3, label: "১০ মিনিটে অ্যাক্টিভেশন", tone: "emerald", color: "text-emerald-400 bg-emerald-500/15" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full grid place-items-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-slate-200 text-sm font-medium">{label}</span>
            </div>
          ))}
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

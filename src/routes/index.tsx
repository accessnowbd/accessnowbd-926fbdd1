import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
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
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
  { title: "OTT & Streaming", label: "Netflix · Prime · Hoichoi", icon: PlayCircle, to: "/streaming" as const, count: "১২+" },
  { title: "AI Tools", label: "ChatGPT · Claude · Gemini", icon: Bot, to: "/ai-tools" as const, count: "৮+" },
  { title: "Office & Windows", label: "Windows · Office · 365", icon: MonitorSmartphone, to: "/products" as const, count: "১০+" },
  { title: "Design & Editing", label: "Canva · Adobe · CapCut", icon: Palette, to: "/products" as const, count: "৯+" },
  { title: "Education", label: "Coursera · Grammarly", icon: GraduationCap, to: "/education" as const, count: "৬+" },
  { title: "VPN & Security", label: "NordVPN · Surfshark", icon: ShieldCheck, to: "/products" as const, count: "৫+" },
];

const TRUST_ITEMS = [
  { icon: Clock3, title: "১০ মিনিটে ডেলিভারি", text: "পেমেন্ট কনফার্ম হলেই দ্রুত প্রসেসিং" },
  { icon: ShieldCheck, title: "ভেরিফাইড সার্ভিস", text: "অরিজিনাল লাইসেন্স ও প্রিমিয়াম অ্যাক্সেস" },
  { icon: Headphones, title: "লাইভ সাপোর্ট", text: "অর্ডার থেকে সেটআপ পর্যন্ত সহায়তা" },
  { icon: CheckCircle2, title: "ওয়ারেন্টি কাভার", text: "সমস্যা হলে রিপ্লেসমেন্ট সাপোর্ট" },
];

const FEATURE_BUNDLES = [
  { title: "Creator Stack", items: ["Canva Pro", "CapCut Pro", "Adobe CC", "Freepik"], price: "৳৪৯৯+" },
  { title: "Student Stack", items: ["ChatGPT", "Grammarly", "Coursera", "Google One"], price: "৳৩৯৯+" },
  { title: "Entertainment Stack", items: ["Netflix", "Prime Video", "Spotify", "YouTube"], price: "৳২৯৯+" },
];

const ACTIVITY = [
  "Tahsin K. · ChatGPT Plus অর্ডার করেছেন",
  "Maliha R. · Canva Pro অ্যাক্টিভ করেছেন",
  "Rakib H. · Netflix Premium নিয়েছেন",
  "Sajid I. · Windows 11 Pro কিনেছেন",
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
    <div className="min-h-screen overflow-hidden">
      <SiteHeader />
      <main>
        <HeroExperience />
        <CategoryExperience />

        <FeaturedProducts items={top} isLoading={isLoading} />
        {isLoading && byCategory.length === 0 ? (
          <ProductRail title="Loading collections" items={[]} isLoading />
        ) : (
          byCategory.map((section) => (
            <ProductRail key={section.category} title={section.category} items={section.items} />
          ))
        )}
      </main>
      <SiteFooter />
    </div>
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
  { name: "Office 365", domain: "office.com", color: "#EA3E23", logo: "/images/office-365.png" },
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
      className="relative px-4 md:px-10 pt-8 pb-12 md:pt-12 md:pb-16 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37, 99, 235, 0.18), transparent 70%), linear-gradient(180deg, #07091c 0%, #080a1f 50%, #060818 100%)",
      }}
    >
      {/* Subtle deep aurora layers — tuned to match header/footer navy */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[460px] w-[460px] rounded-full opacity-25 blur-3xl animate-blob"
        style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.55), transparent 65%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl animate-blob"
        style={{ animationDelay: "-6s", background: "radial-gradient(circle, rgba(0, 229, 255, 0.45), transparent 65%)" }} />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full opacity-15 blur-3xl animate-pulse-glow"
        style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent 70%)" }} />
      {/* Top hairline glow to blend with header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative mx-auto max-w-[1280px] grid lg:grid-cols-[1.15fr_0.85fr] gap-5 lg:gap-7 items-stretch">
        {/* LEFT — Headline panel */}
        <div className="relative glass-strong rounded-[var(--radius-2xl)] p-6 md:p-8 lg:p-10 min-h-[460px] flex flex-col justify-between overflow-hidden noise-overlay">
          {/* gradient ring corner */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-conic opacity-30 blur-2xl" style={{ animation: "spinSlow 30s linear infinite" }} />
          {/* premium accent line */}
          <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[var(--aqua)]/60 to-transparent" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1.5 text-[11px] font-bold text-aurora-strong neon-border">
                <Sparkles className="h-3.5 w-3.5 text-aqua" /> #১ Premium Marketplace · BD
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-1.5 text-[11px] font-bold text-white">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
                  ))}
                </span>
                <span>৪.৯ · ১২K+ রিভিউ</span>
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
              ভেরিফাইড লাইসেন্স · ১০ মিনিটে ডেলিভারি · ২৪/৭ লাইভ সাপোর্ট
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
              ["৩৬+", "Products", Sparkles],
              ["১০মিনিট", "Delivery", Clock3],
              ["২৪/৭", "Support", Headphones],
            ].map(([value, label, Icon]) => {
              const I = Icon as typeof Sparkles;
              return (
                <div key={label as string} className="gradient-border-soft p-3 hover:-translate-y-0.5 transition">
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
                <span className="text-neon">Verified Partner</span> ব্র্যান্ডসমূহ
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
                  <Sparkles className="h-3 w-3" /> Limited Offer
                </div>
                <h4 className="mt-2 text-lg md:text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)", lineHeight: 1.15 }}>
                  প্রথম অর্ডারে <span className="text-aurora">২০% ছাড়</span>
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
      <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORY_DECK.map((category) => (
          <Link
            key={category.title}
            to={category.to}
            className="group glass-strong rounded-3xl p-6 flex items-center gap-4 transition-[border-color,box-shadow,background-color] duration-300 ease-out hover:border-primary/40 hover:shadow-[0_10px_40px_-12px_var(--color-primary)]"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-primary transition-transform duration-300 ease-out group-hover:scale-105">
              <category.icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-foreground">{category.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground truncate">{category.label}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-primary transition-transform duration-300 ease-out group-hover:translate-x-1" />
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
    <div className="rounded-3xl glass-soft border border-white/10 p-4 h-[320px] animate-pulse">
      <div className="h-32 rounded-2xl bg-white/5" />
      <div className="mt-4 h-4 w-3/4 rounded bg-white/10" />
      <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
      <div className="mt-6 h-9 rounded-full bg-white/5" />
    </div>
  );
}

function FeaturedProducts({ items, isLoading }: { items: Product[]; isLoading?: boolean }) {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
      <SectionTitle eyebrow="Popular picks" title="আজকের জনপ্রিয় ডিজিটাল সার্ভিস" subtitle="সবচেয়ে বেশি অর্ডার হওয়া software ও subscription একসাথে।" action="All products" to="/products" />
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
        <SectionTitle eyebrow="Collection" title={title} subtitle="ক্যাটাগরি অনুযায়ী সাজানো প্রোডাক্ট।" compact />
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

function SectionTitle({ eyebrow, title, subtitle, action, to, compact = false }: { eyebrow: string; title: string; subtitle: string; action?: string; to?: "/products"; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-3 ${compact ? "" : ""}`}>
      <div>
        <span className="inline-flex rounded-full glass-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">{eyebrow}</span>
        <h2 className="mt-3 text-2xl md:text-4xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-display)", lineHeight: 1.08 }}>{title}</h2>
        <p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">{subtitle}</p>
      </div>
      {action && to && (
        <Link to={to} className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-foreground">
          {action} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

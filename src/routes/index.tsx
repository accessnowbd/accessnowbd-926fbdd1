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
  const { products } = useProducts();
  const top = useMemo(() => pickTopProducts(products), [products]);
  const byCategory = useMemo(() => {
    const groups = ["OTT & Streaming", "AI & Education", "Microsoft Office", "Editing Tools"].map((category) => ({
      category,
      items: products.filter((p) => p.category === category).slice(0, 8),
    }));
    return groups.filter((g) => g.items.length > 0);
  }, [products]);

  return (
    <div className="min-h-screen overflow-hidden">
      <SiteHeader />
      <main>
        <HeroExperience />
        <CategoryExperience />
        <TrustPanel />
        <FeaturedProducts items={top} />
        {byCategory.map((section) => (
          <ProductRail key={section.category} title={section.category} items={section.items} />
        ))}
        <BundleShowcase />
        <ProcessSection />
        <FinalCTA />
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

const HERO_BRANDS = [
  { name: "Netflix", domain: "netflix.com", color: "#E50914" },
  { name: "ChatGPT", domain: "openai.com", color: "#10A37F" },
  { name: "Spotify", domain: "spotify.com", color: "#1DB954" },
  { name: "Canva", domain: "canva.com", color: "#00C4CC" },
  { name: "Adobe", domain: "adobe.com", color: "#FF0000" },
  { name: "Microsoft", domain: "microsoft.com", color: "#00A4EF" },
  { name: "Prime Video", domain: "primevideo.com", color: "#00A8E1" },
  { name: "Grammarly", domain: "grammarly.com", color: "#27AE60" },
  { name: "NordVPN", domain: "nordvpn.com", color: "#4687FF" },
  { name: "Coursera", domain: "coursera.org", color: "#0056D2" },
  { name: "YouTube", domain: "youtube.com", color: "#FF0000" },
  { name: "Claude", domain: "claude.ai", color: "#D97757" },
];

const brandLogo = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

function HeroExperience() {
  return (
    <section className="relative px-4 md:px-10 pt-8 pb-12 md:pt-12 md:pb-16 overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-mesh opacity-90 pointer-events-none animate-aurora-pan" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[460px] w-[460px] rounded-full bg-violet-grad opacity-40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[500px] w-[500px] rounded-full bg-cyan-grad opacity-35 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-aurora opacity-25 blur-3xl animate-pulse-glow" />

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
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.6vw, 48px)", lineHeight: 1.08, fontWeight: 900, letterSpacing: "-0.02em", textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
            >
              <span className="block bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent drop-shadow-[0_4px_18px_rgba(0,229,255,0.55)]">Premium Software</span>
              <span className="block mt-1 text-aqua" style={{ textShadow: "0 0 22px rgba(0,229,255,0.5)" }}>এক ক্লিকেই, আপনার হাতে।</span>
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

        {/* RIGHT — Premium showcase stack */}
        <div className="relative grid grid-rows-[1fr_auto] gap-4">
          {/* Hero showcase card */}
          <div
            className="relative rounded-[var(--radius-2xl)] overflow-hidden min-h-[360px] p-[1px]"
            style={{ background: "linear-gradient(140deg, rgba(0,229,255,0.55), rgba(124,58,237,0.45) 45%, rgba(255,255,255,0.06) 75%)" }}
          >
            <div className="relative h-full w-full rounded-[calc(var(--radius-2xl)-1px)] glass-strong p-5 md:p-6 overflow-hidden">
              {/* Soft glow accents */}
              <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, #00E5FF 0%, transparent 70%)" }} />
              <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-35 blur-3xl" style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)" }} />

              {/* Header */}
              <div className="relative flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-aqua">
                  <Sparkles className="h-3 w-3" /> Featured
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full glass-soft px-2.5 py-1 text-[10px] font-bold text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_var(--success)] animate-pulse" /> In Stock
                </span>
              </div>

              {/* Premium centerpiece */}
              <div className="relative mt-5 flex flex-col items-center text-center">
                {/* Logo halo */}
                <div className="relative">
                  <div className="absolute inset-0 -m-6 rounded-full opacity-70 blur-2xl" style={{ background: "conic-gradient(from 0deg, #00E5FF, #7C3AED, #2563EB, #00E5FF)", animation: "spinSlow 14s linear infinite" }} />
                  <div className="relative grid h-24 w-24 place-items-center rounded-3xl glass-strong border border-white/15 shadow-[0_20px_50px_-20px_rgba(0,229,255,0.6)]">
                    <img src={brandLogo("openai.com")} alt="ChatGPT" className="h-12 w-12 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]" />
                  </div>
                </div>

                <h3 className="mt-5 text-2xl md:text-[26px] font-extrabold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
                  ChatGPT Plus
                </h3>
                <p className="mt-1 text-[12px] text-white/70">GPT-4o · DALL·E · Voice · Priority Access</p>

                {/* Price row */}
                <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl glass-soft px-5 py-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">From</span>
                  <span className="text-2xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>৳৪৯৯</span>
                  <span className="text-[11px] text-white/50 line-through">৳৭৯৯</span>
                  <span className="ml-1 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] px-2 py-0.5 text-[10px] font-extrabold">-৩৭%</span>
                </div>

                <Link to="/ai-tools" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-aqua hover:gap-2.5 transition-all">
                  Explore AI Tools <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Brand chip row */}
              <div className="relative mt-5 flex items-center justify-center gap-2 flex-wrap">
                {HERO_BRANDS.slice(0, 7).map((b) => (
                  <div
                    key={b.name}
                    title={b.name}
                    className="group grid h-9 w-9 place-items-center rounded-full glass-soft border border-white/10 hover:-translate-y-0.5 hover:border-white/30 transition"
                  >
                    <img src={brandLogo(b.domain)} alt={b.name} loading="lazy" className="h-4.5 w-4.5 object-contain" style={{ height: 18, width: 18 }} />
                  </div>
                ))}
                <div className="grid h-9 px-3 place-items-center rounded-full glass-soft border border-white/10 text-[10px] font-extrabold text-white/80">
                  +৩৬
                </div>
              </div>
            </div>
          </div>

          {/* Premium offer card */}
          <div
            className="relative rounded-[var(--radius-2xl)] overflow-hidden p-[1px]"
            style={{ background: "linear-gradient(120deg, rgba(245,158,11,0.6), rgba(236,72,153,0.45) 50%, rgba(124,58,237,0.5))" }}
          >
            <div className="relative rounded-[calc(var(--radius-2xl)-1px)] glass-strong p-4 md:p-5 overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-40 blur-2xl" style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }} />
              <div className="relative flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--gold)]">
                    <Zap className="h-3 w-3" /> Limited · ৪৮H
                  </div>
                  <h4 className="mt-2 text-lg md:text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-display)", lineHeight: 1.15 }}>
                    প্রথম অর্ডারে <span className="bg-gradient-to-r from-[#f59e0b] via-[#ec4899] to-[#a78bfa] bg-clip-text text-transparent">২০% ছাড়</span>
                  </h4>
                  <p className="mt-1 text-[11px] md:text-xs text-white/70">
                    Code: <span className="font-mono font-extrabold text-white tracking-wider px-1.5 py-0.5 rounded bg-white/10 border border-dashed border-white/25">WELCOME20</span>
                  </p>
                </div>
                <Link
                  to="/products"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(245,158,11,0.7)] hover:shadow-[0_14px_30px_-10px_rgba(245,158,11,0.9)] transition"
                  style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}
                >
                  Claim <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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
          <Link key={category.title} to={category.to} className="group glass-strong rounded-3xl p-6 flex items-center gap-4 hover:-translate-y-1 transition">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary text-primary">
              <category.icon className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-foreground">{category.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground truncate">{category.label}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
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

function FeaturedProducts({ items }: { items: Product[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
      <SectionTitle eyebrow="Popular picks" title="আজকের জনপ্রিয় ডিজিটাল সার্ভিস" subtitle="সবচেয়ে বেশি অর্ডার হওয়া software ও subscription একসাথে।" action="All products" to="/products" />
      <div className="mt-7 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {items.map((product) => <ProductCard key={product.slug} product={product} />)}
      </div>
    </section>
  );
}

function ProductRail({ title, items }: { title: string; items: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
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
        {items.map((product) => (
          <div key={product.slug} className="snap-start shrink-0 w-[68%] sm:w-[44%] md:w-[30%] lg:w-[23%]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

function BundleShowcase() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
      <div className="glass-strong rounded-[var(--radius-2xl)] p-6 md:p-10">
        <SectionTitle eyebrow="Smart bundles" title="যাদের একসাথে অনেক সার্ভিস লাগে" subtitle="Creator, student ও entertainment workflow অনুযায়ী সাজানো bundle ideas।" />
        <div className="mt-7 grid md:grid-cols-3 gap-4">
          {FEATURE_BUNDLES.map((bundle) => (
            <div key={bundle.title} className="glass-soft rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold text-foreground">{bundle.title}</h3>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{bundle.price}</span>
              </div>
              <div className="mt-5 space-y-3">
                {bundle.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" /> {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
      <SectionTitle eyebrow="Order flow" title="অর্ডার থেকে ডেলিভারি—সবকিছু পরিষ্কার" subtitle="পুরো অভিজ্ঞতাটি দ্রুত কেনাকাটার জন্য নতুনভাবে সাজানো হয়েছে।" />
      <div className="mt-7 grid md:grid-cols-3 gap-4">
        {[
          ["01", "প্রোডাক্ট বেছে নিন", "ক্যাটাগরি বা সার্চ থেকে প্রয়োজনীয় সফটওয়্যার সার্ভিস সিলেক্ট করুন।"],
          ["02", "পেমেন্ট করুন", "bKash, Nagad, Rocket বা কার্ডের মাধ্যমে অর্ডার কনফার্ম করুন।"],
          ["03", "অ্যাক্সেস পান", "ইমেইল/WhatsApp-এ ডেলিভারি ও সেটআপ সাপোর্ট পেয়ে যান।"],
        ].map(([step, title, text]) => (
          <div key={step} className="glass rounded-3xl p-6">
            <div className="text-5xl font-black text-aurora opacity-70">{step}</div>
            <h3 className="mt-4 text-lg font-extrabold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12 pb-16">
      <div className="glass-strong rounded-[var(--radius-2xl)] p-8 md:p-12 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-aurora text-primary-foreground shadow-[var(--shadow-glow-violet)]">
          <Star className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl md:text-5xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-display)" }}>আজই আপনার ডিজিটাল stack upgrade করুন</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">একই জায়গা থেকে entertainment, productivity, education, AI ও security tools কিনুন—নতুন white glass experience-এ।</p>
        <Link to="/products" className="btn-aurora mt-7 inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-8 text-sm font-bold">
          Shop now <ArrowRight className="h-4 w-4" />
        </Link>
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

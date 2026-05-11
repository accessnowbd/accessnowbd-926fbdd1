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
  { name: "Netflix", slug: "netflix", color: "E50914" },
  { name: "ChatGPT", slug: "openai", color: "FFFFFF" },
  { name: "Spotify", slug: "spotify", color: "1DB954" },
  { name: "Canva", slug: "canva", color: "00C4CC" },
  { name: "Adobe", slug: "adobe", color: "FF0000" },
  { name: "Microsoft", slug: "microsoft", color: "FFFFFF" },
  { name: "Prime Video", slug: "primevideo", color: "00A8E1" },
  { name: "Grammarly", slug: "grammarly", color: "27AE60" },
  { name: "NordVPN", slug: "nordvpn", color: "4687FF" },
  { name: "Coursera", slug: "coursera", color: "0056D2" },
  { name: "YouTube", slug: "youtube", color: "FF0000" },
  { name: "Claude", slug: "claude", color: "D97757" },
];

function HeroExperience() {
  return (
    <section className="relative px-4 md:px-10 pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      {/* Animated background layers */}
      <div className="absolute inset-0 bg-mesh opacity-90 pointer-events-none animate-aurora-pan" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-violet-grad opacity-40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[560px] w-[560px] rounded-full bg-cyan-grad opacity-35 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-aurora opacity-25 blur-3xl animate-pulse-glow" />

      <div className="relative mx-auto max-w-[1440px] grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-10 items-stretch">
        {/* LEFT — Headline panel */}
        <div className="relative glass-strong rounded-[var(--radius-2xl)] p-7 md:p-12 lg:p-14 min-h-[600px] flex flex-col justify-between overflow-hidden noise-overlay">
          {/* gradient ring corner */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-conic opacity-30 blur-2xl" style={{ animation: "spinSlow 30s linear infinite" }} />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full glass-soft px-4 py-2 text-xs font-bold text-aurora-strong neon-border">
                <Sparkles className="h-4 w-4 text-aqua" /> #১ Premium Marketplace · BD
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full glass-soft px-3 py-2 text-xs font-bold text-foreground">
                <span className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                  ))}
                </span>
                <span>৪.৯ · ১২K+ রিভিউ</span>
              </div>
            </div>

            <h1
              className="mt-6 max-w-3xl text-white"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 4.6vw, 64px)", lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.02em", textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
            >
              <span className="block text-white drop-shadow-[0_4px_18px_rgba(0,229,255,0.55)]">Premium Software</span>
              <span className="block mt-1 text-aqua" style={{ textShadow: "0 0 22px rgba(0,229,255,0.5)" }}>এক ক্লিকেই, আপনার হাতে।</span>
            </h1>

            {/* Premium visual chip row — floating brand pills */}
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              {HERO_BRANDS.slice(0, 6).map((b, i) => (
                <div
                  key={b.name}
                  className="group flex items-center gap-2 rounded-full glass-soft pl-1 pr-3.5 py-1 text-xs font-bold text-white hover:shadow-[var(--shadow-glow-aqua)] hover:-translate-y-0.5 transition animate-float"
                  style={{ animationDelay: `${i * 0.5}s`, animationDuration: "8s" }}
                >
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.35)] ring-1 ring-white/40"
                    style={{ background: `#${b.color === "FFFFFF" ? "111827" : "ffffff"}` }}
                  >
                    <img
                      src={`https://cdn.simpleicons.org/${b.slug}/${b.color}`}
                      alt={b.name}
                      loading="lazy"
                      className="h-4 w-4 object-contain"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </span>
                  {b.name}
                </div>
              ))}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-aurora text-white pl-3 pr-3.5 py-2 text-xs font-extrabold shadow-[var(--shadow-glow-violet)]">
                +৩০ আরও
              </div>
            </div>

            {/* Trust ribbon */}
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl glass-soft px-4 py-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <ShieldCheck className="h-4 w-4 text-aqua" /> 100% Verified
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" /> Warranty
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5 text-foreground">
                <Zap className="h-4 w-4 text-[var(--gold)]" /> Instant
              </span>
            </div>
          </div>

          <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-aurora group relative overflow-hidden inline-flex h-[56px] items-center justify-center gap-2 rounded-full px-8 text-sm font-extrabold">
              <span className="relative z-10">সব প্রোডাক্ট দেখুন</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-1" />
              <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/30 blur-md animate-shine" />
            </Link>
            <Link to="/contact" className="glass inline-flex h-[56px] items-center justify-center gap-2 rounded-full px-8 text-sm font-extrabold text-foreground hover:shadow-[var(--shadow-glow-aqua)] transition">
              <Headphones className="h-4 w-4 text-aqua" /> কাস্টম অর্ডার
            </Link>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-3">
            {[
              ["৩৬+", "Products", Sparkles],
              ["১০মিনিট", "Delivery", Clock3],
              ["২৪/৭", "Support", Headphones],
            ].map(([value, label, Icon]) => {
              const I = Icon as typeof Sparkles;
              return (
                <div key={label as string} className="gradient-border-soft p-4 hover:-translate-y-0.5 transition">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-aurora text-white shadow-[var(--shadow-glow-aqua)]">
                      <I className="h-4 w-4" />
                    </span>
                    <div className="text-xl md:text-2xl font-extrabold text-aurora">{value as string}</div>
                  </div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label as string}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Hero visual stack */}
        <div className="relative grid grid-rows-[1fr_auto] gap-5">
          <div className="relative glass-strong rounded-[var(--radius-2xl)] p-6 md:p-8 overflow-hidden min-h-[420px]">
            {/* Floating spotlight orbs */}
            <div className="pointer-events-none absolute top-8 right-8 h-32 w-32 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #67e8f9, #2563EB 60%, transparent 70%)", filter: "blur(2px)" }} />
            <div className="pointer-events-none absolute bottom-10 left-6 h-24 w-24 rounded-full animate-float" style={{ background: "radial-gradient(circle at 30% 30%, #a78bfa, #7C3AED 60%, transparent 75%)" }} />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-aqua">Trusted Brands</span>
                <span className="rounded-full glass-soft px-3 py-1 text-[11px] font-bold text-foreground">Live</span>
              </div>
              <h3 className="mt-3 text-2xl md:text-[28px] font-extrabold text-foreground" style={{ fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                আমাদের <span className="text-neon">Verified Partner</span> ব্র্যান্ডসমূহ
              </h3>
            </div>

            {/* Brand logo grid */}
            <div className="relative mt-5 grid grid-cols-3 gap-3">
              {HERO_BRANDS.slice(0, 6).map((b, i) => (
                <div
                  key={b.name}
                  className="group glass-soft rounded-2xl aspect-square flex items-center justify-center p-3 hover:-translate-y-1 hover:shadow-[var(--shadow-glow-aqua)] transition animate-float"
                  style={{ animationDelay: `${i * 0.6}s`, animationDuration: "7s" }}
                >
                  <img
                    src={`https://cdn.simpleicons.org/${b.slug}/${b.color}`}
                    alt={b.name}
                    loading="lazy"
                    className="max-h-10 max-w-[70%] object-contain opacity-95 group-hover:scale-110 transition drop-shadow-[0_4px_12px_rgba(0,229,255,0.4)]"
                    onError={(e) => {
                      const el = e.currentTarget as HTMLImageElement;
                      if (!el.dataset.fallback) {
                        el.dataset.fallback = "1";
                        el.src = `https://cdn.simpleicons.org/${b.slug}/FFFFFF`;
                      } else {
                        el.style.display = "none";
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Marquee strip */}
            <div className="relative mt-5 overflow-hidden rounded-2xl glass-soft py-3">
              <div className="flex gap-10 whitespace-nowrap animate-marquee">
                {[...HERO_BRANDS, ...HERO_BRANDS].map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-2 text-sm font-bold text-foreground/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-aqua shadow-[0_0_8px_var(--aqua)]" />
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Special offer / promo card */}
          <div className="relative glass rounded-[var(--radius-2xl)] p-5 md:p-6 overflow-hidden">
            <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-aurora opacity-30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-violet-grad opacity-25 blur-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-2 rounded-full glass-soft px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-aqua">
                  <Sparkles className="h-3.5 w-3.5" /> Limited Offer
                </div>
                <h4 className="mt-3 text-xl md:text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-display)", lineHeight: 1.15 }}>
                  প্রথম অর্ডারে <span className="text-aurora">২০% ছাড়</span>
                </h4>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
                  Coupon: <span className="font-mono font-bold text-foreground">WELCOME20</span> · সকল প্রোডাক্টে প্রযোজ্য
                </p>
                <Link to="/products" className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-aqua hover:gap-2.5 transition-all">
                  এখনই কিনুন <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="hidden sm:grid h-20 w-20 place-items-center rounded-2xl bg-aurora text-primary-foreground shadow-[var(--shadow-glow-violet)] animate-pulse-glow shrink-0">
                <Zap className="h-8 w-8" />
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

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

function HeroExperience() {
  return (
    <section className="relative px-4 md:px-10 pt-10 pb-14 md:pt-14 md:pb-20">
      <div className="absolute inset-0 bg-mesh opacity-80 pointer-events-none" />
      <div className="relative mx-auto max-w-[1440px] grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-8 items-stretch">
        <div className="glass-strong rounded-[var(--radius-2xl)] p-6 md:p-10 lg:p-12 min-h-[560px] flex flex-col justify-between overflow-hidden">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full glass-soft px-4 py-2 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4" /> বাংলাদেশের ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস
            </div>
            <h1 className="mt-6 max-w-4xl text-foreground" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(42px, 7vw, 88px)", lineHeight: 0.95, fontWeight: 800 }}>
              Software, subscription, tools — সবকিছু এক নতুন glass store-এ।
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
              OTT, AI, Windows, Office, Editing, VPN, Education ও Gift Card—যে সার্ভিসই লাগুক, AccessNow BD থেকে দ্রুত ও নিরাপদে অর্ডার করুন।
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/products" className="btn-aurora inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-7 text-sm font-bold">
              সব প্রোডাক্ট দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="glass inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-7 text-sm font-bold text-foreground hover:shadow-[var(--shadow-glass-lg)] transition">
              কাস্টম অর্ডার দিন
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["৩৬+", "প্রোডাক্ট"],
              ["১০মিনিট", "ডেলিভারি"],
              ["২৪/৭", "সাপোর্ট"],
            ].map(([value, label]) => (
              <div key={label} className="glass-soft rounded-2xl p-4">
                <div className="text-2xl md:text-3xl font-extrabold text-aurora">{value}</div>
                <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-rows-[1fr_auto] gap-5">
          <div className="glass-strong rounded-[var(--radius-2xl)] p-5 md:p-6 overflow-hidden">
            <div className="grid grid-cols-2 gap-4 h-full">
              {CATEGORY_DECK.slice(0, 4).map((category, index) => (
                <Link key={category.title} to={category.to} className={`group glass-soft rounded-3xl p-5 min-h-[210px] flex flex-col justify-between hover:-translate-y-1 transition ${index === 0 ? "col-span-2 md:col-span-1" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]">
                      <category.icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold text-secondary-foreground">{category.count}</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground">{category.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{category.label}</p>
                    <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                      Explore <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="glass rounded-[var(--radius-2xl)] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live activity</p>
                <div className="mt-2 space-y-2">
                  {ACTIVITY.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="h-2 w-2 rounded-full bg-success" /> {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:grid h-20 w-20 place-items-center rounded-full bg-aurora text-primary-foreground shadow-[var(--shadow-glow-violet)]">
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

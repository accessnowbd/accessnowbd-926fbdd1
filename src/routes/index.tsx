import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Zap, Shield, Headphones, Star, Plus, Minus, Pause, Play, MessageCircle } from "lucide-react";
import heroPayment from "@/assets/hero-payment.jpg";
import heroDelivery from "@/assets/hero-delivery.jpg";
import heroWarranty from "@/assets/hero-warranty.jpg";
import heroEducation from "@/assets/hero-education.jpg";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { Product } from "@/data/products";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AccessNow BD — Premium Digital Subscriptions in Bangladesh" },
      { name: "description", content: "Buy Netflix, ChatGPT Plus, Spotify, Canva Pro, Coursera and 20+ premium subscriptions at the best prices in Bangladesh. Instant delivery, full warranty." },
      { property: "og:title", content: "AccessNow BD — Premium Digital Subscriptions in Bangladesh" },
      { property: "og:description", content: "Instant delivery, verified accounts, 30-day warranty. Pay with bKash, Nagad or card." },
    ],
  }),
});

const SLIDES = [
  {
    img: heroPayment,
    eyebrow: "নতুন ফিচার",
    title: <>এখন <span className="text-aurora-strong">AccessNow&nbsp;BD</span><br/>সাবস্ক্রিপশন পেমেন্ট আরও সহজ</>,
    sub: "bKash, Nagad, Rocket অথবা যেকোনো কার্ড — মাত্র ৩০ সেকেন্ডে অর্ডার সম্পন্ন।",
    ctaLabel: "এখনই কিনুন",
    accent: "from-violet-600/40 via-fuchsia-600/30 to-rose-500/30",
  },
  {
    img: heroDelivery,
    eyebrow: "Instant Delivery",
    title: <>মাত্র <span className="text-aurora-strong">১০ মিনিটে</span><br/>ডেলিভারি — যেকোনো সময়</>,
    sub: "অফিস আওয়ার ১১টা–১১টা। অর্ডার করার সাথে সাথে ইমেইল ও WhatsApp-এ ডিটেইল পেয়ে যাবেন।",
    ctaLabel: "প্রোডাক্ট দেখুন",
    accent: "from-cyan-500/40 via-violet-500/30 to-emerald-500/30",
  },
  {
    img: heroWarranty,
    eyebrow: "Full Warranty",
    title: <><span className="text-aurora-strong">৩০ দিনের</span> ওয়ারেন্টি<br/>সম্পূর্ণ ভেরিফাইড অ্যাকাউন্ট</>,
    sub: "অ্যাকাউন্টে যেকোনো সমস্যা হলে রিপ্লেসমেন্ট অথবা টাকা ফেরত — কোনো প্রশ্ন ছাড়াই।",
    ctaLabel: "আরও জানুন",
    accent: "from-emerald-500/40 via-violet-500/25 to-amber-400/30",
  },
  {
    img: heroEducation,
    eyebrow: "Education Bundle",
    title: <>স্টুডেন্টদের জন্য<br/><span className="text-aurora-strong">এডুকেশন বান্ডেল</span> অফার</>,
    sub: "Coursera, Grammarly, ChatGPT, Canva — একসাথে নিলে এক্সট্রা ডিসকাউন্ট।",
    ctaLabel: "বান্ডেল দেখুন",
    accent: "from-amber-500/35 via-rose-500/25 to-violet-600/30",
  },
] as const;

function Index() {
  const { products } = useProducts();

  // Stable section selections
  const top = useMemo(() => products.slice(0, 8), [products]);
  const streaming = useMemo(() => products.filter((p) => p.category === "Streaming"), [products]);
  const ai = useMemo(() => products.filter((p) => p.category === "AI Tools" || p.category === "Productivity"), [products]);
  const education = useMemo(() => products.filter((p) => p.category === "Education" || p.category === "Design"), [products]);

  return (
    <div className="min-h-screen relative">
      <SiteHeader />
      <HeroSlider />
      <FloatingPill />
      <ProductGrid title="⭐ Top Picks for You" subtitle="বাংলাদেশে সবচেয়ে জনপ্রিয় সাবস্ক্রিপশন" items={top} cap={8} viewAllTo="/products" />
      <ProductRail title="🎬 Streaming Services" subtitle="Netflix, Prime, HBO, Disney+, Hoichoi — সব এক জায়গায়" items={streaming} viewAllTo="/streaming" />
      <ProductRail title="🤖 AI & Productivity Tools" subtitle="ChatGPT, Claude, Gemini, Grammarly এবং আরও" items={ai} viewAllTo="/ai-tools" />
      <ProductRail title="🎓 Educational Tools" subtitle="Coursera, Canva Pro, CapCut, Adobe — শিখতে ও বানাতে" items={education} viewAllTo="/education" />
      <TrustStrip />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <NewsletterCTA />
      <SiteFooter />
    </div>
  );
}

/* ================= Hero slider ================= */

function HeroSlider() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = SLIDES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [paused, total]);

  const slide = SLIDES[idx];
  return (
    <section className="relative bg-[#07071a] text-white overflow-hidden">
      {/* aurora glow */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${slide.accent} transition-all duration-700`} />
      <div className="pointer-events-none absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-primary/40 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[480px] h-[480px] rounded-full bg-[var(--color-aqua)]/35 blur-[140px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 py-12 md:py-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center min-h-[480px] md:min-h-[560px]">
        <div key={idx} className="animate-[fadeInUp_0.5s_ease-out]">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-gold)]" /> {slide.eyebrow}
          </span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.025em" }}>
            {slide.title}
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/75 max-w-xl leading-relaxed">{slide.sub}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/products" className="h-12 px-7 inline-flex items-center rounded-full bg-aurora text-white text-sm font-bold hover:scale-105 transition glow-violet">
              {slide.ctaLabel}
            </Link>
            <a href="https://wa.me/8801000000000" className="h-12 px-7 inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>

          {/* Payment strip */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/55 mr-1">Pay with:</span>
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard", "Amex"].map((p) => (
              <span key={p} className="px-2.5 py-1.5 rounded-md bg-white/10 border border-white/10 text-[11px] font-semibold tracking-wide">{p}</span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(120,80,255,0.45)]">
            <img src={slide.img} alt="" width={1600} height={900} className="w-full h-auto object-cover aspect-[16/10]" />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15">
            <div className="flex -space-x-2">
              {[1,2,3].map((i) => <div key={i} className="w-8 h-8 rounded-full bg-aurora border-2 border-[#07071a]" />)}
            </div>
            <div>
              <div className="text-sm font-bold">10,000+ happy users</div>
              <div className="flex items-center gap-1 text-xs text-white/70">
                {[1,2,3,4,5].map((i) => <Star key={i} className="w-3 h-3 fill-[var(--color-gold)] text-[var(--color-gold)]" />)}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* slider controls */}
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setIdx((i) => (i - 1 + total) % total)} className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition" aria-label="Previous">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % total)} className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition" aria-label="Next">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setPaused((p) => !p)} className="grid place-items-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition" aria-label={paused ? "Play" : "Pause"}>
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i+1}`}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-3 bg-white/30 hover:bg-white/50"}`} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .text-aurora-strong { background-image: linear-gradient(135deg, #c4b5fd 0%, #67e8f9 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
      `}</style>
    </section>
  );
}

/* ================= Floating CTA pill (mirrors fanflix "instant code") ================= */

function FloatingPill() {
  return (
    <div className="relative -mt-7 mb-2 flex justify-center px-4 z-10">
      <Link to="/products" className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#0b0b1a] text-white text-sm font-bold shadow-[0_18px_40px_-12px_rgba(109,92,246,0.7)] border border-white/10 hover:scale-105 transition">
        <span className="grid place-items-center w-6 h-6 rounded-full bg-[var(--color-success)]"><Zap className="w-3.5 h-3.5 text-black" /></span>
        Get Instant Subscription Access
      </Link>
    </div>
  );
}

/* ================= Sections ================= */

import type { Product } from "@/data/products";

function SectionHead({ title, subtitle, viewAllTo }: { title: string; subtitle: string; viewAllTo: "/products" | "/streaming" | "/ai-tools" | "/education" }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800 }}>{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <Link to={viewAllTo} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass text-xs font-bold hover:bg-white/80 transition">
        View all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function ProductGrid({ title, subtitle, items, cap, viewAllTo }: { title: string; subtitle: string; items: Product[]; cap: number; viewAllTo: "/products" | "/streaming" | "/ai-tools" | "/education" }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-14">
      <SectionHead title={title} subtitle={subtitle} viewAllTo={viewAllTo} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {items.slice(0, cap).map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}

function ProductRail({ title, subtitle, items, viewAllTo }: { title: string; subtitle: string; items: Product[]; viewAllTo: "/streaming" | "/ai-tools" | "/education" }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800 }}>{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="hidden md:grid place-items-center w-9 h-9 rounded-full glass hover:bg-white/80 transition" aria-label="Scroll left"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scroll(1)} className="hidden md:grid place-items-center w-9 h-9 rounded-full glass hover:bg-white/80 transition" aria-label="Scroll right"><ChevronRight className="w-4 h-4" /></button>
          <Link to={viewAllTo} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass text-xs font-bold hover:bg-white/80 transition">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 md:gap-5 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <div key={p.slug} className="snap-start shrink-0 w-[55%] sm:w-[40%] md:w-[28%] lg:w-[22%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: Zap, t: "১০ মিনিটে ডেলিভারি", s: "Fastest in Bangladesh" },
    { icon: Shield, t: "৩০ দিনের ওয়ারেন্টি", s: "Full replacement guarantee" },
    { icon: Sparkles, t: "ভেরিফাইড অ্যাকাউন্ট", s: "100% genuine subscriptions" },
    { icon: Headphones, t: "২৪/৭ সাপোর্ট", s: "WhatsApp + email" },
  ];
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.t} className="glass rounded-2xl p-5 flex items-start gap-3">
            <div className="grid place-items-center w-11 h-11 shrink-0 rounded-2xl bg-aurora text-white glow-violet">
              <it.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">{it.t}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{it.s}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "প্রোডাক্ট সিলেক্ট করুন", d: "ক্যাটেগরি থেকে আপনার পছন্দের সাবস্ক্রিপশন বেছে নিন।" },
    { n: "02", t: "পেমেন্ট সম্পন্ন করুন", d: "bKash, Nagad, Rocket অথবা কার্ড দিয়ে সহজেই পে করুন।" },
    { n: "03", t: "মাত্র ১০ মিনিটে ডেলিভারি", d: "অ্যাকাউন্টের ডিটেইল ইমেইল ও WhatsApp-এ পেয়ে যাবেন।" },
  ];
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800 }}>
          কিভাবে কাজ করে?
        </h2>
        <p className="text-muted-foreground mt-2">তিনটি সহজ ধাপে আপনার প্রিমিয়াম সাবস্ক্রিপশন।</p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s) => (
          <div key={s.n} className="glass-strong rounded-2xl p-6 relative overflow-hidden">
            <div className="text-7xl font-black text-aurora opacity-20 absolute -top-2 right-4 select-none">{s.n}</div>
            <div className="relative">
              <h3 className="text-base font-bold tracking-tight">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { name: "Rakib H.", city: "Dhaka", text: "অর্ডার করার ১০ মিনিটের মধ্যে Netflix অ্যাকাউন্ট পেয়ে গেছি। দাম ও সাপোর্ট দুটোই দারুণ।" },
    { name: "Tahsin K.", city: "Chattogram", text: "ChatGPT Plus নিয়েছি এখান থেকে। দুই মাস পেরিয়ে গেছে, কোনো সমস্যা নেই।" },
    { name: "Maliha R.", city: "Sylhet", text: "Canva Pro আর Coursera Plus একসাথে নিলাম, এক্সট্রা ডিসকাউন্ট পেয়েছি। হাইলি রেকমেন্ডেড।" },
    { name: "Sajid I.", city: "Khulna", text: "WhatsApp-এ রাত ১১টায়ও রিপ্লাই পেলাম। সাপোর্ট টিম ফাস্ট।" },
  ];
  return (
    <section className="bg-[#07071a] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/3 w-[420px] h-[420px] rounded-full bg-primary/30 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 right-0 w-[420px] h-[420px] rounded-full bg-[var(--color-aqua)]/30 blur-[140px]" />
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800 }}>
            ১০,০০০+ <span className="text-aurora-strong">সন্তুষ্ট গ্রাহক</span>
          </h2>
          <p className="text-white/70 mt-2">তাদের অভিজ্ঞতা — আপনার আত্মবিশ্বাস।</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-md">
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map((j) => <Star key={j} className="w-3.5 h-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]" />)}
              </div>
              <p className="text-sm text-white/85 leading-relaxed">"{r.text}"</p>
              <div className="mt-4 text-xs">
                <div className="font-bold">{r.name}</div>
                <div className="text-white/55">{r.city}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "কিভাবে সাবস্ক্রিপশন ডেলিভারি হবে?", a: "পেমেন্ট কনফার্ম হওয়ার পর সাধারণত ১০–৩০ মিনিটের মধ্যে অ্যাকাউন্টের ডিটেইল আপনার ইমেইল ও WhatsApp-এ পাঠানো হবে।" },
  { q: "পেমেন্ট মেথড কী কী?", a: "bKash, Nagad, Rocket, Upay এবং সব ধরনের ভিসা / মাস্টারকার্ড / অ্যামেক্স কার্ড সাপোর্ট করি।" },
  { q: "অ্যাকাউন্টে সমস্যা হলে কি হবে?", a: "৩০ দিনের ফুল ওয়ারেন্টি — সমস্যা হলে রিপ্লেসমেন্ট অথবা টাকা ফেরত। শুধু WhatsApp-এ মেসেজ দিলেই হবে।" },
  { q: "একই অ্যাকাউন্ট কতজন ব্যবহার করতে পারবে?", a: "প্রোডাক্ট অনুযায়ী আলাদা — প্রোডাক্ট পেজে \"Features\" সেকশনে স্পষ্টভাবে লেখা থাকে।" },
  { q: "অর্ডার ট্র্যাক করব কীভাবে?", a: "সাইন ইন করার পর \"My Orders\" পেজে আপনার সব অর্ডারের স্ট্যাটাস দেখতে পারবেন।" },
  { q: "অফিস আওয়ার কখন?", a: "প্রতিদিন সকাল ১১টা থেকে রাত ১১টা পর্যন্ত। জরুরি প্রয়োজনে রাতেও WhatsApp-এ চেষ্টা করি।" },
  { q: "Education / Bundle ডিসকাউন্ট কীভাবে পাব?", a: "এডুকেশন বান্ডেলে দু'টি বা তার বেশি প্রোডাক্ট কার্টে যোগ করলে চেকআউটে অটো-ডিসকাউন্ট অ্যাপ্লাই হবে।" },
  { q: "ইনভয়েস বা রিসিট কি পাব?", a: "প্রতিটি অর্ডারের পরে অটোমেটিক ইনভয়েস ইমেইলে পাঠানো হয়। প্রয়োজনে অর্ডার পেজ থেকে ডাউনলোড করা যাবে।" },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-16">
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <span className="inline-flex px-3 py-1 rounded-full glass text-xs font-bold mb-3">FAQ</span>
          <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, lineHeight: 1.15 }}>
            প্রশ্ন আছে? <br /><span className="text-aurora">উত্তর এখানে।</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            যদি আপনার প্রশ্নের উত্তর এখানে না পান, সরাসরি WhatsApp-এ মেসেজ করুন — আমরা সবসময় হাজির।
          </p>
          <Link to="/faq" className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-aurora text-white text-xs font-bold glow-violet">
            সব প্রশ্ন দেখুন <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="md:col-span-2 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? null : i)}
                className={`w-full text-left glass-strong rounded-2xl px-5 py-4 transition ${isOpen ? "ring-2 ring-primary/30" : ""}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm md:text-base font-bold tracking-tight">{f.q}</span>
                  <span className="grid place-items-center w-7 h-7 rounded-full bg-aurora text-white shrink-0">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </div>
                {isOpen && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NewsletterCTA() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 pb-16">
      <div className="relative rounded-3xl bg-aurora text-white p-8 md:p-14 overflow-hidden glow-violet">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[var(--color-gold)]/30 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, lineHeight: 1.15 }}>
              নতুন অফারের আপডেট পেতে চান?
            </h2>
            <p className="mt-3 text-white/85 max-w-md">নতুন প্রোডাক্ট ও ডিসকাউন্ট এলেই WhatsApp / ইমেইলে সবার আগে জানিয়ে দেব।</p>
          </div>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input type="email" required placeholder="your@email.com"
              className="flex-1 h-12 px-5 rounded-full bg-white/95 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-white" />
            <button className="h-12 px-7 rounded-full bg-[#0b0b1a] text-white text-sm font-bold hover:scale-105 transition">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

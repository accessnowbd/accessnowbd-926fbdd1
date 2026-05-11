import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Zap, Shield, Headphones, Star, Plus, Minus, MessageCircle } from "lucide-react";
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

const HOMEPAGE_SECTIONS: { title: string; subtitle: string; category: string }[] = [
  { title: "📺 OTT & Streaming Platforms", subtitle: "Netflix, Prime Video, YouTube Premium, Hoichoi, Chorki — সব এক জায়গায়", category: "OTT & Streaming" },
  { title: "🪟 Windows", subtitle: "অরিজিনাল Windows 10/11 Pro লাইসেন্স কী — লাইফটাইম", category: "Windows" },
  { title: "📊 Microsoft Office", subtitle: "Office 2016/2019/2021 Pro Plus + Microsoft 365", category: "Microsoft Office" },
  { title: "🤖 AI & Education Tools", subtitle: "ChatGPT, Claude, Gemini, Spotify, Coursera, Grammarly এবং আরও", category: "AI & Education" },
  { title: "🎨 Editing Tools", subtitle: "Canva Pro, CapCut Pro, Adobe CC, Freepik, AutoDesk", category: "Editing Tools" },
  { title: "💼 Software & Productivity", subtitle: "Truecaller, Zoom Pro, Google One — কাজের জরুরি টুলস", category: "Software & Productivity" },
  { title: "🛡️ VPN & Security", subtitle: "NordVPN, ExpressVPN, SurfShark — secure browsing", category: "VPN & Security" },
  { title: "🎁 Giftcards", subtitle: "Apple iTunes, App Store gift cards — instant delivery", category: "Giftcards" },
];

function Index() {
  const { products } = useProducts();
  const top = useMemo(() => {
    // Pick top picks across categories — first product of each category, then fill
    const seen = new Set<string>();
    const picks: Product[] = [];
    for (const p of products) {
      if (!seen.has(p.category) && picks.length < 4) {
        picks.push(p);
        seen.add(p.category);
      }
    }
    for (const p of products) {
      if (picks.length >= 8) break;
      if (!picks.includes(p)) picks.push(p);
    }
    return picks;
  }, [products]);

  const sectioned = useMemo(
    () => HOMEPAGE_SECTIONS.map((s) => ({ ...s, items: products.filter((p) => p.category === s.category) })),
    [products]
  );

  return (
    <div className="min-h-screen relative">
      <SiteHeader />
      <HeroLanding />

      <CategoryShowcase />

      <ProductGrid title="⭐ Top Picks for You" subtitle="বাংলাদেশে সবচেয়ে জনপ্রিয় সাবস্ক্রিপশন" items={top} cap={8} viewAllTo="/products" />

      {sectioned.map((s) => (
        <ProductRail key={s.category} title={s.title} subtitle={s.subtitle} items={s.items} viewAllTo="/products" />
      ))}

      <TrustStrip />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <NewsletterCTA />
      <SiteFooter />
    </div>
  );
}

/* ================= Premium Hero Landing ================= */

const HERO_HIGHLIGHTS = [
  { eyebrow: "নতুন ফিচার", title: "AccessNow BD", sub: "সাবস্ক্রিপশন পেমেন্ট এখন আরও সহজ", img: heroPayment, accent: "from-violet-600/40 via-fuchsia-600/30 to-rose-500/30" },
  { eyebrow: "Instant Delivery", title: "১০ মিনিটে", sub: "ডেলিভারি — যেকোনো সময়", img: heroDelivery, accent: "from-cyan-500/40 via-violet-500/30 to-emerald-500/30" },
  { eyebrow: "Full Warranty", title: "৩০ দিনের", sub: "ওয়ারেন্টি — ভেরিফাইড অ্যাকাউন্ট", img: heroWarranty, accent: "from-emerald-500/40 via-violet-500/25 to-amber-400/30" },
  { eyebrow: "Education Bundle", title: "এক্সট্রা ছাড়", sub: "স্টুডেন্ট বান্ডেল অফার চলছে", img: heroEducation, accent: "from-amber-500/35 via-rose-500/25 to-violet-600/30" },
] as const;

const BRAND_CHIPS = ["Netflix", "ChatGPT Plus", "Spotify", "Canva Pro", "Prime Video", "Coursera", "Grammarly", "Disney+", "YouTube Premium", "Adobe CC", "Hoichoi", "Claude"];

const ACTIVITY = [
  { name: "Rakib H.", action: "কিনেছেন", item: "Netflix Premium", ago: "২ মিনিট আগে" },
  { name: "Tahsin K.", action: "অর্ডার করেছেন", item: "ChatGPT Plus", ago: "৫ মিনিট আগে" },
  { name: "Maliha R.", action: "নিয়েছেন", item: "Canva Pro", ago: "৮ মিনিট আগে" },
  { name: "Sajid I.", action: "কিনেছেন", item: "Spotify Family", ago: "১২ মিনিট আগে" },
  { name: "Nabila A.", action: "নিয়েছেন", item: "Coursera Plus", ago: "১৮ মিনিট আগে" },
];

function HeroLanding() {
  const [idx, setIdx] = useState(0);
  const [activityIdx, setActivityIdx] = useState(0);
  const total = HERO_HIGHLIGHTS.length;

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);

  useEffect(() => {
    const t = setInterval(() => setActivityIdx((i) => (i + 1) % ACTIVITY.length), 3500);
    return () => clearInterval(t);
  }, []);

  const slide = HERO_HIGHLIGHTS[idx];
  const activity = ACTIVITY[activityIdx];

  return (
    <section className="relative bg-[#07071a] text-white overflow-hidden">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${slide.accent} transition-all duration-[1200ms]`} />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_30%,rgba(168,85,247,0.4),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.35),transparent_50%),radial-gradient(circle_at_50%_100%,rgba(236,72,153,0.3),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,transparent,#07071a_92%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 pt-12 md:pt-20 pb-8">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold backdrop-blur-md">
              <span className="relative flex w-2 h-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" /></span>
              <span>Live · {slide.eyebrow}</span>
            </div>

            <h1 className="mt-5" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(34px, 6vw, 68px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
              <span className="block text-white/95">প্রিমিয়াম সাবস্ক্রিপশন,</span>
              <span key={idx} className="block text-aurora-strong animate-[fadeInUp_0.6s_ease-out]">{slide.title}</span>
              <span className="block text-white/80" style={{ fontSize: "0.55em", fontWeight: 500, marginTop: "0.5em", letterSpacing: "-0.01em" }}>{slide.sub}</span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
              Netflix, ChatGPT Plus, Spotify, Canva Pro সহ ২০+ ভেরিফাইড সাবস্ক্রিপশন — bKash, Nagad বা কার্ডে। ১০ মিনিটে ডেলিভারি, ৩০ দিনের ওয়ারেন্টি।
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="group inline-flex items-center gap-2 rounded-full bg-aurora text-white text-sm font-bold glow-violet hover:scale-[1.03] transition-all" style={{ height: 52, paddingLeft: 28, paddingRight: 24 }}>
                <Zap className="w-4 h-4" /> Get Instant Access
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
              <a href="https://wa.me/8801000000000" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-semibold hover:bg-white/15 transition" style={{ height: 52, paddingLeft: 28, paddingRight: 28 }}>
                <MessageCircle className="w-4 h-4 text-[#25D366]" /> WhatsApp Order
              </a>
            </div>

            <div className="mt-7 inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-full overflow-hidden">
              <div className="grid place-items-center w-8 h-8 rounded-full bg-aurora text-[10px] font-bold shrink-0">{activity.name.split(" ").map((s) => s[0]).join("")}</div>
              <div key={activityIdx} className="text-xs text-white/85 animate-[fadeInUp_0.4s_ease-out] truncate">
                <b className="text-white">{activity.name}</b> {activity.action}{" "}
                <b className="text-aurora-strong">{activity.item}</b> · <span className="text-white/55">{activity.ago}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-6 grid-rows-6 gap-3 md:gap-4 h-[460px] md:h-[540px]">
            <div className="col-span-6 row-span-3 relative rounded-3xl overflow-hidden border border-white/10 group">
              <img src={slide.img} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold">Featured</div>
                  <div className="text-base md:text-lg font-bold mt-1">{slide.eyebrow}</div>
                </div>
                <div className="flex gap-1.5">
                  {HERO_HIGHLIGHTS.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-3 row-span-2 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-4 md:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-[var(--color-gold)] text-[var(--color-gold)]" />)}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl md:text-3xl font-extrabold text-aurora-strong">৪.৯/৫</div>
                <div className="text-[11px] text-white/60 mt-0.5">10,000+ রিভিউ</div>
              </div>
            </div>

            <div className="col-span-3 row-span-2 rounded-3xl bg-aurora p-4 md:p-5 flex flex-col justify-between glow-violet relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15 blur-2xl" />
              <div className="relative grid place-items-center w-9 h-9 rounded-full bg-white/20"><Zap className="w-4 h-4" /></div>
              <div className="relative">
                <div style={{ fontFamily: "var(--font-display)" }} className="text-2xl md:text-3xl font-extrabold">১০ মিনিট</div>
                <div className="text-[11px] text-white/85 mt-0.5">গড় ডেলিভারি টাইম</div>
              </div>
            </div>

            <div className="col-span-6 row-span-1 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md px-4 md:px-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid place-items-center w-8 h-8 rounded-xl bg-white/10 shrink-0"><Shield className="w-4 h-4 text-emerald-300" /></div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">৩০ দিনের ফুল ওয়ারেন্টি</div>
                  <div className="text-[10px] text-white/55 truncate">Replacement বা টাকা ফেরত</div>
                </div>
              </div>
              <div className="flex -space-x-2 shrink-0">
                {[1, 2, 3, 4].map((i) => <div key={i} className="w-7 h-7 rounded-full bg-aurora border-2 border-[#07071a]" />)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 md:mt-16 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/45 font-semibold">Trusted brands</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex gap-3 animate-[marquee_38s_linear_infinite] w-max">
              {[...BRAND_CHIPS, ...BRAND_CHIPS].map((b, i) => (
                <span key={i} className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs font-semibold text-white/80 whitespace-nowrap backdrop-blur-sm">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .text-aurora-strong { background-image: linear-gradient(135deg, #c4b5fd 0%, #67e8f9 60%, #f0abfc 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
      `}</style>
    </section>
  );
}


/* ================= Sections ================= */

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

function ProductRail({ title, subtitle, items, viewAllTo }: { title: string; subtitle: string; items: Product[]; viewAllTo: "/products" | "/streaming" | "/ai-tools" | "/education" }) {
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

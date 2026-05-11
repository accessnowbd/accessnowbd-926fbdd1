import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Zap, Shield, Headphones, Plus, Minus, MessageCircle, ArrowUpRight } from "lucide-react";
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

function Index() {
  const { products } = useProducts();

  const top = useMemo(() => products.slice(0, 8), [products]);
  const streaming = useMemo(() => products.filter((p) => p.category === "Streaming"), [products]);
  const ai = useMemo(() => products.filter((p) => p.category === "AI Tools" || p.category === "Productivity"), [products]);
  const education = useMemo(() => products.filter((p) => p.category === "Education" || p.category === "Design"), [products]);

  return (
    <div className="min-h-screen relative">
      <SiteHeader />
      <HeroLanding featured={top.slice(0, 4)} />

      <ProductGrid title="Top Picks" subtitle="বাংলাদেশে সবচেয়ে জনপ্রিয় সাবস্ক্রিপশন" items={top} cap={8} viewAllTo="/products" eyebrow="Editor's selection" />
      <ProductRail title="Streaming" subtitle="Netflix, Prime, HBO, Disney+, Hoichoi — সব এক জায়গায়" items={streaming} viewAllTo="/streaming" eyebrow="Vol. 01" />
      <ProductRail title="AI & Productivity" subtitle="ChatGPT, Claude, Gemini, Grammarly এবং আরও" items={ai} viewAllTo="/ai-tools" eyebrow="Vol. 02" />
      <ProductRail title="Education & Design" subtitle="Coursera, Canva Pro, CapCut, Adobe — শিখতে ও বানাতে" items={education} viewAllTo="/education" eyebrow="Vol. 03" />
      <TrustStrip />
      <HowItWorks />
      <Testimonials />
      <FaqSection />
      <NewsletterCTA />
      <SiteFooter />
    </div>
  );
}

/* ================= Editorial Hero — Paper & Ink ================= */

const HERO_TILES = [
  { eyebrow: "Issue 04", title: "Instant", img: heroPayment },
  { eyebrow: "Delivery", title: "10 min", img: heroDelivery },
  { eyebrow: "Warranty", title: "30 days", img: heroWarranty },
  { eyebrow: "Bundle", title: "Student", img: heroEducation },
] as const;

const BRAND_CHIPS = ["Netflix", "ChatGPT Plus", "Spotify", "Canva Pro", "Prime Video", "Coursera", "Grammarly", "Disney+", "YouTube Premium", "Adobe CC", "Hoichoi", "Claude"];

function HeroLanding({ featured }: { featured: Product[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_TILES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const slide = HERO_TILES[idx];

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 pt-10 md:pt-14 pb-14">
        {/* Top editorial masthead */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-foreground/15">
          <div className="editorial-eyebrow text-foreground/60">№ 04 · Spring Edition · 2026</div>
          <div className="hidden sm:flex items-center gap-2 editorial-eyebrow text-foreground/60">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-foreground opacity-60 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-foreground" />
            </span>
            Open · 11 AM – 11 PM
          </div>
        </div>

        {/* Display headline */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-end pt-10 md:pt-14">
          <div>
            <h1
              className="display-serif text-foreground"
              style={{ fontSize: "clamp(48px, 9.5vw, 132px)" }}
            >
              <span className="block">Premium</span>
              <span className="block italic font-medium" style={{ fontFamily: "var(--font-display)" }}>
                subscriptions,
              </span>
              <span className="block">delivered.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base md:text-lg text-foreground/70 leading-relaxed">
              Netflix, ChatGPT Plus, Spotify, Canva Pro সহ ২০+ ভেরিফাইড
              সাবস্ক্রিপশন — bKash, Nagad বা কার্ডে। ১০ মিনিটে ডেলিভারি,
              ৩০ দিনের ওয়ারেন্টি।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 h-12 pl-6 pr-4 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition"
              >
                Browse the catalog
                <span className="grid place-items-center w-7 h-7 rounded-full bg-background text-foreground group-hover:rotate-45 transition">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </Link>
              <a
                href="https://wa.me/8801000000000"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full glass-soft text-foreground text-sm font-semibold hover:bg-foreground/5 transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp order
              </a>
            </div>
          </div>

          {/* Editorial side column */}
          <aside className="relative">
            <div className="grid grid-cols-2 gap-3">
              {HERO_TILES.map((t, i) => (
                <button
                  key={t.eyebrow}
                  onClick={() => setIdx(i)}
                  className={`relative aspect-[4/5] rounded-xl overflow-hidden border transition ${
                    i === idx ? "border-foreground" : "border-foreground/15 hover:border-foreground/40"
                  }`}
                >
                  <img src={t.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-left text-background">
                    <div className="editorial-eyebrow opacity-80">{t.eyebrow}</div>
                    <div className="display-serif text-2xl mt-0.5">{t.title}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat value="10k+" label="Customers" />
              <Stat value="4.9" label="Rating / 5" />
              <Stat value="20+" label="Brands" />
            </div>

            <div className="mt-4 glass-soft rounded-xl p-4 flex items-start gap-3">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-foreground text-background shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </span>
              <div className="text-xs leading-relaxed text-foreground/75">
                <b className="text-foreground">৩০ দিনের ওয়ারেন্টি</b> · যেকোনো সমস্যায়
                replacement বা refund — শুধু WhatsApp-এ মেসেজ।
              </div>
            </div>

            <div className="absolute -top-4 -right-2 hidden lg:flex flex-col items-center gap-1 text-foreground/40">
              <span className="editorial-eyebrow">№</span>
              <span className="display-serif text-3xl">{String(idx + 1).padStart(2, "0")}</span>
            </div>
          </aside>
        </div>

        {/* Featured rail — newspaper style */}
        {featured.length > 0 && (
          <div className="mt-16 pt-8 border-t border-foreground/15">
            <div className="flex items-end justify-between mb-5">
              <div>
                <div className="editorial-eyebrow text-foreground/60">In this issue</div>
                <h3 className="display-serif text-2xl md:text-3xl mt-1">Featured drops</h3>
              </div>
              <Link to="/products" className="text-xs font-semibold border-b border-foreground/40 hover:border-foreground transition pb-0.5">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {featured.map((p) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        )}

        {/* Brand marquee */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-foreground/15" />
            <span className="editorial-eyebrow text-foreground/55">Trusted brands</span>
            <div className="h-px flex-1 bg-foreground/15" />
          </div>
          <div className="relative overflow-hidden marquee-mask">
            <div className="flex gap-3 animate-[marquee_40s_linear_infinite] w-max">
              {[...BRAND_CHIPS, ...BRAND_CHIPS].map((b, i) => (
                <span key={i} className="px-4 py-2 rounded-full border border-foreground/15 text-xs font-semibold text-foreground/75 whitespace-nowrap">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-foreground/15 px-3 py-3">
      <div className="display-serif text-2xl">{value}</div>
      <div className="editorial-eyebrow text-foreground/55 mt-1">{label}</div>
    </div>
  );
}

/* ================= Sections ================= */

function SectionHead({
  title,
  subtitle,
  viewAllTo,
  eyebrow,
}: {
  title: string;
  subtitle: string;
  viewAllTo: "/products" | "/streaming" | "/ai-tools" | "/education";
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-7 pb-4 border-b border-foreground/15">
      <div>
        {eyebrow && <div className="editorial-eyebrow text-foreground/55 mb-2">{eyebrow}</div>}
        <h2 className="display-serif" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>{title}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">{subtitle}</p>
      </div>
      <Link to={viewAllTo} className="inline-flex items-center gap-1.5 text-xs font-semibold border-b border-foreground/40 hover:border-foreground pb-0.5 transition">
        See all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function ProductGrid({ title, subtitle, items, cap, viewAllTo, eyebrow }: { title: string; subtitle: string; items: Product[]; cap: number; viewAllTo: "/products" | "/streaming" | "/ai-tools" | "/education"; eyebrow?: string }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-14">
      <SectionHead title={title} subtitle={subtitle} viewAllTo={viewAllTo} eyebrow={eyebrow} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {items.slice(0, cap).map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}

function ProductRail({ title, subtitle, items, viewAllTo, eyebrow }: { title: string; subtitle: string; items: Product[]; viewAllTo: "/streaming" | "/ai-tools" | "/education"; eyebrow?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 pb-4 border-b border-foreground/15">
        <div>
          {eyebrow && <div className="editorial-eyebrow text-foreground/55 mb-2">{eyebrow}</div>}
          <h2 className="display-serif" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>{title}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll(-1)} className="hidden md:grid place-items-center w-10 h-10 rounded-full border border-foreground/20 hover:bg-foreground hover:text-background transition" aria-label="Scroll left"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scroll(1)} className="hidden md:grid place-items-center w-10 h-10 rounded-full border border-foreground/20 hover:bg-foreground hover:text-background transition" aria-label="Scroll right"><ChevronRight className="w-4 h-4" /></button>
          <Link to={viewAllTo} className="inline-flex items-center gap-1.5 text-xs font-semibold border-b border-foreground/40 hover:border-foreground pb-0.5 transition">
            See all <ChevronRight className="w-3.5 h-3.5" />
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
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/15 border border-foreground/15 rounded-2xl overflow-hidden">
        {items.map((it) => (
          <div key={it.t} className="bg-background p-6 flex items-start gap-4">
            <div className="grid place-items-center w-11 h-11 shrink-0 rounded-full border border-foreground/20">
              <it.icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">{it.t}</div>
              <div className="text-xs text-muted-foreground mt-1">{it.s}</div>
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
    { n: "03", t: "১০ মিনিটে ডেলিভারি", d: "অ্যাকাউন্টের ডিটেইল ইমেইল ও WhatsApp-এ পেয়ে যাবেন।" },
  ];
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-16">
      <div className="max-w-2xl mb-10">
        <div className="editorial-eyebrow text-foreground/55 mb-2">The process</div>
        <h2 className="display-serif" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
          কিভাবে কাজ করে?
        </h2>
        <p className="text-muted-foreground mt-3">তিনটি সহজ ধাপে আপনার প্রিমিয়াম সাবস্ক্রিপশন।</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <div key={s.n} className="relative pt-6 border-t border-foreground/20">
            <div className="flex items-baseline justify-between">
              <div className="display-serif text-5xl">{s.n}</div>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-foreground/30 hidden md:block" />}
            </div>
            <h3 className="mt-5 text-lg font-bold tracking-tight">{s.t}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
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
    <section className="bg-foreground text-background relative overflow-hidden">
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 py-20">
        <div className="max-w-2xl mb-12">
          <div className="editorial-eyebrow text-background/60 mb-2">Letters</div>
          <h2 className="display-serif" style={{ fontSize: "clamp(32px, 5vw, 64px)" }}>
            10,000+ <span className="italic font-medium">satisfied</span> readers.
          </h2>
          <p className="text-background/70 mt-3">তাদের অভিজ্ঞতা — আপনার আত্মবিশ্বাস।</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-background/15 border border-background/15">
          {reviews.map((r, i) => (
            <div key={i} className="bg-foreground p-6">
              <div className="display-serif text-4xl text-background/40 leading-none">"</div>
              <p className="text-sm text-background/85 leading-relaxed mt-2">{r.text}</p>
              <div className="mt-6 pt-4 border-t border-background/20 text-xs">
                <div className="font-bold text-background">{r.name}</div>
                <div className="text-background/55 mt-0.5">{r.city}</div>
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
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-20">
      <div className="grid md:grid-cols-3 gap-10 items-start">
        <div className="md:col-span-1">
          <div className="editorial-eyebrow text-foreground/55 mb-2">FAQ</div>
          <h2 className="display-serif" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
            প্রশ্ন আছে?
            <br />
            <span className="italic font-medium">উত্তর এখানে।</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-sm">
            যদি আপনার প্রশ্নের উত্তর এখানে না পান, সরাসরি WhatsApp-এ মেসেজ করুন — আমরা সবসময় হাজির।
          </p>
          <Link to="/faq" className="mt-6 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition">
            সব প্রশ্ন দেখুন <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="md:col-span-2 border-t border-foreground/15">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={i}
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left py-5 border-b border-foreground/15 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-base md:text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{f.q}</span>
                  <span className="grid place-items-center w-8 h-8 rounded-full border border-foreground/20 shrink-0 group-hover:bg-foreground group-hover:text-background transition">
                    {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </span>
                </div>
                {isOpen && <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">{f.a}</p>}
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
    <section className="mx-auto max-w-[1440px] px-4 md:px-10 pb-20">
      <div className="relative rounded-3xl border border-foreground/15 bg-background p-8 md:p-14 overflow-hidden">
        <div className="absolute top-0 right-0 display-serif text-[18rem] leading-none text-foreground/[0.04] select-none pointer-events-none -mt-12 -mr-6">
          ✦
        </div>
        <div className="relative grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="editorial-eyebrow text-foreground/55 mb-3">Subscribe</div>
            <h2 className="display-serif" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
              নতুন অফারের <span className="italic font-medium">আপডেট</span> পেতে চান?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              নতুন প্রোডাক্ট ও ডিসকাউন্ট এলেই WhatsApp / ইমেইলে সবার আগে জানিয়ে দেব।
            </p>
          </div>
          <form className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:border sm:border-foreground/20 sm:rounded-full sm:p-1.5" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              className="flex-1 h-11 px-5 rounded-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none border border-foreground/20 sm:border-0"
            />
            <button className="h-11 px-7 rounded-full bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

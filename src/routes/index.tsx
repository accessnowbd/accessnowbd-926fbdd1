import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  Lock,
  RefreshCw,
  Flame,
  Star,
  Home as HomeIcon,
  Store,
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
      { title: "RxB Premium Store — Your Trusted Online Store" },
      { name: "description", content: "Premium digital subscriptions, software licenses, AI tools, OTT, VPN and more — instant delivery across Bangladesh." },
      { property: "og:title", content: "RxB Premium Store — Your Trusted Online Store" },
      { property: "og:description", content: "Premium digital subscriptions, software licenses, AI tools, OTT, VPN and more — instant delivery across Bangladesh." },
    ],
  }),
});

const CATEGORY_PILLS = [
  { label: "Home", icon: "🏠", anchor: "#top" },
  { label: "Shop", icon: "🛒", anchor: "#shop" },
  { label: "Top Picks", icon: "⭐", anchor: "#top-picks" },
  { label: "OTT & Streaming Platforms", icon: null, key: "OTT & Streaming" },
  { label: "Windows", icon: null, key: "Windows" },
  { label: "Microsoft Office", icon: null, key: "Microsoft Office" },
  { label: "AI & Education Tools", icon: null, key: "AI & Education" },
  { label: "Editing Tools", icon: null, key: "Editing Tools" },
  { label: "Software & Productivity", icon: null, key: "Software & Productivity" },
  { label: "VPN & Security", icon: null, key: "VPN & Security" },
  { label: "Giftcards", icon: null, key: "Giftcards" },
];

const HERO_SLIDES = [
  {
    bg: "linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 100%)",
    image: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=1600&q=80",
    title: "Windows 11 Pro License",
    subtitle: "Genuine activation key — instant delivery",
  },
  {
    bg: "linear-gradient(135deg, #831843 0%, #be123c 100%)",
    image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1600&q=80",
    title: "Premium OTT Subscriptions",
    subtitle: "Netflix · Prime · Hoichoi · Chorki",
  },
  {
    bg: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80",
    title: "AI & Productivity Tools",
    subtitle: "ChatGPT · Claude · Gemini · Grammarly",
  },
];

function Index() {
  const { products } = useProducts();

  const top = useMemo(() => pickTopProducts(products), [products]);
  const byCategory = useMemo(() => {
    const order = ["OTT & Streaming", "Windows", "Microsoft Office", "AI & Education", "Editing Tools", "Software & Productivity"];
    return order
      .map((cat) => ({ category: cat, items: products.filter((p) => p.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [products]);

  const flashSale = useMemo(() => {
    return products
      .filter((p) => p.plans[0]?.original)
      .map((p) => {
        const cur = Number((p.plans[0]?.price || "").replace(/[^\d]/g, "")) || 0;
        const orig = Number((p.plans[0]?.original || "").replace(/[^\d]/g, "")) || 0;
        const save = orig - cur;
        const pct = orig > 0 ? Math.round((save / orig) * 100) : 0;
        return { product: p, save, pct };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);
  }, [products]);

  return (
    <div id="top" className="min-h-screen bg-white">
      <SiteHeader />
      <main>
        <Hero />
        <CategoryBar />
        <FeaturedSection id="top-picks" eyebrow="BEST DEALS" title="Top Picks for You" emoji="⭐" items={top} viewAll="/products" />
        {byCategory.map((section) => (
          <CategorySection
            key={section.category}
            id={`shop-${slugify(section.category)}`}
            title={section.category.toUpperCase()}
            items={section.items}
          />
        ))}
        <FlashSaleSection deals={flashSale} />
        <WhyChooseBar />
        <WhyRxBSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function pickTopProducts(products: Product[]) {
  const seen = new Set<string>();
  const picked: Product[] = [];
  for (const product of products) {
    if (!seen.has(product.category)) {
      picked.push(product);
      seen.add(product.category);
    }
    if (picked.length >= 10) break;
  }
  return picked;
}

/* ───────── Hero carousel ───────── */
function Hero() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(t);
  }, [paused]);
  const prev = () => setIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const next = () => setIdx((i) => (i + 1) % HERO_SLIDES.length);
  const slide = HERO_SLIDES[idx];

  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-8 pt-6 pb-2">
      <div
        className="relative rounded-2xl overflow-hidden h-[260px] sm:h-[340px] md:h-[420px]"
        style={{ background: slide.bg }}
      >
        <img
          src={slide.image}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-700"
          key={idx}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />

        <div className="relative h-full flex flex-col justify-end p-6 md:p-12 max-w-2xl">
          <h2 className="text-white font-black tracking-tight text-2xl sm:text-3xl md:text-5xl leading-[1.05] drop-shadow-lg">
            {slide.title}
          </h2>
          <p className="mt-3 text-white/90 text-sm md:text-base font-medium drop-shadow">{slide.subtitle}</p>
        </div>

        {/* Prev arrow */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md text-foreground transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next arrow */}
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center w-11 h-11 rounded-full bg-white/95 hover:bg-white shadow-md text-foreground transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-7 bg-white" : "w-2 bg-white/55"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Pause / Play */}
        <button
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Play" : "Pause"}
          className="absolute bottom-4 right-4 grid place-items-center w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow-md text-foreground transition text-xs font-bold"
        >
          {paused ? "▶" : "❚❚"}
        </button>
      </div>
    </section>
  );
}

/* ───────── Horizontal category pills ───────── */
function CategoryBar() {
  const [active, setActive] = useState("Home");
  return (
    <section id="shop" className="mx-auto max-w-[1440px] px-4 md:px-8 py-5">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORY_PILLS.map((p) => (
          <a
            key={p.label}
            href={p.anchor || `#shop-${slugify(p.key || p.label)}`}
            onClick={() => setActive(p.label)}
            className="cat-pill shrink-0 inline-flex items-center gap-1.5 h-10 px-4 text-[13px] whitespace-nowrap"
            data-active={active === p.label}
          >
            {p.icon && <span>{p.icon}</span>}
            {p.label}
          </a>
        ))}
      </div>
    </section>
  );
}

/* ───────── Featured (Top Picks) ───────── */
function FeaturedSection({
  id, eyebrow, title, emoji, items, viewAll,
}: { id?: string; eyebrow: string; title: string; emoji?: string; items: Product[]; viewAll?: string }) {
  if (!items.length) return null;
  return (
    <section id={id} className="mx-auto max-w-[1440px] px-4 md:px-8 py-7">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="inline-block px-2.5 py-1 rounded-md bg-tint-pink text-[10px] font-extrabold tracking-[0.18em] text-[#e11d48] mb-2">
            {eyebrow}
          </div>
          <h2 className="text-[26px] md:text-[32px] font-black tracking-tight text-foreground">
            {emoji && <span className="mr-2">{emoji}</span>}{title}
          </h2>
        </div>
        {viewAll && (
          <Link to={viewAll as "/products"} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.slice(0, 5).map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
      {items.length > 5 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
          {items.slice(5, 10).map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      )}
    </section>
  );
}

/* ───────── Generic category section ───────── */
function CategorySection({ id, title, items }: { id?: string; title: string; items: Product[] }) {
  if (!items.length) return null;
  return (
    <section id={id} className="mx-auto max-w-[1440px] px-4 md:px-8 py-6">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-[18px] md:text-[20px] font-black tracking-wide text-foreground uppercase">{title}</h2>
        <Link to="/products" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-dark">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.slice(0, 5).map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>
    </section>
  );
}

/* ───────── Flash sale with countdown ───────── */
function FlashSaleSection({ deals }: { deals: Array<{ product: Product; save: number; pct: number }> }) {
  const [time, setTime] = useState(() => secondsUntilEndOfWeek());
  useEffect(() => {
    const t = setInterval(() => setTime(secondsUntilEndOfWeek()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!deals.length) return null;
  const days = Math.floor(time / 86400);
  const hrs = Math.floor((time % 86400) / 3600);
  const min = Math.floor((time % 3600) / 60);
  const sec = time % 60;

  return (
    <section className="bg-tint-pink mt-10">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#fee2e2] text-[10px] font-extrabold tracking-wider text-[#dc2626]">
                <Flame className="w-3 h-3" /> FLASH SALE
              </span>
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#cffafe] text-[10px] font-extrabold tracking-wider text-[#0e7490]">
                LIMITED TIME
              </span>
            </div>
            <h2 className="text-[26px] md:text-[32px] font-black tracking-tight text-foreground">
              🔥 Biggest Discounts Today
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Top deals sorted by highest savings — grab them before time runs out!</p>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">Sale ends in:</div>
            <div className="flex items-center gap-1.5">
              {[
                { v: days, l: "Days" },
                { v: hrs, l: "Hrs" },
                { v: min, l: "Min" },
                { v: sec, l: "Sec" },
              ].map((u) => (
                <div key={u.l} className="grid place-items-center w-12 py-1.5 rounded-lg bg-white shadow-sm border border-border">
                  <div className="text-base font-black text-foreground tabular-nums">{String(u.v).padStart(2, "0")}</div>
                  <div className="text-[9px] font-semibold text-muted-foreground -mt-0.5">{u.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {deals.map(({ product, save, pct }) => (
            <Link
              key={product.slug}
              to="/product/$slug"
              params={{ slug: product.slug }}
              className="product-card flex flex-col group"
            >
              <div className="relative">
                <div className="aspect-square overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-6xl bg-gradient-to-br from-pink-100 to-rose-100">{product.emoji}</div>
                  )}
                </div>
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#dc2626] text-white text-[10px] font-extrabold shadow">
                  -{pct}%
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="text-[13px] font-bold leading-snug line-clamp-2 min-h-[2.4rem] text-foreground">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[15px] font-extrabold text-primary">{product.plans[0].price}</span>
                  <span className="text-[12px] text-muted-foreground line-through">{product.plans[0].original}</span>
                </div>
                <div className="mt-1 text-[11px] font-semibold text-success">Save ৳{save}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid place-items-center">
          <Link to="/products" className="btn-teal inline-flex items-center gap-2 h-12 px-7 text-sm">
            View All Deals <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function secondsUntilEndOfWeek() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  end.setHours(23, 59, 59, 999);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

/* ───────── Why choose us — icon row ───────── */
function WhyChooseBar() {
  const items = [
    { icon: Zap, label: "Instant Delivery", color: "bg-[#fff7ed] text-[#f59e0b]" },
    { icon: ShieldCheck, label: "100% Genuine", color: "bg-[#ecfdf5] text-[#10b981]" },
    { icon: Headphones, label: "24/7 Support", color: "bg-[#eff6ff] text-[#3b82f6]" },
    { icon: CheckCircle2, label: "Trusted 12K+", color: "bg-[#f5f3ff] text-[#8b5cf6]" },
    { icon: Lock, label: "Secure Payment", color: "bg-[#eef2ff] text-[#6366f1]" },
    { icon: RefreshCw, label: "Replacement", color: "bg-[#fef2f2] text-[#ef4444]" },
  ];
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-8 py-12">
      <div className="text-center mb-7">
        <div className="inline-block px-2.5 py-1 rounded-md bg-[#f5f3ff] text-[10px] font-extrabold tracking-[0.18em] text-[#8b5cf6] mb-3">
          ✨ WHY CHOOSE US
        </div>
        <h2 className="text-[26px] md:text-[32px] font-black tracking-tight text-foreground">
          Built for trust. <span className="text-primary">Designed for speed.</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <div key={it.label} className="product-card flex flex-col items-center justify-center py-5 px-3 text-center">
            <div className={`grid place-items-center w-11 h-11 rounded-xl ${it.color} mb-2.5`}>
              <it.icon className="w-5 h-5" />
            </div>
            <div className="text-[12px] font-bold text-foreground">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── কেন RxB Premium Store? ───────── */
function WhyRxBSection() {
  const items = [
    { icon: Zap, color: "bg-[#fef3c7] text-[#d97706]", title: "তাৎক্ষণিক ডেলিভারি", text: "অর্ডারের ৫–৩০ মিনিটে ডেলিভারি" },
    { icon: ShieldCheck, color: "bg-[#dcfce7] text-[#16a34a]", title: "১০০% অরিজিনাল", text: "সম্পূর্ণ অফিসিয়াল সাবস্ক্রিপশন" },
    { icon: RefreshCw, color: "bg-[#cffafe] text-[#0891b2]", title: "রিপ্লেসমেন্ট গ্যারান্টি", text: "সমস্যা হলে ফ্রি রিপ্লেস" },
    { icon: Lock, color: "bg-[#fce7f3] text-[#db2777]", title: "সিকিউর পেমেন্ট", text: "bKash · Nagad · Rocket নিরাপদ" },
    { icon: Headphones, color: "bg-[#fee2e2] text-[#dc2626]", title: "২৪/৭ সাপোর্ট", text: "WhatsApp · Messenger · কল" },
    { icon: CheckCircle2, color: "bg-[#dbeafe] text-[#2563eb]", title: "১২,০০০+ গ্রাহক", text: "বাংলাদেশের বিশ্বস্ত স্টোর" },
  ];
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-8 py-10">
      <div className="text-center mb-8">
        <h2 className="text-[26px] md:text-[32px] font-black tracking-tight text-foreground">
          কেন <span className="text-primary">RxB Premium Store</span>?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">আপনার ভরসার জায়গা — যেখানে কোয়ালিটি ও বিশ্বাস সবার আগে</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((it) => (
          <div key={it.title} className="product-card flex flex-col items-center text-center py-6 px-3">
            <div className={`grid place-items-center w-12 h-12 rounded-2xl ${it.color} mb-3`}>
              <it.icon className="w-5 h-5" />
            </div>
            <div className="text-[13px] font-extrabold text-foreground">{it.title}</div>
            <div className="mt-1 text-[11px] text-muted-foreground leading-snug">{it.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */
const FAQS = [
  {
    q: "অর্ডার করার কতক্ষণ পর ডেলিভারি পাব?",
    a: "অফিস আওয়ারে (সকাল ৯টা – রাত ১১টা) সাধারণত ৫–৩০ মিনিটের মধ্যেই আপনার ইমেইল ও WhatsApp-এ অ্যাকাউন্টের সম্পূর্ণ তথ্য পেয়ে যাবেন। অফ-আওয়ারের অর্ডার করলে পরদিন সকালে সবার আগে ডেলিভারি দেওয়া হয়।",
  },
  {
    q: "প্রোডাক্টগুলো কি ১০০% অরিজিনাল ও অফিসিয়াল?",
    a: "জি, আমরা শুধুমাত্র অফিসিয়াল চ্যানেল থেকে নেওয়া অরিজিনাল সাবস্ক্রিপশন ও লাইসেন্স কী সরবরাহ করি — কোনো ক্র্যাক বা পাইরেটেড সফটওয়্যার নয়।",
  },
  {
    q: "পেমেন্ট কীভাবে করব? নিরাপদ তো?",
    a: "bKash, Nagad, Rocket, ব্যাংক ট্রান্সফার ও কার্ডের মাধ্যমে নিরাপদে পেমেন্ট করতে পারবেন। সম্পূর্ণ এন্ড-টু-এন্ড সিকিউর।",
  },
  {
    q: "অ্যাকাউন্টে কোনো সমস্যা হলে কী করব?",
    a: "ওয়ারেন্টি সময়ের মধ্যে যেকোনো সমস্যায় আমরা ফ্রি রিপ্লেসমেন্ট দেই। শুধু WhatsApp বা Live Support-এ যোগাযোগ করুন।",
  },
  {
    q: "অর্ডারের আগে কথা বলার সুযোগ আছে?",
    a: "অবশ্যই! WhatsApp, Messenger বা সরাসরি কল করে যেকোনো প্রশ্ন করতে পারেন — আমরা ২৪/৭ আপনার পাশে আছি।",
  },
  {
    q: "RxB Premium Store-কে কেন বিশ্বাস করব?",
    a: "১২,০০০+ সন্তুষ্ট গ্রাহক, প্রমাণিত ট্র্যাক রেকর্ড, রিপ্লেসমেন্ট গ্যারান্টি ও স্বচ্ছ সার্ভিস — এটাই আমাদের পরিচয়।",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-8 py-12 pb-20">
      <div className="text-center mb-7">
        <div className="inline-block px-3 py-1 rounded-md bg-[#eff6ff] text-[11px] font-bold text-[#2563eb] mb-3">
          ❓ FAQ
        </div>
        <h2 className="text-[26px] md:text-[32px] font-black tracking-tight text-foreground">
          সাধারণ <span className="text-primary">প্রশ্ন</span> ও উত্তর
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">অর্ডারের আগে যা জানা দরকার — সংক্ষেপে</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className={`product-card transition ${isOpen ? "border-primary/40 ring-1 ring-primary/30" : ""}`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
              >
                <span className="text-[14px] font-bold text-foreground">{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-[13px] text-muted-foreground leading-relaxed">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

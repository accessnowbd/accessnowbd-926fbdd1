import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Zap } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useLiveTickerConfig } from "@/hooks/useLiveTicker";
import { priceToNumber } from "@/lib/live-ticker";
import type { Product } from "@/data/products";

/** Shared marquee track: content duplicated so the loop is seamless. */
function MarqueeTrack({
  children,
  duration,
  className,
}: {
  children: React.ReactNode;
  duration: number;
  className?: string;
}) {
  return (
    <div className={`lt-mask ${className ?? ""}`}>
      <div className="lt-track" style={{ animationDuration: `${duration}s` }}>
        <div className="lt-group">{children}</div>
        <div className="lt-group" aria-hidden="true">
          {children}
        </div>
      </div>
      <style>{`
        .lt-mask { overflow: hidden; width: 100%; }
        .lt-track { display: flex; width: max-content; animation-name: lt-scroll; animation-timing-function: linear; animation-iteration-count: infinite; }
        .lt-group { display: flex; align-items: center; flex: 0 0 auto; }
        .lt-mask:hover .lt-track { animation-play-state: paused; }
        @keyframes lt-scroll { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @media (prefers-reduced-motion: reduce) { .lt-track { animation: none; } }
      `}</style>
    </div>
  );
}

/** Promotional scrolling messages for the top utility bar. */
export function PromoMarquee() {
  const { config } = useLiveTickerConfig();
  const messages = config.promo.messages.filter((m) => m.enabled && m.text.trim());
  if (!config.promo.enabled || messages.length === 0) return null;

  return (
    <MarqueeTrack duration={config.promo.speed} className="flex-1 min-w-0">
      {messages.map((m, i) => (
        <span key={`${m.text}-${i}`} className="inline-flex items-center gap-2 pr-8 whitespace-nowrap">
          <span className="font-semibold text-foreground/80">{m.text}</span>
          <span className="w-1 h-1 rounded-full bg-primary/50" />
        </span>
      ))}
    </MarqueeTrack>
  );
}

type LiveItem = { slug: string; name: string; price: number; discount: number | null };

function toLiveItem(p: Product): LiveItem | null {
  const prices = p.plans
    .map((pl) => ({ price: priceToNumber(pl.price), original: priceToNumber(pl.original) }))
    .filter((x): x is { price: number; original: number | null } => x.price !== null);
  if (!prices.length) return null;
  const best = prices.reduce((a, b) => (b.price < a.price ? b : a));
  const discount =
    best.original && best.original > best.price
      ? Math.round(((best.original - best.price) / best.original) * 100)
      : null;
  return { slug: p.slug, name: p.name, price: best.price, discount };
}

/** LIVE price strip — admin controlled (auto or hand-picked products). */
export function LiveProductTicker() {
  const { config } = useLiveTickerConfig();
  const { products } = useProducts();

  const items = useMemo(() => {
    const live = config.live;
    let list = products;
    if (live.mode === "manual" && live.pickedSlugs.length) {
      const bySlug = new Map(products.map((p) => [p.slug, p]));
      list = live.pickedSlugs.map((s) => bySlug.get(s)).filter((p): p is Product => !!p);
    }
    return list
      .map(toLiveItem)
      .filter((x): x is LiveItem => !!x)
      .slice(0, live.maxItems);
  }, [products, config.live]);

  if (!config.live.enabled || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-3 sm:px-5 md:px-10 mt-4 md:mt-6">
      <div className="relative flex items-center gap-3 rounded-full bg-card text-card-foreground backdrop-blur-xl ring-1 ring-border shadow-sm py-2 pl-2 pr-3 overflow-hidden">
        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold px-3 py-1.5">
          <Zap className="w-3 h-3" strokeWidth={3} />
          {config.live.label}
          <span className="relative flex w-1.5 h-1.5 ml-0.5">
            <span className="absolute inset-0 rounded-full bg-primary-foreground animate-ping opacity-70" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-primary-foreground" />
          </span>
        </span>
        <MarqueeTrack duration={config.live.speed} className="min-w-0">
          {items.map((it, i) => (
            <span key={`${it.slug}-${i}`} className="inline-flex items-center whitespace-nowrap">
              <Link
                to="/product/$slug"
                params={{ slug: it.slug }}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-foreground hover:text-primary transition"
              >
                <span>{it.name}</span>
                <span className="text-primary font-extrabold tabular-nums">৳{it.price.toLocaleString()}</span>
                {config.live.showDiscount && it.discount ? (
                  <span className="rounded-full bg-primary/10 text-primary text-[11px] font-extrabold px-2 py-0.5">
                    -{it.discount}%
                  </span>
                ) : null}
              </Link>
              <span className="mx-4 h-4 w-px bg-border" />
            </span>
          ))}
        </MarqueeTrack>
      </div>
    </section>
  );
}

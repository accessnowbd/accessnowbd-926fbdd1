import { useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SearchBar } from "@/components/SearchBar";

export function CategoryPage({
  title,
  subtitle,
  filter,
  showFilters = false,
}: {
  title: string;
  subtitle: string;
  filter?: (cat: string) => boolean;
  showFilters?: boolean;
}) {
  const { products, isLoading } = useProducts();
  const navigate = useNavigate();
  const { q = "" } = useSearch({ strict: false });
  const [cat, setCat] = useState<string | null>(null);

  const updateSearch = (value: string) => {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, q: value.trim() || undefined }) } as never);
  };

  const cats = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (!filter || filter(p.category)) set.add(p.category);
    return Array.from(set);
  }, [products, filter]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (filter && !filter(p.category)) return false;
      if (cat && p.category !== cat) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.tagline.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle)
      );
    });
  }, [products, q, cat, filter]);

  return (
    <div className="min-h-screen">

      {/* Cinematic header band */}
      <section className="relative glass-strong overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-primary/35 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-[var(--color-aqua)]/35 blur-[140px]" />
        <div className="relative mx-auto max-w-[1440px] px-4 md:px-10 py-12 md:py-16">
          <div className="inline-block">
            <h1
              className="text-aurora drop-shadow-[0_2px_18px_rgba(124,92,255,0.35)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                letterSpacing: 0,
              }}
            >
              {title}
            </h1>
          </div>
          <p className="mt-3 text-slate-700 max-w-2xl font-medium drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">{subtitle}</p>
          <SearchBar
            value={q}
            onChange={updateSearch}
            onSubmit={updateSearch}
            placeholder="প্রোডাক্ট সার্চ করুন..."
            size="lg"
            className="mt-6 max-w-xl"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
        {showFilters && cats.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCat(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${cat === null ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]" : "glass hover:bg-card/80"}`}
            >
              All ({products.filter((p) => !filter || filter(p.category)).length})
            </button>
            {cats.map((c) => {
              const count = products.filter((p) => p.category === c).length;
              const active = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(active ? null : c)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition ${active ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow-violet)]" : "glass hover:bg-card/80"}`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>
        ) : items.length === 0 ? (
          <div className="glass rounded-3xl py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-lg font-bold">No subscriptions found</h3>
            <p className="text-sm text-muted-foreground mt-2">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {items.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

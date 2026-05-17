import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { SiteFooter } from "@/components/SiteFooter";
import { ChevronRight, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All Categories — AccessNow BD" },
      { name: "description", content: "Browse all product categories on AccessNow BD." },
      { property: "og:title", content: "All Categories — AccessNow BD" },
      { property: "og:description", content: "Browse all product categories." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { products, isLoading } = useProducts();

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-[1440px] px-4 md:px-10 py-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-primary/10 text-primary">
            <LayoutGrid className="w-5 h-5" />
          </span>
          <h1
            className="text-foreground"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.8vw, 40px)",
              fontWeight: 800,
            }}
          >
            All Categories
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          আপনার পছন্দের ক্যাটাগরি বেছে নিন — প্রতিটি ক্যাটাগরিতে সব verified প্রোডাক্ট পাবেন।
        </p>

        {isLoading && categories.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                to="/products"
                search={{ q: c.name }}
                className="group relative glass-strong rounded-2xl p-4 flex items-center justify-between gap-3 transition hover:border-primary/40 hover:shadow-[0_10px_30px_-12px_var(--color-primary)]"
              >
                <span className="min-w-0">
                  <span className="block text-[14px] font-extrabold text-foreground truncate">{c.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{c.count} products</span>
                </span>
                <ChevronRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

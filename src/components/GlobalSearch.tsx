import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  X,
  Loader2,
  Clock,
  TrendingUp,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Tag,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/data/products";

const RECENT_KEY = "globalSearch:recent";
const TRENDING = ["Netflix", "ChatGPT", "Spotify", "Canva", "YouTube", "Coursera"];

const QUICK_LINKS: Array<{ label: string; to: "/products" | "/streaming" | "/ai-tools" | "/education" | "/faq" | "/contact"; hint: string }> = [
  { label: "All Subscriptions", to: "/products", hint: "Browse the full catalog" },
  { label: "Streaming", to: "/streaming", hint: "Netflix, Prime, Disney+ & more" },
  { label: "AI Tools", to: "/ai-tools", hint: "ChatGPT, Claude, Midjourney…" },
  { label: "Education", to: "/education", hint: "Coursera, Udemy, Skillshare" },
  { label: "FAQ", to: "/faq", hint: "Common questions" },
  { label: "Contact", to: "/contact", hint: "Talk to support" },
];

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}
function saveRecent(term: string) {
  if (typeof window === "undefined") return;
  const t = term.trim();
  if (!t) return;
  const prev = loadRecent().filter((x) => x.toLowerCase() !== t.toLowerCase());
  const next = [t, ...prev].slice(0, 6);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function highlight(text: string, needle: string) {
  if (!needle) return text;
  const idx = text.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-aqua/25 text-white rounded px-0.5">
        {text.slice(idx, idx + needle.length)}
      </mark>
      {text.slice(idx + needle.length)}
    </>
  );
}

// Lightweight fuzzy: returns true if all chars of `n` appear in order within `hay`.
function fuzzyIncludes(hay: string, n: string): boolean {
  if (!n) return true;
  let i = 0;
  for (let j = 0; j < hay.length && i < n.length; j++) {
    if (hay[j] === n[i]) i++;
  }
  return i === n.length;
}

function scoreProduct(p: Product, needle: string): number {
  const raw = needle.toLowerCase().trim();
  if (!raw) return 0;
  const name = p.name.toLowerCase();
  const tag = (p.tagline ?? "").toLowerCase();
  const desc = (p.description ?? "").toLowerCase();
  const cat = p.category.toLowerCase();
  const badge = (p.badge ?? "").toLowerCase();
  const features = (p.features ?? []).join(" ").toLowerCase();
  const hay = `${name} ${tag} ${cat} ${badge} ${desc} ${features}`;

  // Multi-token: every token must hit somewhere (AND semantics)
  const tokens = raw.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    let s = 0;
    if (name === t) s = 1000;
    else if (name.startsWith(t)) s = 800;
    else if (name.includes(t)) s = 600;
    else if (cat.startsWith(t)) s = 450;
    else if (cat.includes(t)) s = 350;
    else if (tag.includes(t)) s = 280;
    else if (badge.includes(t)) s = 220;
    else if (desc.includes(t)) s = 160;
    else if (features.includes(t)) s = 140;
    else if (fuzzyIncludes(name, t)) s = 90; // typo tolerance
    else if (fuzzyIncludes(hay, t)) s = 40;
    else return 0; // token missing → exclude
    score += s;
  }
  return score;
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { products, isLoading } = useProducts();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const needle = q.trim();

  const matches = useMemo<Product[]>(() => {
    if (!needle) return [];
    return products
      .map((p) => ({ p, s: scoreProduct(p, needle) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.p);
  }, [products, needle]);

  const categoryMatches = useMemo(() => {
    if (!needle) return [];
    const n = needle.toLowerCase();
    const set = new Set<string>();
    for (const p of products) {
      if (p.category.toLowerCase().includes(n)) set.add(p.category);
    }
    return Array.from(set).slice(0, 4);
  }, [products, needle]);

  // Flat list of selectable items (for keyboard nav)
  const flatItems = useMemo(() => {
    const list: Array<{ kind: "product" | "category" | "submit"; value: string; product?: Product }> = [];
    if (needle) {
      list.push({ kind: "submit", value: needle });
      for (const p of matches) list.push({ kind: "product", value: p.slug, product: p });
      for (const c of categoryMatches) list.push({ kind: "category", value: c });
    }
    return list;
  }, [needle, matches, categoryMatches]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const go = (item: (typeof flatItems)[number]) => {
    saveRecent(needle || item.value);
    onOpenChange(false);
    if (item.kind === "product" && item.product) {
      navigate({ to: "/product/$slug", params: { slug: item.product.slug } });
    } else if (item.kind === "category") {
      navigate({ to: "/products", search: { q: item.value } as never });
    } else {
      navigate({ to: "/products", search: { q: needle || item.value } as never });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(flatItems.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems.length > 0) {
        go(flatItems[active]);
      } else if (needle) {
        saveRecent(needle);
        onOpenChange(false);
        navigate({ to: "/products", search: { q: needle } as never });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-2xl border-white/10 bg-[#0a0c1e]/95 backdrop-blur-2xl overflow-hidden rounded-3xl shadow-[0_30px_120px_-20px_rgba(124,58,237,0.5)]"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Aurora glow */}
        <div className="pointer-events-none absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-primary/30 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 w-[420px] h-[420px] rounded-full bg-aqua/25 blur-[140px]" />

        {/* Input row */}
        <div className="relative flex items-center gap-3 px-5 h-16 border-b border-white/10">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-white/80 animate-spin shrink-0" />
          ) : (
            <Search className="w-4 h-4 text-white/80 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search Netflix, ChatGPT, Spotify, Canva…"
            className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/65"
            autoComplete="off"
            spellCheck={false}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="grid place-items-center w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center h-6 px-2 rounded-md text-[10px] font-mono bg-white/10 text-white/70 border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div className="relative max-h-[60vh] overflow-y-auto p-3">
          {needle ? (
            <>
              {/* Direct search action */}
              <button
                onClick={() => go({ kind: "submit", value: needle })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                  active === 0 ? "bg-white/10 ring-1 ring-aqua/40" : "hover:bg-white/5"
                }`}
              >
                <Search className="w-4 h-4 text-aqua shrink-0" />
                <span className="flex-1 text-sm text-white truncate">
                  Search for "<span className="font-semibold">{needle}</span>" in all products
                </span>
                <CornerDownLeft className="w-3.5 h-3.5 text-white/65" />
              </button>

              {/* Product matches */}
              {matches.length > 0 && (
                <div className="mt-3">
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Products
                  </div>
                  <div className="space-y-1">
                    {matches.map((p, i) => {
                      const idx = i + 1; // +1 because submit is at 0
                      const isActive = active === idx;
                      return (
                        <button
                          key={p.slug}
                          onClick={() => go({ kind: "product", value: p.slug, product: p })}
                          onMouseEnter={() => setActive(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                            isActive ? "bg-white/10 ring-1 ring-aqua/40" : "hover:bg-white/5"
                          }`}
                        >
                          <div
                            className={`grid place-items-center w-10 h-10 rounded-xl text-lg bg-gradient-to-br ${p.gradient} shadow-[0_6px_18px_-6px_rgba(0,0,0,0.6)]`}
                          >
                            {p.emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white truncate">
                              {highlight(p.name, needle)}
                            </div>
                            <div className="text-xs text-white/70 truncate">
                              {p.tagline || p.category}
                            </div>
                          </div>
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/70 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                            {p.category}
                          </span>
                          <CornerDownLeft className="w-3.5 h-3.5 text-white/65 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category matches */}
              {categoryMatches.length > 0 && (
                <div className="mt-3">
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                    Categories
                  </div>
                  <div className="space-y-1">
                    {categoryMatches.map((c, i) => {
                      const idx = 1 + matches.length + i;
                      const isActive = active === idx;
                      return (
                        <button
                          key={c}
                          onClick={() => go({ kind: "category", value: c })}
                          onMouseEnter={() => setActive(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
                            isActive ? "bg-white/10 ring-1 ring-aqua/40" : "hover:bg-white/5"
                          }`}
                        >
                          <Tag className="w-4 h-4 text-violet-300 shrink-0" />
                          <span className="flex-1 text-sm text-white truncate">
                            {highlight(c, needle)}
                          </span>
                          <span className="text-[10px] text-white/65">Category</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {matches.length === 0 && categoryMatches.length === 0 && !isLoading && (
                <div className="px-4 py-10 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="text-sm text-white/70">
                    No matches for "<span className="font-semibold text-white">{needle}</span>"
                  </div>
                  <div className="text-xs text-white/70 mt-1">
                    Press Enter to browse all products.
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Recent searches */}
              {recent.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between px-3 pb-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Recent
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecent([]);
                      }}
                      className="text-[10px] text-white/70 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => setQ(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/80 bg-white/5 border border-white/10 hover:border-aqua/40 hover:text-white transition"
                      >
                        <Search className="w-3 h-3 text-white/70" />
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div className="mt-2">
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Trending
                </div>
                <div className="flex flex-wrap gap-1.5 px-3">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onClick={() => setQ(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-primary/25 to-aqua/25 border border-white/10 hover:from-primary/40 hover:to-aqua/40 transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="mt-4">
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                  Quick Links
                </div>
                <div className="space-y-1">
                  {QUICK_LINKS.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => onOpenChange(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition group"
                    >
                      <div className="grid place-items-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 group-hover:border-aqua/40 transition">
                        <CornerDownLeft className="w-3.5 h-3.5 text-white/70 group-hover:text-aqua" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-white truncate">{l.label}</div>
                        <div className="text-xs text-white/70 truncate">{l.hint}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="relative border-t border-white/10 bg-black/30 px-4 py-2.5 flex items-center justify-between text-[10px] text-white/70">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/10 border border-white/10">
                <ArrowUp className="w-2.5 h-2.5" />
              </kbd>
              <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-white/10 border border-white/10">
                <ArrowDown className="w-2.5 h-2.5" />
              </kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-white/10 border border-white/10 font-mono">
                ↵
              </kbd>
              select
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-white/10 border border-white/10 font-mono">
                esc
              </kbd>
              close
            </span>
          </div>
          <span className="hidden sm:inline">
            Powered by <span className="text-white/80 font-semibold">AccessNow BD</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Hook: provides open state and binds Cmd/Ctrl+K and "/" shortcuts globally. */
export function useGlobalSearch() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      const isSlash =
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement);
      if (isK || isSlash) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

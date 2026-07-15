import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OfferProduct = {
  slug: string;
  name: string;
  image_url?: string;
  price?: number;
  link: string;
};

type PopupData = {
  enabled?: boolean;
  title?: string;
  message?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  delay_seconds?: number;
  show_once_per?: "session" | "day" | "always";
  badge_text?: string;
  discount_text?: string;
  products?: OfferProduct[];
  version?: number;
};

const STORAGE_KEY = "welcome_popup_dismissed_v1";

function wasDismissed(mode: PopupData["show_once_per"], version: number) {
  if (mode === "always") return false;
  try {
    if (mode === "day") {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) return false;
      const [ver, iso] = v.split("|");
      if (Number(ver) !== version) return false;
      const then = new Date(iso).getTime();
      return Date.now() - then < 24 * 60 * 60 * 1000;
    }
    // session
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (!v) return false;
    return Number(v) === version;
  } catch {
    return false;
  }
}

function markDismissed(mode: PopupData["show_once_per"], version: number) {
  try {
    if (mode === "day") {
      localStorage.setItem(STORAGE_KEY, `${version}|${new Date().toISOString()}`);
    } else if (mode !== "always") {
      sessionStorage.setItem(STORAGE_KEY, String(version));
    }
  } catch {/* ignore */}
}

export function WelcomePopup() {
  const [data, setData] = useState<PopupData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      try {
        const { data: row } = await supabase
          .from("admin_records")
          .select("data")
          .eq("kind", "welcome_popup")
          .eq("is_active", true)
          .order("sort_order")
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        const d = (row?.data as PopupData) || null;
        if (!d || d.enabled === false) return;
        const version = d.version ?? 1;
        const mode = d.show_once_per ?? "session";
        if (wasDismissed(mode, version)) return;
        const hasContent = !!(d.image_url || d.title || d.message || (d.products && d.products.length));
        if (!hasContent) return;
        setData(d);
        const delayMs = Math.max(0, (d.delay_seconds ?? 3)) * 1000;
        timer = setTimeout(() => !cancelled && setOpen(true), delayMs);
      } catch {/* ignore */}
    })();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  const close = () => {
    setOpen(false);
    if (data) markDismissed(data.show_once_per ?? "session", data.version ?? 1);
  };

  if (!open || !data) return null;

  const products = data.products ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog" aria-modal="true" onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] ring-1 ring-white/40 bg-white animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur grid place-items-center text-slate-700 hover:bg-white shadow-md ring-1 ring-slate-200">
          <X className="w-4 h-4" />
        </button>

        {data.image_url && (
          <a href={data.cta_link || "#"} onClick={(e) => { if (!data.cta_link) e.preventDefault(); }} className="block">
            <img src={data.image_url} alt={data.title || "Promotion"} className="w-full h-auto block max-h-56 object-cover" loading="eager" />
          </a>
        )}

        <div className="p-5 text-center">
          {data.badge_text && (
            <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-extrabold tracking-widest">
              {data.badge_text}
            </div>
          )}
          {data.discount_text && (
            <div className="mt-2 text-4xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              {data.discount_text}
            </div>
          )}
          {data.title && (
            <h2 className="mt-1 text-xl font-extrabold text-slate-900 tracking-tight">{data.title}</h2>
          )}
          {data.message && (
            <p className="mt-2 text-[14px] leading-relaxed text-slate-700 whitespace-pre-line">{data.message}</p>
          )}

          {products.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {products.slice(0, 6).map((p) => (
                <a key={p.slug} href={p.link} onClick={close}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-2 hover:border-violet-400 hover:shadow-md transition">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-14 object-cover rounded" />
                  ) : (
                    <div className="w-full h-14 rounded bg-slate-200" />
                  )}
                  <div className="mt-1 text-[10px] font-bold text-slate-700 line-clamp-2">{p.name}</div>
                  {typeof p.price === "number" && p.price > 0 && (
                    <div className="text-[10px] font-black text-violet-600">৳{p.price}</div>
                  )}
                </a>
              ))}
            </div>
          )}

          {data.cta_text && data.cta_link && (
            <a href={data.cta_link} onClick={close}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-full px-6 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-bold shadow-[0_10px_24px_-10px_rgba(139,92,246,0.7)] hover:opacity-95">
              {data.cta_text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

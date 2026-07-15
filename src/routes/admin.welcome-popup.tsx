import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Save, Loader2, PartyPopper, Eye, Sparkles, X, Search, Link2, ImageIcon,
  Plus, Trash2, Clock, Gift, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/welcome-popup")({
  component: WelcomePopupAdminPage,
});

type OfferProduct = {
  slug: string;
  name: string;
  image_url?: string;
  price?: number;
  link: string;
};

type PopupData = {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  delay_seconds: number;
  show_once_per: "session" | "day" | "always";
  badge_text: string;
  discount_text: string;
  products: OfferProduct[];
  version: number;
};

const DEFAULTS: PopupData = {
  enabled: true,
  title: "🎉 বিশেষ অফার!",
  message: "আজই অর্ডার করুন এবং পান বিশেষ ছাড়। সীমিত সময়ের অফার।",
  image_url: "",
  cta_text: "এখনই কিনুন",
  cta_link: "/products",
  delay_seconds: 3,
  show_once_per: "session",
  badge_text: "LIMITED OFFER",
  discount_text: "৩০% ছাড়",
  products: [],
  version: 1,
};

type ProductRow = {
  slug: string;
  name: string;
  image_url?: string | null;
  category?: string | null;
  meta?: { selling_price?: number; original_price?: number } | null;
};

function WelcomePopupAdminPage() {
  const [data, setData] = useState<PopupData>(DEFAULTS);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: rows, error }, { data: prodRows }] = await Promise.all([
      supabase.from("admin_records").select("*").eq("kind", "welcome_popup").limit(1),
      supabase.from("products").select("slug,name,image_url,category,price,meta").eq("is_active", true).order("sort_order").limit(500),
    ]);
    if (error) toast.error(error.message);
    const row = rows?.[0];
    if (row) {
      setRecordId(row.id);
      setData({ ...DEFAULTS, ...((row.data ?? {}) as Partial<PopupData>) });
    }
    setProducts((prodRows ?? []) as ProductRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof PopupData>(k: K, v: PopupData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = { kind: "welcome_popup", data: data as never, is_active: data.enabled };
    const op = recordId
      ? supabase.from("admin_records").update(payload).eq("id", recordId)
      : supabase.from("admin_records").insert(payload).select().single();
    const { error, data: saved } = await op as unknown as { error: { message: string } | null; data: { id: string } | null };
    setSaving(false);
    if (error) return toast.error(error.message);
    if (!recordId && saved?.id) setRecordId(saved.id);
    try { sessionStorage.removeItem("welcome_popup_dismissed_v1"); } catch {/* ignore */}
    toast.success("Welcome popup সংরক্ষণ হয়েছে");
  };

  const addProduct = (p: ProductRow) => {
    if (data.products.some((x) => x.slug === p.slug)) {
      toast.info("এই product ইতিমধ্যে added");
      return;
    }
    const price = p.meta?.selling_price ?? p.price ?? undefined;
    set("products", [...data.products, {
      slug: p.slug,
      name: p.name,
      image_url: p.image_url || undefined,
      price: price ?? undefined,
      link: `/product/${p.slug}`,
    }]);
  };

  const removeProduct = (slug: string) => set("products", data.products.filter((p) => p.slug !== slug));

  const useProductImage = (p: ProductRow) => {
    set("image_url", p.image_url || "");
    set("cta_link", `/product/${p.slug}`);
    toast.success(`${p.name} এর image ও link ব্যবহার করা হচ্ছে`);
  };

  const useProductLink = (p: ProductRow) => {
    set("cta_link", `/product/${p.slug}`);
    toast.success(`Link updated → /product/${p.slug}`);
  };

  const filteredProducts = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q)
    );
  }, [products, pickerQuery]);

  if (loading) {
    return <div className="grid place-items-center h-64 text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-pink-100 grid place-items-center text-pink-600">
            <PartyPopper className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Welcome Popup</h2>
            <p className="text-xs mt-0.5 text-slate-500">Visitor আসার কিছুক্ষণ পর দেখানো offer popup — product select করে ব্যবহার করুন</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="a-save-btn">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-5">
        <div className="space-y-4">
          {/* Toggle & timing */}
          <div className="grid md:grid-cols-2 gap-3">
            <ToggleCard label="Popup Enabled" desc="Off করলে visitor দের popup দেখাবে না"
              checked={data.enabled} onChange={(v) => set("enabled", v)} />
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Clock className="w-4 h-4" /> Delay (visitor আসার কত সেকেন্ড পরে দেখাবে)</div>
              <div className="mt-2 flex items-center gap-2">
                <input type="number" min={0} max={60} value={data.delay_seconds}
                  onChange={(e) => set("delay_seconds", Number(e.target.value) || 0)}
                  className="w-24 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                <span className="text-xs text-slate-500">সেকেন্ড</span>
                <select value={data.show_once_per} onChange={(e) => set("show_once_per", e.target.value as PopupData["show_once_per"]) }
                  className="ml-auto px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm">
                  <option value="session">Session-এ একবার</option>
                  <option value="day">প্রতিদিন একবার</option>
                  <option value="always">প্রতিবার</option>
                </select>
              </div>
            </div>
          </div>

          {/* Offer content */}
          <Section title="Offer Content" icon={<Gift className="w-4 h-4" />}>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Badge (উপরে ছোট টেক্সট)">
                <input value={data.badge_text} onChange={(e) => set("badge_text", e.target.value)}
                  placeholder="LIMITED OFFER" className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
              </Field>
              <Field label="Discount Text (বড় ছাড়ের টেক্সট)">
                <input value={data.discount_text} onChange={(e) => set("discount_text", e.target.value)}
                  placeholder="৩০% ছাড়" className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Title">
                <input value={data.title} onChange={(e) => set("title", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Message">
                <textarea value={data.message} onChange={(e) => set("message", e.target.value)}
                  rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white resize-none" />
              </Field>
            </div>
            <div className="mt-3 grid md:grid-cols-2 gap-3">
              <Field label="Button Text">
                <input value={data.cta_text} onChange={(e) => set("cta_text", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
              </Field>
              <Field label="Button Link (URL)">
                <input value={data.cta_link} onChange={(e) => set("cta_link", e.target.value)}
                  placeholder="/products বা https://..." className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Image URL (upload করা image URL বা product এর image)">
                <input value={data.image_url} onChange={(e) => set("image_url", e.target.value)}
                  placeholder="https://... বা ডানে product থেকে বেছে নিন" className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white" />
              </Field>
              {data.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-xs">
                  <img src={data.image_url} alt="preview" className="w-full h-auto" />
                </div>
              )}
            </div>
          </Section>

          {/* Featured products list */}
          <Section title={`Featured Products (${data.products.length})`} icon={<Sparkles className="w-4 h-4" />}>
            <p className="text-xs text-slate-500 mb-3">Popup-এ ছোট product cards হিসেবে দেখাবে। ডানের list থেকে "Add" করুন।</p>
            {data.products.length === 0 ? (
              <div className="text-sm text-slate-400 italic">এখনো কোনো product যোগ করা হয়নি</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {data.products.map((p) => (
                  <div key={p.slug} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-200 grid place-items-center"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 truncate">{p.link}</div>
                    </div>
                    <button onClick={() => removeProduct(p.slug)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* RIGHT: Product picker + Live preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <button onClick={() => setPickerOpen((v) => !v)} className="w-full flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-2"><Search className="w-4 h-4" /> Product থেকে বেছে নিন ({products.length})</span>
              <span className="text-xs text-slate-500">{pickerOpen ? "Hide" : "Show"}</span>
            </button>
            {pickerOpen && (
              <div className="p-3">
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Product search..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                </div>
                <div className="max-h-[420px] overflow-y-auto space-y-1.5">
                  {filteredProducts.map((p) => {
                    const added = data.products.some((x) => x.slug === p.slug);
                    return (
                      <div key={p.slug} className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 hover:border-slate-300 bg-white">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 grid place-items-center"><ImageIcon className="w-4 h-4 text-slate-400" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">/product/{p.slug}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => useProductImage(p)} title="এই product এর image ও link main popup-এ ব্যবহার করুন"
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600" aria-label="Use image"><ImageIcon className="w-3.5 h-3.5" /></button>
                          <button onClick={() => useProductLink(p)} title="শুধু link ব্যবহার করুন"
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" aria-label="Use link"><Link2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => addProduct(p)} disabled={added} title={added ? "Added" : "Featured list এ add"}
                            className={`p-1.5 rounded-lg ${added ? "bg-emerald-100 text-emerald-600" : "hover:bg-pink-50 text-pink-600"}`}
                            aria-label="Add">{added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}</button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-6">কোনো product পাওয়া যায়নি</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-600 uppercase tracking-wide">
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </div>
            <PreviewInline data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewInline({ data }: { data: PopupData }) {
  return (
    <div className="relative w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-white">
      <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur grid place-items-center text-slate-700 shadow ring-1 ring-slate-200">
        <X className="w-4 h-4" />
      </button>
      {data.image_url && (
        <img src={data.image_url} alt="" className="w-full h-40 object-cover" />
      )}
      <div className="p-5 text-center">
        {data.badge_text && (
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-extrabold tracking-widest">
            {data.badge_text}
          </div>
        )}
        {data.discount_text && (
          <div className="mt-2 text-3xl font-black bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            {data.discount_text}
          </div>
        )}
        {data.title && <h3 className="mt-1 text-lg font-extrabold text-slate-900">{data.title}</h3>}
        {data.message && <p className="mt-1.5 text-xs text-slate-600 whitespace-pre-line">{data.message}</p>}

        {data.products.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {data.products.slice(0, 3).map((p) => (
              <div key={p.slug} className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-12 object-cover rounded" />}
                <div className="mt-1 text-[9px] font-bold text-slate-700 line-clamp-1">{p.name}</div>
              </div>
            ))}
          </div>
        )}

        {data.cta_text && (
          <div className="mt-4 inline-flex h-9 items-center px-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-bold shadow-lg">
            {data.cta_text}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center gap-2 mb-4 text-sm font-extrabold text-slate-800">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function ToggleCard({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-bold text-slate-800">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`} aria-pressed={checked}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

// Fetches per-product download links for a set of order items.
// Reads from products.meta (fields the admin form writes):
//   - meta.download_link (single URL)
//   - meta.download_url (alt name)
//   - meta.download_note (setup instructions)
//   - meta.downloads / meta.download_links / meta.files (arrays of { label, url, note? })
//
// Used by:
//   - /orders/$id and /dashboard "Downloads" section (customer-facing)
//   - admin.orders.tsx status update (email delivery)

import { supabase } from "@/integrations/supabase/client";

export type ProductDownload = {
  productSlug: string;
  productName: string;
  productImage?: string | null;
  label: string;
  url: string;
  note?: string;
};

type OrderItemLite = { slug: string; name?: string };

export function extractDownloadsFromMeta(meta: unknown): Array<{ label: string; url: string; note?: string }> {
  const out: Array<{ label: string; url: string; note?: string }> = [];
  if (!meta || typeof meta !== "object") return out;
  const m = meta as Record<string, unknown>;
  const note = typeof m.download_note === "string" ? m.download_note : undefined;
  const push = (label: string, url: unknown, n?: string) => {
    if (typeof url === "string" && /^https?:\/\//i.test(url)) out.push({ label, url, note: n });
  };
  push("Download", m.download_link, note);
  push("Download", m.download_url, note);
  push("Setup file", m.setup_url, note);
  const arrays = [m.downloads, m.download_links, m.files];
  for (const arr of arrays) {
    if (Array.isArray(arr)) {
      arr.forEach((item, i) => {
        if (typeof item === "string") push(`File ${i + 1}`, item, note);
        else if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const url = (o.url ?? o.link ?? o.href) as unknown;
          const label = (o.label ?? o.name ?? o.title ?? `File ${i + 1}`) as string;
          const nn = typeof o.note === "string" ? o.note : note;
          push(String(label), url, nn);
        }
      });
    }
  }
  // De-dupe by URL
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.url) ? false : (seen.add(l.url), true)));
}

export async function fetchOrderDownloads(items: OrderItemLite[]): Promise<ProductDownload[]> {
  const slugs = Array.from(new Set((items || []).map((it) => it.slug).filter(Boolean)));
  if (slugs.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("slug, name, image_url, meta")
    .in("slug", slugs);
  if (error || !data) return [];
  const nameBySlug = new Map<string, string>();
  (items || []).forEach((it) => { if (it.slug && it.name) nameBySlug.set(it.slug, it.name); });
  const out: ProductDownload[] = [];
  data.forEach((p) => {
    const links = extractDownloadsFromMeta(p.meta);
    links.forEach((l) => {
      out.push({
        productSlug: p.slug,
        productName: nameBySlug.get(p.slug) || p.name,
        productImage: p.image_url,
        label: l.label,
        url: l.url,
        note: l.note,
      });
    });
  });
  return out;
}

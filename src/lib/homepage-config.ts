import { supabase } from "@/integrations/supabase/client";

/** Sections that live on the homepage. Order + on/off is configurable. */
export type HomepageSectionId =
  | "hero"
  | "categoryPills"
  | "featured"
  | "rails"
  | "recentlyViewed"
  | "reviews";

export type HomepageSection = {
  id: HomepageSectionId;
  enabled: boolean;
  order: number;
};

export type HomepageSEO = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

export type HomepageConfig = {
  sections: HomepageSection[];
  /** When set, these product slugs are shown in "Featured" (in order).
   *  When empty, auto-pick (one-per-category) is used. */
  featuredSlugs: string[];
  featured: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  /** When set, only these categories become product rails (in order).
   *  When empty, auto = all categories present in products. */
  railCategories: string[];
  seo: HomepageSEO;
};

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  sections: [
    { id: "hero", enabled: true, order: 1 },
    { id: "categoryPills", enabled: true, order: 2 },
    { id: "featured", enabled: true, order: 3 },
    { id: "rails", enabled: true, order: 4 },
    { id: "recentlyViewed", enabled: true, order: 5 },
    { id: "reviews", enabled: true, order: 6 },
  ],
  featuredSlugs: [],
  featured: {
    eyebrow: "Popular Picks",
    title: "Today's Bestselling Digital Services",
    subtitle: "The most ordered software and subscriptions, handpicked for you.",
  },
  railCategories: [],
  seo: {
    title: "AccessNow BD — Digital Products & Software",
    description:
      "Buy verified digital products, subscriptions, software licenses, AI tools, OTT, VPN and education services in Bangladesh with fast delivery.",
    ogTitle: "AccessNow BD — Digital Products & Software",
    ogDescription:
      "White glassmorphism digital marketplace for premium software, subscriptions and services.",
  },
};

export const SECTION_LABELS: Record<HomepageSectionId, { en: string; bn: string; hint: string }> = {
  hero: { en: "Hero Banner Slider", bn: "হিরো ব্যানার স্লাইডার", hint: "Top rotating banners" },
  categoryPills: { en: "Category Pill Bar", bn: "ক্যাটাগরি পিল বার", hint: "Quick category chips" },
  featured: { en: "Featured Products", bn: "ফিচার্ড প্রোডাক্ট", hint: "Top Picks grid" },
  rails: { en: "Product Rails (by Category)", bn: "প্রোডাক্ট রেইল", hint: "One row per category" },
  recentlyViewed: { en: "Recently Viewed", bn: "সম্প্রতি দেখা", hint: "Personalised recents" },
  reviews: { en: "Customer Reviews", bn: "কাস্টমার রিভিউ", hint: "Testimonials section" },
};

const KIND = "homepage_config";

function normalise(raw: unknown): HomepageConfig {
  const src = (raw ?? {}) as Partial<HomepageConfig>;
  const bySrc = new Map(
    (src.sections ?? []).map((s) => [s.id, s] as const),
  );
  const sections: HomepageSection[] = DEFAULT_HOMEPAGE_CONFIG.sections.map((def) => {
    const s = bySrc.get(def.id);
    return s
      ? { id: def.id, enabled: s.enabled !== false, order: Number.isFinite(s.order) ? s.order : def.order }
      : def;
  });
  sections.sort((a, b) => a.order - b.order);
  return {
    sections,
    featuredSlugs: Array.isArray(src.featuredSlugs) ? src.featuredSlugs.filter(Boolean) : [],
    featured: {
      eyebrow: src.featured?.eyebrow ?? DEFAULT_HOMEPAGE_CONFIG.featured.eyebrow,
      title: src.featured?.title ?? DEFAULT_HOMEPAGE_CONFIG.featured.title,
      subtitle: src.featured?.subtitle ?? DEFAULT_HOMEPAGE_CONFIG.featured.subtitle,
    },
    railCategories: Array.isArray(src.railCategories) ? src.railCategories.filter(Boolean) : [],
    seo: { ...DEFAULT_HOMEPAGE_CONFIG.seo, ...(src.seo ?? {}) },
  };
}

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  const { data, error } = await supabase
    .from("admin_records")
    .select("data,is_active")
    .eq("kind", KIND)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return DEFAULT_HOMEPAGE_CONFIG;
  return normalise(data.data);
}

export async function saveHomepageConfig(cfg: HomepageConfig): Promise<void> {
  const clean = normalise(cfg);
  const { data: existing } = await supabase
    .from("admin_records")
    .select("id")
    .eq("kind", KIND)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await supabase
      .from("admin_records")
      .update({ data: clean as never, is_active: true })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("admin_records")
      .insert({ kind: KIND, data: clean as never, is_active: true });
    if (error) throw error;
  }
}

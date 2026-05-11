export type Plan = { period: string; price: string; original?: string; popular?: boolean };

export type Product = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  category: string;
  badge: string | null;
  tagline: string;
  description: string;
  deliveryTime: string;
  warranty: string;
  features: string[];
  plans: Plan[];
  imageUrl?: string;
};

// Map DB row (snake_case) to UI Product (camelCase)
type DbProduct = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
  category: string;
  badge: string | null;
  tagline: string;
  description: string;
  delivery_time: string;
  warranty: string;
  features: unknown;
  plans: unknown;
};

export function rowToProduct(r: DbProduct): Product {
  return {
    slug: r.slug,
    name: r.name,
    emoji: r.emoji,
    gradient: r.gradient,
    category: r.category,
    badge: r.badge,
    tagline: r.tagline,
    description: r.description,
    deliveryTime: r.delivery_time,
    warranty: r.warranty,
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
    plans: Array.isArray(r.plans) ? (r.plans as Plan[]) : [],
  };
}

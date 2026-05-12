import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToProduct, type Product } from "@/data/products";

// Tunables: SWR strategy for product data.
// - staleTime: how long data is considered fresh (no background refetch).
// - gcTime: how long unused cache entries are kept in memory.
const PRODUCT_STALE_MS = 10 * 60_000; // 10 minutes
const PRODUCT_GC_MS = 60 * 60_000;    // 1 hour

export function useProducts() {
  const q = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => rowToProduct(r as never));
    },
    staleTime: PRODUCT_STALE_MS,
    gcTime: PRODUCT_GC_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });
  return { products: q.data ?? [], isLoading: q.isLoading, error: q.error };
}

export function useProduct(slug: string | undefined) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data ? rowToProduct(data as never) : null;
    },
    // Seed from the products list cache (and from any prior single-product
    // prefetch via the same queryKey) so the detail page paints instantly.
    initialData: () =>
      queryClient.getQueryData<Product[]>(["products"])?.find((p) => p.slug === slug),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["products"])?.dataUpdatedAt,
    // SWR: serve cached data immediately; only refetch in background after staleTime.
    staleTime: PRODUCT_STALE_MS,
    gcTime: PRODUCT_GC_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  return {
    product: q.data ?? undefined,
    isLoading: q.isLoading,
    error: q.error,
  };
}

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

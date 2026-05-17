import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ShopConfig = {
  whatsapp_number: string;
  shop_name: string;
  support_hours: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  number: string;
  color: string;
  instructions?: string;
};

const DEFAULT: ShopConfig = {
  whatsapp_number: "8801580607614",
  shop_name: "AccessNow BD",
  support_hours: "9 AM – 12 AM",
};

export function useShopConfig() {
  return useQuery({
    queryKey: ["shop-config"],
    queryFn: async (): Promise<ShopConfig> => {
      const { data, error } = await supabase
        .from("admin_records")
        .select("data")
        .eq("kind", "shop_config")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      if (error || !data) return DEFAULT;
      return { ...DEFAULT, ...((data.data as Partial<ShopConfig>) || {}) };
    },
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async (): Promise<PaymentMethod[]> => {
      const { data, error } = await supabase
        .from("admin_records")
        .select("data")
        .eq("kind", "payment_method")
        .eq("is_active", true)
        .order("sort_order");
      if (error || !data) return [];
      return data.map((r) => r.data as PaymentMethod);
    },
    staleTime: 10 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  });
}

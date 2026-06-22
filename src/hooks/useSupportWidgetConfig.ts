import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SupportWidgetConfig = {
  orb_from: string;
  orb_via: string;
  orb_to: string;
  ring_color: string;
  spin_color_1: string;
  spin_color_2: string;
  icon_color: string;
};

export const DEFAULT_SUPPORT_WIDGET: SupportWidgetConfig = {
  orb_from: "#064e3b",
  orb_via: "#047857",
  orb_to: "#022c22",
  ring_color: "#10b981",
  spin_color_1: "#10b981",
  spin_color_2: "#34d399",
  icon_color: "#ffffff",
};


export function useSupportWidgetConfig() {
  return useQuery({
    queryKey: ["support-widget-config"],
    queryFn: async (): Promise<SupportWidgetConfig> => {
      const { data, error } = await supabase
        .from("admin_records")
        .select("data")
        .eq("kind", "support_widget")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1)
        .maybeSingle();
      if (error || !data) return DEFAULT_SUPPORT_WIDGET;
      return { ...DEFAULT_SUPPORT_WIDGET, ...((data.data as Partial<SupportWidgetConfig>) || {}) };
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

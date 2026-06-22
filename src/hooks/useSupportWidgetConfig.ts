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
  orb_from: "#3b0764",
  orb_via: "#6d28d9",
  orb_to: "#1e1b4b",
  ring_color: "#8b5cf6",
  spin_color_1: "#a855f7",
  spin_color_2: "#c084fc",
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

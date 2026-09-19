import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LIVE_TICKER, fetchLiveTickerConfig, type LiveTickerConfig } from "@/lib/live-ticker";

export function useLiveTickerConfig() {
  const q = useQuery<LiveTickerConfig>({
    queryKey: ["live-ticker-config"],
    queryFn: fetchLiveTickerConfig,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  return { config: q.data ?? DEFAULT_LIVE_TICKER, isLoading: q.isLoading };
}

import useSWR from "swr";
import { fetchJSON, FetchResponse } from "../lib/apiClient";
import { samples } from "../data/samples";

export type MarketSnapshot = {
  lastUpdated: string;
  indices: Array<{ name: string; symbol: string; level: number; changePct: number }>;
  fx: Array<{ pair: string; rate: number; changePct: number }>;
  heatmap: Array<{ symbol: string; sector: string; changePct: number; weight: number; lastClose?: number }>;
  commodities?: Array<{ name: string; price: number; changePct: number }>;
};

export const useMarket = () => {
  const swr = useSWR<FetchResponse<MarketSnapshot>>(["markets"], () =>
    fetchJSON<MarketSnapshot>("/api/v1/markets/overview", { fallback: () => samples.markets as MarketSnapshot })
  );
  return {
    data: swr.data?.data,
    source: swr.data?.source ?? "fallback",
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate
  };
};

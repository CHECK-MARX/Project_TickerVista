import useSWR from "swr";
import { fetchJSON, FetchResponse, DataSource } from "../lib/apiClient";
import { samples } from "../data/samples";

export type TopMoverEntry = {
  rank: number;
  symbol: string;
  name: string;
  exchange: string;
  changePct: number;
  lastPrice: number;
};

export type DividendEntry = {
  rank: number;
  symbol: string;
  name: string;
  exchange: string;
  dividendYield: number;
  lastPrice: number;
};

export type RankingsResponse = {
  lastUpdated: string;
  gainers: TopMoverEntry[];
  dividends: DividendEntry[];
};

type TopListResponse = {
  lastUpdated: string;
  items: Array<Record<string, unknown>>;
};

const fallbackRankings = samples.rankings as RankingsResponse;

export const useRankings = () => {
  const swr = useSWR<FetchResponse<RankingsResponse>>(["rankings"], async () => {
    const [movers, dividends] = await Promise.all([
      fetchJSON<TopListResponse>("/api/v1/rankings/top-movers", {
        fallback: () => ({
          lastUpdated: fallbackRankings.lastUpdated,
          items: fallbackRankings.gainers as unknown as Record<string, unknown>[]
        })
      }),
      fetchJSON<TopListResponse>("/api/v1/rankings/dividends", {
        fallback: () => ({
          lastUpdated: fallbackRankings.lastUpdated,
          items: fallbackRankings.dividends as unknown as Record<string, unknown>[]
        })
      })
    ]);

    const source: DataSource =
      movers.source === "live" && dividends.source === "live" ? "live" : "fallback";

    return {
      data: {
        lastUpdated: movers.data.lastUpdated ?? dividends.data.lastUpdated ?? new Date().toISOString(),
        gainers: movers.data.items as TopMoverEntry[],
        dividends: dividends.data.items as DividendEntry[]
      },
      source
    };
  });

  return {
    data: swr.data?.data,
    source: swr.data?.source ?? "fallback",
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate
  };
};

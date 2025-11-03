import { useQuery } from "@tanstack/react-query";
import type { SymbolDto } from "../api/types";
import { fetchJSON } from "../lib/apiClient";
import { samples } from "../data/samples";

export const useSymbolSearch = (query: string, exchangeFilter?: string) => {
  return useQuery<SymbolDto[]>({
    queryKey: ["symbol-search", query, exchangeFilter],
    queryFn: async () => {
      const res = await fetchJSON<SymbolDto[]>("/api/v1/symbols", {
        params: {
          query: query || undefined,
          exchange: exchangeFilter,
          limit: 50
        },
        fallback: () => samples.symbolIndex as SymbolDto[]
      });
      const normalized = query.trim().toLowerCase();
      return res.data
        .filter((item) => {
          if (!normalized) return true;
          return (
            item.symbol.toLowerCase().includes(normalized) ||
            item.name.toLowerCase().includes(normalized)
          );
        })
        .slice(0, 20);
    },
    staleTime: 10_000
  });
};

import { useQuery } from "@tanstack/react-query";
import type { TooltipEntry } from "../api/types";
import { fetchJSON } from "../lib/apiClient";
import { samples } from "../data/samples";

export const useDictionary = () =>
  useQuery<TooltipEntry[]>({
    queryKey: ["dictionary"],
    queryFn: async () => {
      const res = await fetchJSON<TooltipEntry[]>("/api/v1/dictionary", {
        fallback: () => samples.indicators as TooltipEntry[]
      });
      return res.data;
    },
    staleTime: 3600_000
  });

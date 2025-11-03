import useSWR from "swr";
import { fetchJSON, FetchResponse } from "../lib/apiClient";
import { samples } from "../data/samples";

export type SectorSnapshot = {
  name: string;
  theme: string;
  performance1d: number;
  performance1m: number;
  leaders: string[];
  laggards: string[];
  tags: string[];
};

export type SectorResponse = {
  lastUpdated: string;
  data: SectorSnapshot[];
};

export const useSectors = () => {
  const swr = useSWR<FetchResponse<SectorResponse>>(["sectors"], () =>
    fetchJSON<SectorResponse>("/api/v1/sectors/overview", { fallback: () => samples.sectors as SectorResponse })
  );
  return {
    data: swr.data?.data,
    source: swr.data?.source ?? "fallback",
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate
  };
};

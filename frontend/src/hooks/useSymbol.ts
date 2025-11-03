import useSWR from "swr";
import type {
  ForecastResponseDto,
  IndicatorsResponseDto,
  InsightSummaryResponse,
  OhlcvSeriesResponse
} from "../api/types";
import { fetchJSON, FetchResponse, DataSource } from "../lib/apiClient";
import { getSymbolSample } from "../data/samples";

type SymbolSample = {
  ohlcv: OhlcvSeriesResponse;
  indicators: IndicatorsResponseDto;
  forecast: ForecastResponseDto;
  insights: InsightSummaryResponse;
  availableRanges?: string[];
};

const sampleLoader = <K extends keyof SymbolSample>(symbol: string, key: K) => {
  const sample = getSymbolSample(symbol) as SymbolSample | undefined;
  if (!sample) {
    throw new Error(`No fallback sample for ${symbol}`);
  }
  return sample[key];
};

const fetchSymbolBundle = async (symbol: string): Promise<FetchResponse<SymbolBundle>> => {
  const now = new Date();
  const from = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

  const deriveRanges = (candles: OhlcvSeriesResponse["candles"]) => {
    const days = candles.length;
    const ranges: string[] = [];
    if (days >= 22) ranges.push("1M");
    if (days >= 66) ranges.push("3M");
    if (days >= 132) ranges.push("6M");
    if (days >= 264) ranges.push("1Y");
    if (days >= 528) ranges.push("2Y");
    return ranges;
  };

  const requests = await Promise.all([
    fetchJSON<OhlcvSeriesResponse>("/api/v1/ohlcv", {
      params: { symbol, tf: "1d", from: from.toISOString(), to: now.toISOString() },
      fallback: () => sampleLoader(symbol, "ohlcv")
    }),
    fetchJSON<IndicatorsResponseDto>("/api/v1/indicators", {
      params: { symbol, tf: "1d" },
      fallback: () => sampleLoader(symbol, "indicators")
    }),
    fetchJSON<ForecastResponseDto>("/api/v1/forecast", {
      params: { symbol },
      fallback: () => sampleLoader(symbol, "forecast")
    }),
    fetchJSON<InsightSummaryResponse>("/api/v1/insights/summary", {
      params: { symbol },
      fallback: () => sampleLoader(symbol, "insights")
    })
  ]);

  const source: DataSource = requests.some((res) => res.source === "fallback") ? "fallback" : "live";
  const sample = getSymbolSample(symbol) as SymbolSample | undefined;
  const ranges = deriveRanges(requests[0].data.candles);

  return {
    data: {
      ohlcv: requests[0].data,
      indicators: requests[1].data,
      forecast: requests[2].data,
      insights: requests[3].data,
      availableRanges: ranges.length > 0 ? ranges : sample?.availableRanges
    },
    source
  };
};

export type SymbolBundle = {
  ohlcv: OhlcvSeriesResponse;
  indicators: IndicatorsResponseDto;
  forecast: ForecastResponseDto;
  insights: InsightSummaryResponse;
  availableRanges?: string[];
};

export const useSymbol = (symbol?: string) => {
  const swr = useSWR(symbol ? ["symbol", symbol] : null, () => fetchSymbolBundle(symbol!));
  return {
    data: swr.data?.data,
    source: swr.data?.source ?? "fallback",
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate
  };
};

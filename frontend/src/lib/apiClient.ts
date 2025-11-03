import { API_BASE } from "./config";

type QueryParams = Record<string, string | number | undefined>;

type FallbackLoader<T> = () => Promise<T> | T;

export type DataSource = "live" | "fallback";

export type FetchResponse<T> = {
  data: T;
  source: DataSource;
};

type FetchOptions<T> = {
  params?: QueryParams;
  fallback?: FallbackLoader<T>;
};

const forcedDemo = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1";

let currentSource: DataSource = forcedDemo || !API_BASE ? "fallback" : "live";
const sourceListeners = new Set<(source: DataSource) => void>();

const enforceHttps = (value: string) => (/^http:\/\//i.test(value) ? value.replace(/^http:\/\//i, "https://") : value);

const notifySource = (source: DataSource) => {
  currentSource = source;
  sourceListeners.forEach((listener) => listener(source));
};

const buildUrl = (path: string, params?: QueryParams) => {
  if (!path.startsWith("/")) {
    return path;
  }
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  const base = enforceHttps(API_BASE).replace(/\/$/, "");
  return `${base}${path}${query ? `?${query}` : ""}`;
};

const mapStaticEndpoint = (path: string, params?: QueryParams) => {
  const base = enforceHttps(API_BASE).replace(/\/$/, "");
  if (!base || /^https?:\/\//i.test(base)) {
    return null;
  }
  const symbol = params?.symbol;
  switch (path) {
    case "/api/v1/ohlcv":
      return symbol ? `${base}/symbols/${symbol}/ohlcv.json` : null;
    case "/api/v1/indicators":
      return symbol ? `${base}/symbols/${symbol}/indicators.json` : null;
    case "/api/v1/forecast":
      return symbol ? `${base}/symbols/${symbol}/forecast.json` : null;
    case "/api/v1/insights/summary":
      return symbol ? `${base}/symbols/${symbol}/insights.json` : null;
    case "/api/v1/symbols":
      return `${base}/symbols/index.json`;
    case "/api/v1/markets/overview":
      return `${base}/markets/overview.json`;
    case "/api/v1/sectors/overview":
      return `${base}/sectors/overview.json`;
    case "/api/v1/dictionary":
      return `${base}/dictionary.json`;
    case "/api/v1/rankings/top-movers":
      return `${base}/rankings/top_lists.json`;
    case "/api/v1/rankings/dividends":
      return `${base}/rankings/top_lists.json`;
    default:
      return `${base}${path}`;
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (url: string, timeoutMs: number) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const loadFallback = async <T>(fallback?: FallbackLoader<T>): Promise<T> => {
  if (!fallback) {
    throw new Error("No fallback data available");
  }
  const value = fallback();
  return value instanceof Promise ? await value : value;
};

export const fetchJSON = async <T>(path: string, options?: FetchOptions<T>): Promise<FetchResponse<T>> => {
  const shouldUseFallback = forcedDemo || !API_BASE;
  if (shouldUseFallback) {
    const data = await loadFallback(options?.fallback);
    notifySource("fallback");
    return { data, source: "fallback" };
  }

  const staticUrl = mapStaticEndpoint(path, options?.params);
  const url = enforceHttps(staticUrl ?? buildUrl(path, options?.params));
  const attempts = 3;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const data = await fetchWithTimeout(url, 5000);
      notifySource("live");
      return { data, source: "live" };
    } catch (error) {
      if (attempt === attempts - 1) {
        const fallbackData = await loadFallback(options?.fallback);
        notifySource("fallback");
        return { data: fallbackData, source: "fallback" };
      }
      await wait(2 ** attempt * 300);
    }
  }
  throw new Error("Unexpected fetch failure");
};

export const subscribeSource = (listener: (source: DataSource) => void) => {
  sourceListeners.add(listener);
  return () => sourceListeners.delete(listener);
};

export const getCurrentSource = () => currentSource;

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { OhlcvPointDto, SymbolDto } from "../api/types";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { SymbolSearch } from "../components/SymbolSearch";
import { useSymbolSearch } from "../hooks/useSymbolSearch";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useRecentSymbols } from "../hooks/useRecentSymbols";
import { Tag } from "../components/ui/Tag";
import { usePageMeta } from "../contexts/PageMetaContext";
import { useI18n } from "../lib/i18n";
import { samples } from "../data/samples";
import { useSymbol } from "../hooks/useSymbol";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const SymbolsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const debounced = useDebouncedValue(query, 300);
  const suggestions = useSymbolSearch(debounced);
  const [selected, setSelected] = useState<SymbolDto | null>(null);
  const { symbols: recentSymbols } = useRecentSymbols();
  const { setMeta } = usePageMeta();
  const { t } = useI18n();
  const symbolParam = searchParams.get("symbol");
  const [granularity, setGranularity] = useState<ChartGranularity>("daily");
  const selectedSymbol = selected?.symbol;
  const {
    data: selectedData,
    isLoading: selectedLoading,
    source: selectedSource,
    error: selectedError
  } = useSymbol(selectedSymbol);

  const latestCandle = useMemo(() => {
    if (!selectedData?.ohlcv?.candles?.length) return undefined;
    const candles = selectedData.ohlcv.candles;
    return candles[candles.length - 1];
  }, [selectedData?.ohlcv?.candles]);

  const previousCandle = useMemo(() => {
    if (!selectedData?.ohlcv?.candles || selectedData.ohlcv.candles.length < 2) return undefined;
    const candles = selectedData.ohlcv.candles;
    return candles[candles.length - 2];
  }, [selectedData?.ohlcv?.candles]);

  const latestChange = useMemo(() => {
    if (!latestCandle || !previousCandle) return 0;
    if (previousCandle.close === 0) return 0;
    return ((latestCandle.close - previousCandle.close) / previousCandle.close) * 100;
  }, [latestCandle, previousCandle]);

  const yearWindow = useMemo(() => {
    if (!selectedData?.ohlcv?.candles?.length) return { high: 0, low: 0, avgVolume: 0 };
    const candles = selectedData.ohlcv.candles.slice(-252);
    if (candles.length === 0) return { high: 0, low: 0, avgVolume: 0 };
    let high = candles[0].high;
    let low = candles[0].low;
    let volumeSum = 0;
    candles.forEach((candle) => {
      high = Math.max(high, candle.high);
      low = Math.min(low, candle.low);
      volumeSum += candle.volume;
    });
    return {
      high,
      low,
      avgVolume: volumeSum / candles.length
    };
  }, [selectedData?.ohlcv?.candles]);

  const dayRange = useMemo(() => {
    if (!selectedData?.ohlcv?.candles?.length) return { min: 0, max: 0 };
    const candles = selectedData.ohlcv.candles.slice(-20);
    let min = candles[0].low;
    let max = candles[0].high;
    candles.forEach((candle) => {
      min = Math.min(min, candle.low);
      max = Math.max(max, candle.high);
    });
    return { min, max };
  }, [selectedData?.ohlcv?.candles]);

  const forecastHeadline = selectedData?.forecast?.bands?.[0];

  const chartSeries = useMemo(() => {
    if (!selectedData?.ohlcv?.candles) return [];
    return buildChartSeries(selectedData.ohlcv.candles, granularity);
  }, [selectedData?.ohlcv?.candles, granularity]);

  useEffect(() => {
    setMeta({ lastUpdated: new Date().toISOString() });
  }, [setMeta]);

  useEffect(() => {
    if (symbolParam) {
      const match = (samples.symbolIndex as SymbolDto[]).find((item) => item.symbol === symbolParam);
      if (match) {
        setSelected(match);
        setQuery(match.symbol);
      }
    }
  }, [symbolParam]);

  const handleSelect = (symbol: SymbolDto) => {
    setSelected(symbol);
    setSearchParams({ q: symbol.symbol, symbol: symbol.symbol });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    const next = value ? { q: value, symbol: value } : {};
    setSearchParams(next as Record<string, string>);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.symbols")} subtitle={t("symbols.results")} tags={["検索", "チャート", "指標"]} />
      <div className="grid gap-6 xl:grid-cols-[340px,1fr]">
        <div className="space-y-6">
          <Card>
            <SymbolSearch value={query} onValueChange={handleQueryChange} onSelect={handleSelect} />
            <p className="mt-3 text-xs text-slate-500">{t("symbols.search_help")}</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("symbols.results")}</h3>
              <p className="text-xs text-slate-500">
                {t("symbols.counts_label")}: {suggestions.data?.length ?? 0}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {suggestions.isLoading && <p className="text-sm text-slate-500">{t("common.loading")}...</p>}
              {!suggestions.isLoading && (suggestions.data?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500">{t("common.search_placeholder")}</p>
              )}
              {suggestions.data?.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-3 py-2 text-left hover:border-slate-900 dark:border-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.symbol}</p>
                    <p className="text-xs text-slate-500">{item.name}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>{item.exchange}</p>
                    <p>{item.currency}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("symbols.recent")}</h3>
            <div className="mt-4 space-y-2">
              {recentSymbols.length === 0 && <p className="text-sm text-slate-500">{t("symbols.empty_recent")}</p>}
              {recentSymbols.map((item) => (
                <div key={item.symbol} className="rounded-2xl border border-slate-100 px-3 py-2 dark:border-slate-700">
                  <p className="font-semibold">{item.symbol}</p>
                  <p className="text-xs text-slate-500">{item.name}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          {selected ? (
            <div className="grid gap-6 2xl:grid-cols-[2fr,1fr]">
              <Card className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("symbols.selected")}</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{selected.symbol}</h3>
                    <p className="text-lg text-slate-600 dark:text-slate-300">{selected.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Tag>{selected.exchange}</Tag>
                      <Tag>{selected.currency}</Tag>
                      <Tag>{selected.sector || "Unknown sector"}</Tag>
                      <Tag>{selected.tz}</Tag>
                      <Tag>{selectedSource === "live" ? t("symbols.live_tag") : t("symbols.fallback_tag")}</Tag>
                    </div>
                  </div>
                  <div className="text-right">
                    {selectedLoading && <p className="text-sm text-slate-500">{t("common.loading")}...</p>}
                    {selectedError && <p className="text-sm text-red-500">{String(selectedError)}</p>}
                {selectedData && latestCandle && (
                  <>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                      {formatCurrency(latestCandle.close, selected.currency)}
                    </p>
                    <p className={latestChange >= 0 ? "text-sm text-emerald-500" : "text-sm text-red-500"}>
                      {latestChange >= 0 ? "+" : ""}
                      {latestChange.toFixed(2)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(latestCandle.ts).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            </div>

            {selectedData && !selectedLoading && !selectedError && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <SectionTitle>{t("symbols.chart_section")}</SectionTitle>
                  <GranularityToggle active={granularity} onChange={setGranularity} />
                  <p className="text-xs text-slate-500">{t("symbols.chart_description")}</p>
                  <PriceVolumeChart data={chartSeries} currency={selected.currency} granularity={granularity} />

                  <SectionTitle>{t("symbols.intraday_section")}</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryStat label="始値" value={formatCurrency(latestCandle?.open, selected.currency)} />
                    <SummaryStat label="高値" value={formatCurrency(latestCandle?.high, selected.currency)} />
                    <SummaryStat label="安値" value={formatCurrency(latestCandle?.low, selected.currency)} />
                    <SummaryStat label="出来高" value={formatNumber(latestCandle?.volume, 0)} />
                    <SummaryStat label="前日終値" value={formatCurrency(previousCandle?.close, selected.currency)} />
                    <SummaryStat label="直近20日レンジ" value={`${formatCurrency(dayRange.min, selected.currency)} - ${formatCurrency(dayRange.max, selected.currency)}`} />
                  </div>

                  <SectionTitle>{t("symbols.technical_section")}</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryStat label="RSI (14)" value={selectedData.indicators.rsi14.toFixed(1)} />
                    <SummaryStat label="SMA 20 / 50" value={`${selectedData.indicators.sma.sma20.toFixed(1)} / ${selectedData.indicators.sma.sma50.toFixed(1)}`} />
                    <SummaryStat label="MACD" value={`${selectedData.indicators.macd.macd.toFixed(2)}`} />
                    <SummaryStat label="MACD Signal" value={`${selectedData.indicators.macd.signal.toFixed(2)}`} />
                  </div>
                  <a
                    href={t("symbols.tech_help_link")}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline hover:text-blue-800"
                  >
                    {t("symbols.tech_help_text")}
                  </a>

                  <SectionTitle>{t("symbols.forecast_section")}</SectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SummaryStat label="Day 1 Mid" value={forecastHeadline ? formatCurrency(forecastHeadline.mid, selected.currency) : "-"} />
                    <SummaryStat label="Day 1 予測幅" value={forecastHeadline ? `${formatCurrency(forecastHeadline.lower, selected.currency)} - ${formatCurrency(forecastHeadline.upper, selected.currency)}` : "-"} />
                  </div>
                </div>

                <div className="space-y-4">
                  <SectionTitle>52週の指標</SectionTitle>
                  <div className="grid gap-3">
                    <SummaryStat label="52週高値" value={formatCurrency(yearWindow.high, selected.currency)} />
                    <SummaryStat label="52週安値" value={formatCurrency(yearWindow.low, selected.currency)} />
                    <SummaryStat label="平均出来高 (52週)" value={formatNumber(yearWindow.avgVolume, 0)} />
                  </div>

                  <SectionTitle>{t("symbols.insight_section")}</SectionTitle>
                  <ul className="space-y-2 text-sm">
                    {selectedData.insights.highlights.map((item) => (
                      <li key={`highlight-${item}`} className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <SectionTitle>{t("symbols.risk_section")}</SectionTitle>
                  <ul className="space-y-2 text-sm">
                    {selectedData.insights.watchouts.map((item) => (
                      <li key={`watchout-${item}`} className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card>
              <SectionTitle>{t("symbols.summary_section")}</SectionTitle>
              <div className="space-y-3 text-sm text-slate-500">
                <p>{selectedData?.insights.state}</p>
                <p>{selectedData?.insights.disclaimer}</p>
              </div>
            </Card>
            <Card>
              <SectionTitle>{t("symbols.checklist_section")}</SectionTitle>
              <ul className="space-y-2 text-sm">
                {selectedData?.insights.checklist.map((item) => (
                  <li key={`check-${item}`} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                    {item}
                  </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("symbols.empty_selection")}</h3>
              <p className="mt-2 text-sm text-slate-500">{t("symbols.empty_message")}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SymbolsPage;

type SummaryStatProps = {
  label: string;
  value: string;
};

const SummaryStat = ({ label, value }: SummaryStatProps) => (
  <div className="rounded-2xl border border-slate-100 bg-white/70 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
    <p className="font-semibold text-slate-500">{label}</p>
    <p className="text-sm text-slate-900 dark:text-white">{value}</p>
  </div>
);

type SectionTitleProps = {
  children: string;
};

const SectionTitle = ({ children }: SectionTitleProps) => (
  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h4>
);

const formatCurrency = (value?: number, currency?: string) => {
  if (value === undefined || Number.isNaN(value)) return "-";
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency ?? ""}`.trim();
};

const formatNumber = (value?: number, fractionDigits = 0) => {
  if (value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
};

type ChartGranularity = "daily" | "weekly" | "monthly";

type ChartPoint = {
  ts: string;
  label: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
};

type GranularityToggleProps = {
  active: ChartGranularity;
  onChange: (value: ChartGranularity) => void;
};

const GranularityToggle = ({ active, onChange }: GranularityToggleProps) => {
  const options: ChartGranularity[] = ["daily", "weekly", "monthly"];
  const labels: Record<ChartGranularity, string> = {
    daily: "日足",
    weekly: "週足",
    monthly: "月足"
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            active === option
              ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
              : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  );
};

type PriceVolumeChartProps = {
  data: ChartPoint[];
  currency?: string;
  granularity: ChartGranularity;
};

const PriceVolumeChart = ({ data, currency, granularity }: PriceVolumeChartProps) => {
  if (!data.length) {
    return <p className="text-xs text-slate-500">表示できるチャートデータがありません。</p>;
  }

  const priceData = data.map((point) => ({
    label: point.label,
    low: point.low,
    range: point.high - point.low,
    close: point.close
  }));

  const volumeData = data.map((point) => ({
    label: point.label,
    volume: point.volume
  }));

  const tooltipFormatter = (value: number | undefined, name?: string) => {
    if (value === undefined || Number.isNaN(value)) return "-";
    if (name === "close") {
      return `${value.toFixed(2)} ${currency ?? ""}`.trim();
    }
    return value.toFixed(2);
  };

  const formatLabel = (label: string) => {
    const date = new Date(label);
    if (granularity === "monthly") {
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ top: 10, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="price-range" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="text-slate-200" />
            <XAxis dataKey="label" tickFormatter={formatLabel} minTickGap={32} />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip<number, string>
              labelFormatter={formatLabel}
              formatter={tooltipFormatter}
            />
            <Area type="monotone" dataKey="low" stackId="range" stroke="transparent" fill="transparent" />
            <Area type="monotone" dataKey="range" stackId="range" stroke="none" fill="url(#price-range)" />
            <Area type="monotone" dataKey="close" stroke="#0f172a" fillOpacity={0} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={volumeData}>
            <XAxis dataKey="label" hide />
            <YAxis hide />
            <Tooltip<number, string>
              labelFormatter={formatLabel}
              formatter={(value) => (value ? value.toLocaleString() : "-")}
            />
            <Bar dataKey="volume" fill="#0f172a" opacity={0.25} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const buildChartSeries = (candles: OhlcvPointDto[], granularity: ChartGranularity): ChartPoint[] => {
  if (candles.length === 0) return [];
  switch (granularity) {
    case "weekly":
      return aggregateCandles(candles, groupByIsoWeek).slice(-156);
    case "monthly":
      return aggregateCandles(candles, groupByYearMonth).slice(-120);
    case "daily":
    default:
      return candles.slice(-180).map((candle) => ({
        ts: candle.ts,
        label: candle.ts,
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        volume: candle.volume
      }));
  }
};

type GroupKeyFn = (date: Date) => string;

const aggregateCandles = (candles: OhlcvPointDto[], keyFn: GroupKeyFn): ChartPoint[] => {
  const buckets = new Map<string, ChartPoint>();
  candles
    .slice()
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .forEach((candle) => {
      const key = keyFn(new Date(candle.ts));
      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, {
          ts: candle.ts,
          label: candle.ts,
          open: candle.open,
          close: candle.close,
          high: candle.high,
          low: candle.low,
          volume: candle.volume
        });
      } else {
        existing.ts = candle.ts;
        existing.label = candle.ts;
        existing.close = candle.close;
        existing.high = Math.max(existing.high, candle.high);
        existing.low = Math.min(existing.low, candle.low);
        existing.volume += candle.volume;
      }
    });

  return Array.from(buckets.values()).sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );
};

const groupByIsoWeek: GroupKeyFn = (date) => {
  const iso = getISOWeek(date);
  return `${iso.year}-W${String(iso.week).padStart(2, "0")}`;
};

const groupByYearMonth: GroupKeyFn = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const getISOWeek = (date: Date) => {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: tmp.getUTCFullYear(), week };
};

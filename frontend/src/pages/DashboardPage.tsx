import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { SymbolSearch } from "../components/SymbolSearch";
import { DashboardSummary } from "../components/DashboardSummary";
import { ChartPanel } from "../components/ChartPanel";
import { IndicatorPanel } from "../components/IndicatorPanel";
import { ForecastPanel } from "../components/ForecastPanel";
import { IndicatorDictionary } from "../components/IndicatorDictionary";
import type { OhlcvSeriesResponse } from "../api/types";
import { useDictionary } from "../hooks/useDictionary";
import { useSymbol } from "../hooks/useSymbol";
import { useI18n } from "../lib/i18n";
import { usePageMeta } from "../contexts/PageMetaContext";

const RANGE_OPTIONS = ["1M", "3M", "6M", "1Y", "2Y"] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];

const QUICK_SYMBOLS: string[] = ["AAPL", "NVDA", "7203.T"];

const RANGE_TO_DAYS: Record<RangeOption, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "2Y": 730
};

const filterCandles = (candles: OhlcvSeriesResponse["candles"], range: RangeOption, available?: RangeOption[]) => {
  if (candles.length === 0) {
    return { candles: [], resolved: range };
  }
  const now = new Date(candles[candles.length - 1].ts).getTime();
  const fallbackOrder: RangeOption[] = available && available.length > 0 ? available : ["1M", "3M", "6M", "1Y", "2Y"];
  const startIndex = fallbackOrder.indexOf(range);

  for (let idx = startIndex; idx < fallbackOrder.length; idx += 1) {
    const candidate = fallbackOrder[idx] ?? fallbackOrder[fallbackOrder.length - 1];
    const cutoff = now - RANGE_TO_DAYS[candidate] * 24 * 60 * 60 * 1000;
    const filtered = candles.filter((candle) => new Date(candle.ts).getTime() >= cutoff);
    if (filtered.length >= 2) {
      return { candles: filtered, resolved: candidate };
    }
  }
  return { candles, resolved: range };
};

const DashboardPage = () => {
  const { t } = useI18n();
  const { setMeta } = usePageMeta();
  const dictionaryEntries = useDictionary();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get("symbol") ?? QUICK_SYMBOLS[0];
  const [symbol, setSymbol] = useState(initialSymbol);
  const [range, setRange] = useState<RangeOption>("3M");

  const { data, isLoading, error, mutate } = useSymbol(symbol);

  useEffect(() => {
    if (data?.ohlcv.candles.length) {
      const latest = data.ohlcv.candles[data.ohlcv.candles.length - 1].ts;
      setMeta({ lastUpdated: latest });
    }
  }, [data?.ohlcv.candles, setMeta]);

  useEffect(() => {
    setSearchParams({ symbol });
  }, [symbol, setSearchParams]);

  const resolvedSeries = useMemo(() => {
    if (!data?.ohlcv) return null;
    const { candles, resolved } = filterCandles(
      data.ohlcv.candles,
      range,
      (data.availableRanges as RangeOption[] | undefined) ?? undefined
    );
    return {
      series: { ...data.ohlcv, candles },
      resolved
    };
  }, [data?.ohlcv, range]);

  const handleSelect = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
  };

  const showEmpty = !isLoading && !error && !data?.ohlcv.candles.length;

  return (
    <div>
      <PageHeader
        title={t("nav.dashboard")}
        subtitle={t("dashboard.title")}
        tags={QUICK_SYMBOLS}
      />
      <Card className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <SymbolSearch onSelect={(item) => handleSelect(item.symbol)} />
            <div className="flex flex-wrap gap-2 text-xs">
              {QUICK_SYMBOLS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`rounded-full border px-3 py-1 font-semibold ${
                    symbol === item
                      ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                      : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  resolvedSeries?.resolved === option
                    ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading && <Card className="text-center text-sm text-slate-500">{t("common.loading")}...</Card>}

      {error && (
        <Card className="text-center text-sm text-red-500">
          <p className="mb-3">{t("dashboard.no_data")}</p>
          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-full bg-slate-900 px-4 py-2 text-white dark:bg-white dark:text-slate-900"
          >
            {t("common.retry")}
          </button>
        </Card>
      )}

      {showEmpty && (
        <Card className="text-center text-sm text-slate-500">
          <p className="mb-3">
            {t("dashboard.no_data")} : {symbol}
          </p>
          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-full bg-slate-900 px-4 py-2 text-white dark:bg-white dark:text-slate-900"
          >
            {t("common.retry")}
          </button>
        </Card>
      )}

      {!isLoading && !error && data && resolvedSeries?.series && (
        <div className="flex flex-col gap-6">
          <DashboardSummary insight={data.insights} />
          <ChartPanel series={resolvedSeries.series} forecast={data.forecast} />
          <IndicatorPanel indicators={data.indicators} />
          <ForecastPanel forecast={data.forecast} />
          <IndicatorDictionary entries={dictionaryEntries.data ?? []} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

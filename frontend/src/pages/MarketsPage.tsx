import { useEffect, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { Stat } from "../components/ui/Stat";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { useMarket } from "../hooks/useMarket";
import { usePageMeta } from "../contexts/PageMetaContext";
import { useI18n } from "../lib/i18n";

const MarketsPage = () => {
  const { data, isLoading, error, mutate } = useMarket();
  const { setMeta } = usePageMeta();
  const { t } = useI18n();

  useEffect(() => {
    if (data?.lastUpdated) {
      setMeta({ lastUpdated: data.lastUpdated });
    }
  }, [data?.lastUpdated, setMeta]);

  if (isLoading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="text-center text-sm text-slate-500">
        <p className="mb-3">{t("dashboard.no_data")}</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="rounded-full bg-slate-900 px-4 py-2 text-white dark:bg-white dark:text-slate-900"
        >
          {t("common.retry")}
        </button>
      </Card>
    );
  }

  const heatmapData = useMemo(
    () =>
      data.heatmap.map((cell) => ({
        symbol: cell.symbol,
        sector: cell.sector,
        changePct: cell.changePct,
        weight: Math.max(cell.weight ?? 1, 1),
        lastClose: cell.lastClose
      })),
    [data.heatmap]
  );

  return (
    <div>
      <PageHeader title={t("nav.markets")} subtitle={t("markets.subtitle")} tags={["指数", "為替", "ヒートマップ"]} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("markets.top_indices")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.indices.map((index) => (
              <Stat key={index.symbol} label={index.name} value={index.level.toFixed(2)} subValue={index.symbol} trend={index.changePct} />
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("markets.fx_pairs")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.fx.map((pair) => (
              <Stat key={pair.pair} label={pair.pair} value={pair.rate.toFixed(3)} trend={pair.changePct} />
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("markets.heatmap_title")}</p>
            <p className="text-sm text-slate-500">{t("markets.heatmap_description")}</p>
          </div>
          <HeatmapLegend />
        </div>
        <HeatmapGrid data={heatmapData} />
      </Card>
    </div>
  );
};

export default MarketsPage;

const HEATMAP_MAX = 4;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getHeatmapColor = (changePct: number) => {
  const clamped = clamp(changePct, -HEATMAP_MAX, HEATMAP_MAX);
  const ratio = clamped / HEATMAP_MAX;
  if (ratio >= 0) {
    const lightness = 58 - ratio * 18;
    return `hsl(152, 60%, ${lightness}%)`;
  }
  const lightness = 60 + Math.abs(ratio) * 18;
  return `hsl(0, 70%, ${lightness}%)`;
};

type HeatmapCell = {
  symbol: string;
  sector: string;
  changePct: number;
  weight: number;
  lastClose?: number;
};

const HeatmapGrid = ({ data }: { data: HeatmapCell[] }) => {
  const { t } = useI18n();
  if (!data.length) {
    return <p className="mt-4 text-sm text-slate-500">{t("markets.heatmap_no_data")}</p>;
  }

  const weightValues = data.map((item) => item.weight);
  const maxWeight = Math.max(...weightValues, 1);

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {data.map((item) => {
        const sizeRatio = Math.max(item.weight / maxWeight, 0.3);
        const height = 140 + sizeRatio * 80;
        const color = getHeatmapColor(item.changePct);
        return (
          <div
            key={item.symbol}
            className="flex flex-col justify-between rounded-3xl border border-white/30 px-4 py-3 text-slate-900 shadow-sm dark:border-slate-800"
            style={{ background: color, minHeight: `${height}px` }}
          >
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="rounded-full bg-white/40 px-2 py-0.5">{item.sector}</span>
              {typeof item.lastClose === "number" && (
                <span>
                  {t("markets.heatmap_close")} {item.lastClose.toFixed(2)}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{item.symbol}</p>
              <p className="text-sm text-slate-700">
                {t("markets.heatmap_change")}: {item.changePct >= 0 ? "+" : ""}
                {item.changePct.toFixed(2)}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HeatmapLegend = () => {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span>{t("markets.heatmap_legend")}</span>
        <div className="h-3 w-36 rounded-full" style={{ background: "linear-gradient(90deg, #dc2626 0%, #f1f5f9 50%, #16a34a 100%)" }} />
        <div className="flex gap-2">
          <span>-3</span>
          <span>0</span>
          <span>+3</span>
        </div>
      </div>
      <a
        href={t("markets.heatmap_hint_link")}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-blue-600 underline hover:text-blue-800"
      >
        {t("markets.heatmap_hint_text")}
      </a>
    </div>
  );
};

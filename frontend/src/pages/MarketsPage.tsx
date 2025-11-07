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
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          {t("markets.heatmap_explainer")}
          <span className="mt-1 block text-[0.72rem] text-slate-400">{t("markets.heatmap_metrics_hint")}</span>
        </p>
        <HeatmapGrid data={heatmapData} />
      </Card>
    </div>
  );
};

export default MarketsPage;

const HEATMAP_MAX = 4;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const adjustLightness = (value: number, delta: number) => Math.max(8, Math.min(92, value + delta));

const getHeatmapVisual = (changePct: number) => {
  const clamped = clamp(changePct, -HEATMAP_MAX, HEATMAP_MAX);
  const ratio = clamped / HEATMAP_MAX;
  const positive = ratio >= 0;
  const magnitude = Math.abs(ratio);
  const hue = positive ? 150 : 0;
  const saturation = positive ? 60 + magnitude * 20 : 68 - magnitude * 8;
  const baseLightness = positive ? 50 - magnitude * 10 : 60 + magnitude * 10;
  const highlight = adjustLightness(baseLightness, 16);
  const mid = adjustLightness(baseLightness, 6);
  const shadow = adjustLightness(baseLightness, -14);
  const glowLightness = adjustLightness(baseLightness, positive ? -6 : -10);

  return {
    gradient: `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${highlight}%), hsl(${hue}, ${Math.min(
      90,
      saturation + 8
    )}%, ${mid}%), hsl(${hue}, ${saturation}%, ${shadow}%))`,
    border: `hsla(${hue}, ${saturation}%, ${highlight}%, 0.4)`,
    glow: `0 18px 36px -18px hsla(${hue}, ${saturation}%, ${glowLightness}%, 0.55)`,
    textColor: mid < 48 ? "#F8FAFC" : "#0F172A"
  };
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
    <div
      className="mt-8 grid gap-4 md:gap-6"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gridAutoRows: "140px" }}
    >
      {data.map((item) => {
        const sizeRatio = Math.max(item.weight / maxWeight, 0.3);
        const span = Math.max(1, Math.round(sizeRatio * 2.4));
        const { gradient, border, glow, textColor } = getHeatmapVisual(item.changePct);
        const secondaryColor = textColor === "#0F172A" ? "rgba(15,23,42,0.68)" : "rgba(241,245,249,0.82)";
        const badgeBg = textColor === "#0F172A" ? "rgba(248,250,252,0.65)" : "rgba(15,23,42,0.28)";
        const badgeText = textColor === "#0F172A" ? "#0F172A" : "#F8FAFC";
        const subtleOutline = textColor === "#0F172A" ? "rgba(15,23,42,0.08)" : "rgba(15,23,42,0.22)";
        const weightScore = Math.round(sizeRatio * 100);
        return (
          <div
            key={item.symbol}
            className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl px-5 py-4 transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl"
            style={{
              backgroundImage: gradient,
              border: `1px solid ${border}`,
              boxShadow: glow,
              gridRowEnd: `span ${span}`
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 group-hover:opacity-80"
              style={{
                boxShadow: `inset 0 1px 0 ${subtleOutline}, inset 0 -18px 40px rgba(15, 15, 15, 0.18)`
              }}
            />
            <div className="relative flex items-center justify-between text-xs font-medium" style={{ color: secondaryColor }}>
              <span style={{ backgroundColor: badgeBg, color: badgeText }} className="rounded-full px-2 py-0.5">
                {item.sector}
              </span>
              {typeof item.lastClose === "number" && (
                <span>
                  {t("markets.heatmap_close")} {item.lastClose.toFixed(2)}
                </span>
              )}
            </div>
            <div className="relative">
              <p className="text-3xl font-bold tracking-tight" style={{ color: textColor }}>
                {item.symbol}
              </p>
              <p className="mt-1 text-sm font-medium" style={{ color: secondaryColor }}>
                {t("markets.heatmap_change")}: {item.changePct >= 0 ? "+" : ""}
                {item.changePct.toFixed(2)}%
              </p>
            </div>
            <div className="relative mt-4 flex items-center justify-between text-[0.7rem] font-semibold" style={{ color: secondaryColor }}>
              <span>
                {t("markets.heatmap_weight_index")} {weightScore}
              </span>
              <span>{t("markets.heatmap_relative_volume")}</span>
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

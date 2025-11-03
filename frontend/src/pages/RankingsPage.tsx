import { useMemo } from "react";
import { useRankings } from "../hooks/useRankings";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useI18n } from "../lib/i18n";

const formatPct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const formatYield = (value: number) => `${(value * 100).toFixed(2)}%`;

const Table = ({
  title,
  columns,
  rows
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) => (
  <Card className="overflow-hidden p-0">
    <header className="border-b border-slate-100 bg-white/60 px-4 py-3 font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
      {title}
    </header>
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
            {columns.map((column) => (
              <th key={column} className="px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${title}-${index}`}
              className="border-b border-slate-100 text-slate-700 odd:bg-white even:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:odd:bg-slate-900 dark:even:bg-slate-800/60"
            >
              {row.map((value, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 align-middle">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

const RankingsPage = () => {
  const { t } = useI18n();
  const { data, isLoading, error, mutate, source } = useRankings();

  const gainersRows = useMemo(() => {
    if (!data?.gainers) return [];
    return data.gainers.map((entry) => [
      entry.rank,
      entry.symbol,
      entry.name,
      entry.exchange,
      entry.lastPrice.toFixed(2),
      formatPct(entry.changePct)
    ]);
  }, [data?.gainers]);

  const dividendRows = useMemo(() => {
    if (!data?.dividends) return [];
    return data.dividends.map((entry) => [
      entry.rank,
      entry.symbol,
      entry.name,
      entry.exchange,
      entry.lastPrice.toFixed(2),
      formatYield(entry.dividendYield)
    ]);
  }, [data?.dividends]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.rankings") ?? "Market Rankings"}
        subtitle={t("rankings.subtitle") ?? "Top movers and income ideas across US & JP equities."}
        tags={["Movers", "Dividends", source.toUpperCase()]}
      />

      {isLoading && <Card className="p-6 text-sm text-slate-500">{t("common.loading")}...</Card>}
      {error && (
        <Card className="p-6 text-sm text-red-500">
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

      {data && (
        <>
          <p className="text-xs text-slate-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
          <Table
            title={`Top ${Math.min(20, data.gainers.length)} daily movers`}
            columns={["#", "Symbol", "Name", "Exchange", "Close", "Δ 1D"]}
            rows={gainersRows.slice(0, 20)}
          />
          <Table
            title={`Top ${Math.min(100, data.dividends.length)} dividend yield`}
            columns={["#", "Symbol", "Name", "Exchange", "Close", "Dividend Yield"]}
            rows={dividendRows.slice(0, 100)}
          />
        </>
      )}
    </div>
  );
};

export default RankingsPage;

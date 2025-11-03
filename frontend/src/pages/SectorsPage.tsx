import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { Skeleton } from "../components/ui/Skeleton";
import { useSectors } from "../hooks/useSectors";
import { usePageMeta } from "../contexts/PageMetaContext";
import { useI18n } from "../lib/i18n";

const SectorsPage = () => {
  const { data, isLoading, error, mutate } = useSectors();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTag = searchParams.get("sector");
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);
  const { setMeta } = usePageMeta();
  const { t } = useI18n();

  useEffect(() => {
    if (data?.lastUpdated) {
      setMeta({ lastUpdated: data.lastUpdated });
    }
  }, [data?.lastUpdated, setMeta]);

  useEffect(() => {
    setSelectedTag(initialTag);
  }, [initialTag]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    data?.data.forEach((sector) => sector.tags.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [data?.data]);

  if (isLoading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
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

  const filtered = data.data.filter((sector) => !selectedTag || sector.tags.includes(selectedTag));

  return (
    <div>
      <PageHeader title={t("nav.sectors")} subtitle="Sector & theme view" tags={["themes", "relative strength"]} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Tag className={!selectedTag ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""}>
          <button
            type="button"
            onClick={() => {
              setSelectedTag(null);
              setSearchParams({});
            }}
          >
            All
          </button>
        </Tag>
        {tags.map((tag) => (
          <Tag key={tag} className={selectedTag === tag ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : ""}>
            <button
              type="button"
              onClick={() => {
                setSelectedTag(tag);
                setSearchParams({ sector: tag });
              }}
            >
              {tag}
            </button>
          </Tag>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((sector) => (
          <Card key={sector.name}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{sector.name}</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{sector.theme}</h3>
              </div>
              <div className="text-right text-sm">
                <p className={sector.performance1d >= 0 ? "text-emerald-500" : "text-rose-500"}>
                  1d {sector.performance1d >= 0 ? "+" : ""}
                  {sector.performance1d.toFixed(1)}%
                </p>
                <p className={sector.performance1m >= 0 ? "text-emerald-500" : "text-rose-500"}>
                  1m {sector.performance1m >= 0 ? "+" : ""}
                  {sector.performance1m.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Leaders</p>
                <ul className="mt-2 space-y-1">
                  {sector.leaders.map((symbol) => (
                    <li key={symbol} className="font-semibold text-emerald-500">
                      {symbol}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Laggards</p>
                <ul className="mt-2 space-y-1">
                  {sector.laggards.map((symbol) => (
                    <li key={symbol} className="font-semibold text-rose-500">
                      {symbol}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sector.tags.map((tag) => (
                <Tag key={`${sector.name}-${tag}`}>{tag}</Tag>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SectorsPage;

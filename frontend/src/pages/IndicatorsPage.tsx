import { useEffect } from "react";
import { Link } from "react-router-dom";
import indicatorMeta from "../data/samples/indicators/index.json";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { getCollection } from "../lib/content";
import { usePageMeta } from "../contexts/PageMetaContext";
import { useI18n } from "../lib/i18n";
import { useDictionary } from "../hooks/useDictionary";

const indicators = getCollection("indicators");

const IndicatorsPage = () => {
  const { setMeta } = usePageMeta();
  const { t } = useI18n();
  const dictionary = useDictionary();
  const glossary = dictionary.data ?? indicatorMeta;

  useEffect(() => {
    setMeta({ lastUpdated: new Date().toISOString() });
  }, [setMeta]);

  return (
    <div>
      <PageHeader title={t("nav.indicators")} subtitle={t("dashboard.global")} tags={["RSI", "MACD", "BB", "ATR"]} />
      <div className="grid gap-4 md:grid-cols-2">
        {indicators.map((indicator) => (
          <Card key={indicator.slug}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{indicator.slug}</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{indicator.title}</h3>
                <p className="text-sm text-slate-500">{indicator.summary}</p>
              </div>
              <Tag>{indicator.reference ? "ref" : "note"}</Tag>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {indicator.tags.map((tag) => (
                <Tag key={`${indicator.slug}-${tag}`}>{tag}</Tag>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <Link to={`/indicators/${indicator.slug}`} className="font-semibold text-slate-900 hover:underline dark:text-white">
                {t("common.view_details")}
              </Link>
              {indicator.reference && (
                <a href={indicator.reference} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:underline">
                  Reference
                </a>
              )}
            </div>
          </Card>
        ))}
        {glossary.map((entry) => (
          <Card key={`glossary-${entry.term}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.term}</p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{entry.label}</h3>
            <p className="text-sm text-slate-500">{entry.description}</p>
            <p className="mt-2 text-xs text-slate-400">{entry.how_to_read}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IndicatorsPage;

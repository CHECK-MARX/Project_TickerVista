import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { getCollection } from "../lib/content";
import { usePageMeta } from "../contexts/PageMetaContext";
import { useEffect } from "react";

const strategies = getCollection("strategies");

const StrategiesPage = () => {
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({ lastUpdated: new Date().toISOString() });
  }, [setMeta]);

  return (
    <div>
      <PageHeader title="Strategies" subtitle="シナリオ/戦略カタログ" tags={["template", "education"]} />
      <div className="grid gap-4 md:grid-cols-2">
        {strategies.map((strategy) => (
          <Card key={strategy.slug}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{strategy.slug}</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{strategy.title}</h3>
            <p className="text-sm text-slate-500">{strategy.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {strategy.tags.map((tag) => (
                <Tag key={`${strategy.slug}-${tag}`}>{tag}</Tag>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <Link to={`/strategies/${strategy.slug}`} className="font-semibold text-slate-900 hover:underline dark:text-white">
                詳細を見る
              </Link>
              <span className="text-xs text-slate-500">教育目的のみ</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StrategiesPage;

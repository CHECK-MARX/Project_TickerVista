import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tag } from "../components/ui/Tag";
import { getCollection } from "../lib/content";
import { usePageMeta } from "../contexts/PageMetaContext";
import { useI18n } from "../lib/i18n";

const learnEntries = getCollection("learn");

const LearnPage = () => {
  const { setMeta } = usePageMeta();
  const { t } = useI18n();

  useEffect(() => {
    setMeta({ lastUpdated: new Date().toISOString() });
  }, [setMeta]);

  return (
    <div>
      <PageHeader title={t("nav.learn")} subtitle="Markdown knowledge base" tags={["guides", "cheatsheets"]} />
      <div className="grid gap-4 md:grid-cols-2">
        {learnEntries.map((entry) => (
          <Card key={entry.slug}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.slug}</p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{entry.title}</h3>
            <p className="text-sm text-slate-500">{entry.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Tag key={`${entry.slug}-${tag}`}>{tag}</Tag>
              ))}
            </div>
            <div className="mt-4 text-sm">
              <Link to={`/learn/${entry.slug}`} className="font-semibold text-slate-900 hover:underline dark:text-white">
                {t("common.view_details")}
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LearnPage;

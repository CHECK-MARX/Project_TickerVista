import { useEffect } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { usePageMeta } from "../contexts/PageMetaContext";

const AboutPage = () => {
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({ lastUpdated: new Date().toISOString() });
  }, [setMeta]);

  return (
    <div>
      <PageHeader title="About" subtitle="Disclaimer & data sources" tags={["meta"]} />
      <Card className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Disclaimer</h3>
          <p>This project is for learning only. Nothing herein constitutes investment advice. Use at your own risk.</p>
        </section>
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Data sources</h3>
          <ul className="list-disc pl-5">
            <li>Alpha Vantage (primary OHLCV)</li>
            <li>Stooq (fallback daily data)</li>
            <li>TimescaleDB / Redis (internal storage)</li>
          </ul>
        </section>
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Update cadence</h3>
          <p>Workers backfill every day at 06:00 UTC. The UI revalidates market snapshots every 30 seconds.</p>
        </section>
      </Card>
    </div>
  );
};

export default AboutPage;

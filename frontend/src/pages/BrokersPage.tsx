import { useEffect } from "react";
import brokersGuide from "../content/brokers/guide.json";
import { PageHeader } from "../components/ui/PageHeader";
import { Table } from "../components/ui/Table";
import { usePageMeta } from "../contexts/PageMetaContext";

const BrokersPage = () => {
  const { setMeta } = usePageMeta();

  useEffect(() => {
    setMeta({ lastUpdated: brokersGuide.lastUpdated });
  }, [setMeta]);

  const rows = brokersGuide.brokers.map((broker) => [
    broker.name,
    broker.markets.join(", "),
    broker.commission,
    broker.fxSpread,
    broker.platform,
    broker.notes
  ]);

  return (
    <div>
      <PageHeader title="Brokers" subtitle="Broker notes & fee memo" tags={["ops", "account"]} />
      <Table headers={["Broker", "Markets", "Commission", "FX", "Platform", "Notes"]} rows={rows} />
    </div>
  );
};

export default BrokersPage;

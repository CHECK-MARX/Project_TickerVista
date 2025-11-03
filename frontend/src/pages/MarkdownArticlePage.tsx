import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { MarkdownPage } from "../components/MarkdownPage";
import { getEntry } from "../lib/content";
import { Card } from "../components/ui/Card";
import { usePageMeta } from "../contexts/PageMetaContext";

const MarkdownArticlePage = ({ collection }: { collection: string }) => {
  const { slug } = useParams();
  const entry = slug ? getEntry(collection, slug) : undefined;
  const { setMeta } = usePageMeta();

  useEffect(() => {
    if (entry) {
      setMeta({ lastUpdated: new Date().toISOString() });
    }
  }, [entry, setMeta]);

  if (!entry) {
    return <Card>Article not found.</Card>;
  }

  return (
    <div>
      <MarkdownPage entry={entry} />
    </div>
  );
};

export default MarkdownArticlePage;

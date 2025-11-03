import { HTMLAttributes } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownEntry } from "../lib/content";
import { Card } from "./ui/Card";

type MarkdownPageProps = {
  entry: MarkdownEntry;
};

const buildToc = (content: string) => {
  const lines = content.split("\n");
  return lines
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = line.replace("## ", "").trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return { title, slug };
    });
};

const components: Components = {
  h2({ node, ...props }) {
    const id = String(props.children).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return <h2 id={id} {...props} />;
  },
  code({ inline, className, children, ...props }: any) {
    if (inline) {
      return (
        <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800" {...props}>
          {children}
        </code>
      );
    }
    const preProps = props as HTMLAttributes<HTMLPreElement>;
    return (
      <pre className="overflow-auto rounded-2xl bg-slate-900 p-4 text-slate-100" {...preProps}>
        <code>{children}</code>
      </pre>
    );
  }
};

export const MarkdownPage = ({ entry }: MarkdownPageProps) => {
  const toc = buildToc(entry.content);

  return (
    <div className="prose max-w-none dark:prose-invert">
      {toc.length > 0 && (
        <Card className="mb-6 bg-white/90 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Contents</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">
            {toc.map((item) => (
              <li key={item.slug}>
                <a href={`#${item.slug}`} className="text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white">
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {entry.content}
      </ReactMarkdown>
    </div>
  );
};

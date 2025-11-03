import { ReactNode } from "react";
import { Tag } from "./Tag";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  tags?: string[];
  actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, tags = [], actions }: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{subtitle}</p>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      )}
    </div>
    {actions}
  </div>
);

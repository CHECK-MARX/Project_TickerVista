import { ReactNode } from "react";
import { clsx } from "clsx";

export const Tag = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full border border-slate-200 bg-white/60 px-3 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
      className
    )}
  >
    {children}
  </span>
);

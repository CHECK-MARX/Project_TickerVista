import { ReactNode } from "react";
import { clsx } from "clsx";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export const Card = ({ children, className }: CardProps) => (
  <div className={clsx("rounded-2xl border border-slate-100 bg-white/80 p-6 shadow-card dark:border-slate-800 dark:bg-slate-900", className)}>
    {children}
  </div>
);

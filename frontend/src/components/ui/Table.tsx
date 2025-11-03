import { ReactNode } from "react";
import { clsx } from "clsx";

type TableProps = {
  headers: string[];
  rows: ReactNode[][];
  className?: string;
};

export const Table = ({ headers, rows, className }: TableProps) => (
  <div className={clsx("overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800", className)}>
    <table className="min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
      <thead className="bg-slate-50 dark:bg-slate-900/60">
        <tr>
          {headers.map((header) => (
            <th key={header} className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row, idx) => (
          <tr key={idx} className="bg-white/80 dark:bg-slate-900">
            {row.map((cell, cellIdx) => (
              <td key={cellIdx} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

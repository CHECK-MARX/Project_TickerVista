type StatProps = {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
};

export const Stat = ({ label, value, subValue, trend }: StatProps) => {
  const trendColor = trend == null ? "text-slate-500" : trend >= 0 ? "text-emerald-500" : "text-rose-500";
  const trendPrefix = trend == null ? "" : trend >= 0 ? "+" : "";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      {subValue && <p className="text-sm text-slate-500">{subValue}</p>}
      {trend != null && <p className={`text-xs font-semibold ${trendColor}`}>{trendPrefix + trend.toFixed(2)}%</p>}
    </div>
  );
};

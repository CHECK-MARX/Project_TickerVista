import type { InsightSummaryResponse } from "../api/types";
import { TrafficLightBadge } from "./TrafficLightBadge";

interface Props {
  insight: InsightSummaryResponse;
}

const resolveBadge = (value: string): "GREEN" | "YELLOW" | "RED" => {
  if (value === "GREEN" || value === "YELLOW" || value === "RED") {
    return value;
  }
  return "YELLOW";
};

export const DashboardSummary = ({ insight }: Props) => {
  const badge = resolveBadge(insight.trafficLight);

  return (
    <section className="rounded-2xl bg-white/80 p-6 shadow-card dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Current regime</p>
          <h2 className="text-2xl font-semibold">{insight.state}</h2>
        </div>
        <TrafficLightBadge status={badge} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-500">Highlights</p>
          <ul className="mt-2 space-y-2">
            {insight.highlights.map((item) => (
              <li key={item} className="rounded-xl bg-slate-100 px-4 py-2 text-sm dark:bg-slate-800">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Watchouts</p>
          <ul className="mt-2 space-y-2">
            {insight.watchouts.map((item) => (
              <li
                key={item}
                className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-500">{insight.disclaimer}</p>
    </section>
  );
};

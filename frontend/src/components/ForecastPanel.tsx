import type { ForecastResponseDto } from "../api/types";

interface Props {
  forecast: ForecastResponseDto;
}

export const ForecastPanel = ({ forecast }: Props) => (
  <section className="rounded-2xl bg-white/80 p-6 shadow-card dark:bg-slate-900">
    <header className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{forecast.symbol}</p>
        <h3 className="text-2xl font-semibold">{forecast.model}</h3>
        <p className="text-xs text-slate-400">{forecast.methodology}</p>
      </div>
    </header>
    <div className="grid gap-4 md:grid-cols-2">
      {forecast.bands.slice(0, 6).map((band) => (
        <div key={band.step} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Day {band.step}</p>
          <p className="text-lg font-semibold">{new Date(band.ts).toLocaleDateString()}</p>
          <p className="text-sm text-slate-500">Mid {band.mid.toFixed(2)}</p>
          <p className="text-xs text-slate-400">
            {band.lower.toFixed(2)} - {band.upper.toFixed(2)} (95% interval)
          </p>
        </div>
      ))}
    </div>
  </section>
);

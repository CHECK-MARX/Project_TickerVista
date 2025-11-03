import type { ForecastResponseDto, OhlcvSeriesResponse } from "../api/types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TooltipProps } from "recharts";

type Props = {
  series: OhlcvSeriesResponse;
  forecast: ForecastResponseDto;
};

const formatLabel = (value: string) => {
  const date = new Date(value);
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
};

export const ChartPanel = ({ series, forecast }: Props) => {
  const historicPoints = series.candles.map((candle) => ({
    ts: candle.ts,
    close: candle.close,
    volume: candle.volume,
    forecastMid: undefined,
    forecastLower: undefined,
    forecastRange: undefined
  }));

  const forecastPoints = forecast.bands.map((band) => ({
    ts: band.ts,
    close: undefined,
    volume: undefined,
    forecastMid: band.mid,
    forecastLower: band.lower,
    forecastRange: band.upper - band.lower
  }));

  const priceData = [...historicPoints, ...forecastPoints];

  const priceTooltipFormatter: TooltipProps<number, string>["formatter"] = (value, name) => [
    Number.isFinite(value) ? value.toFixed(2) : "-",
    name ?? ""
  ];

  const volumeTooltipFormatter: TooltipProps<number, string>["formatter"] = (value) => [
    Number.isFinite(value) ? value.toLocaleString() : "-",
    "Volume"
  ];

  return (
    <section className="rounded-2xl bg-white/80 p-6 shadow-card dark:bg-slate-900">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{series.symbol}</p>
          <h3 className="text-2xl font-semibold">Price & Volume</h3>
        </div>
      </header>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ top: 10, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="price" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="text-slate-200" />
            <XAxis dataKey="ts" tickFormatter={formatLabel} minTickGap={32} />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip<number, string>
              labelFormatter={(value) => formatLabel(String(value))}
              formatter={priceTooltipFormatter}
            />
            <Area type="monotone" dataKey="close" stroke="#0f172a" fillOpacity={1} fill="url(#price)" connectNulls />
            <Area type="monotone" dataKey="forecastLower" stackId="band" stroke="transparent" fill="transparent" connectNulls />
            <Area type="monotone" dataKey="forecastRange" stackId="band" stroke="none" fill="rgba(59,130,246,0.25)" connectNulls />
            <Line
              type="monotone"
              dataKey="forecastMid"
              stroke="#3b82f6"
              strokeDasharray="4 4"
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={historicPoints.filter((point) => point.volume !== null)}>
            <XAxis dataKey="ts" hide />
            <YAxis hide />
            <Tooltip<number, string> formatter={volumeTooltipFormatter} />
            <Bar dataKey="volume" fill="#0f172a" opacity={0.3} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

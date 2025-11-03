import type { IndicatorsResponseDto } from "../api/types";

interface Props {
  indicators: IndicatorsResponseDto;
}

const formatNumber = (value: number, digits = 2) => value.toFixed(digits);

export const IndicatorPanel = ({ indicators }: Props) => {
  const smaSpread = indicators.sma.sma20 - indicators.sma.sma50;
  const bollingerWidth = indicators.bollinger.upper - indicators.bollinger.lower;
  const widthPct =
    indicators.bollinger.middle !== 0
      ? (bollingerWidth / indicators.bollinger.middle) * 100
      : 0;
  const macdMomentum = indicators.macd.histogram;

  const cards = [
    {
      label: "RSI (14)",
      value: formatNumber(indicators.rsi14, 1),
      note:
        indicators.rsi14 > 70
          ? "Overbought pressure"
          : indicators.rsi14 < 30
            ? "Oversold bounce risk"
            : "Neutral range"
    },
    {
      label: "SMA 20 vs 50",
      value: `${formatNumber(indicators.sma.sma20)} / ${formatNumber(indicators.sma.sma50)}`,
      note:
        smaSpread > 0.5
          ? "Fast MA above slow (bullish bias)"
          : smaSpread < -0.5
            ? "Fast MA below slow (bearish bias)"
            : "MAs converging (sideways)"
    },
    {
      label: "Bollinger (20,2)",
      value: `${formatNumber(indicators.bollinger.lower)} - ${formatNumber(indicators.bollinger.upper)}`,
      note:
        widthPct > 15
          ? "Wide bands -> elevated volatility"
          : "Tight bands -> compressed volatility"
    },
    {
      label: "MACD (12,26,9)",
      value: `${formatNumber(indicators.macd.macd)} / ${formatNumber(indicators.macd.signal)}`,
      note:
        macdMomentum > 0
          ? "Histogram positive (momentum building)"
          : macdMomentum < 0
            ? "Histogram negative (momentum cooling)"
            : "Momentum flat"
    }
  ];

  return (
    <section className="rounded-2xl bg-white/80 p-6 shadow-card dark:bg-slate-900">
      <header className="mb-4">
        <h3 className="text-2xl font-semibold">Indicators</h3>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-800"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-slate-500">{card.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

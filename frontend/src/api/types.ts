export interface SymbolDto {
  id: number;
  symbol: string;
  exchange: string;
  currency: string;
  tz: string;
  name: string;
  sector: string;
  updatedAt: string;
}

export interface OhlcvPointDto {
  symbol: string;
  timeframe: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface OhlcvSeriesResponse {
  symbol: string;
  timeframe: string;
  tz: string;
  candles: OhlcvPointDto[];
}

export interface IndicatorsResponseDto {
  symbol: string;
  timeframe: string;
  rsi14: number;
  sma: {
    sma20: number;
    sma50: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
}

export interface InsightSummaryResponse {
  symbol: string;
  trafficLight: string;
  state: string;
  highlights: string[];
  watchouts: string[];
  checklist: string[];
  disclaimer: string;
}

export interface ForecastBand {
  step: number;
  ts: string;
  mid: number;
  lower: number;
  upper: number;
}

export interface ForecastResponseDto {
  symbol: string;
  model: string;
  horizonDays: number;
  bands: ForecastBand[];
  methodology: string;
}

export interface TooltipEntry {
  term: string;
  label: string;
  description: string;
  how_to_read: string;
  category: string;
}

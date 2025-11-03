from __future__ import annotations

import csv
import json
import math
import os
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import requests
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
SAMPLES_DIR = ROOT / "frontend" / "src" / "data" / "samples"
ALPHA_KEY = os.getenv("ALPHA_VANTAGE_KEY")
TODAY = datetime.now(timezone.utc)
_NULLISH_STRINGS = {"none", "null", "na", "n/a", "nan"}


def safe_float(value: Any, default: float = 0.0) -> float:
    """
    Convert loosely formatted numeric strings into floats.
    Falls back to default when the value is empty, textual nulls, or unparsable.
    """
    if value is None:
        return default
    if isinstance(value, (int, float)):
        try:
            return float(value)
        except (TypeError, ValueError):
            return default
    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return default
        lowered = cleaned.lower()
        if lowered in _NULLISH_STRINGS:
            return default
        if cleaned.endswith("%"):
            cleaned = cleaned[:-1]
        cleaned = cleaned.replace(",", "")
        try:
            return float(cleaned)
        except ValueError:
            return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


@dataclass
class SymbolMeta:
    symbol: str
    stooq: str
    name: str
    exchange: str
    currency: str
    tz: str
    sector: str
    country: str
    dividend_yield: float = 0.0


BASE_UNIVERSE: List[SymbolMeta] = [
    SymbolMeta("AAPL", "aapl.us", "Apple Inc.", "NASDAQ", "USD", "America/New_York", "Technology", "US", 0.0054),
    SymbolMeta("MSFT", "msft.us", "Microsoft Corp.", "NASDAQ", "USD", "America/New_York", "Technology", "US", 0.0083),
    SymbolMeta("NVDA", "nvda.us", "NVIDIA Corp.", "NASDAQ", "USD", "America/Los_Angeles", "Technology", "US", 0.0003),
    SymbolMeta("AMZN", "amzn.us", "Amazon.com Inc.", "NASDAQ", "USD", "America/Los_Angeles", "Consumer Discretionary", "US", 0.0),
    SymbolMeta("GOOGL", "googl.us", "Alphabet Inc. Class A", "NASDAQ", "USD", "America/Los_Angeles", "Communication Services", "US", 0.0),
    SymbolMeta("TSLA", "tsla.us", "Tesla Inc.", "NASDAQ", "USD", "America/Los_Angeles", "Consumer Discretionary", "US", 0.0),
    SymbolMeta("JPM", "jpm.us", "JPMorgan Chase & Co.", "NYSE", "USD", "America/New_York", "Financials", "US", 0.027),
    SymbolMeta("XOM", "xom.us", "Exxon Mobil Corp.", "NYSE", "USD", "America/Chicago", "Energy", "US", 0.033),
    SymbolMeta("KO", "ko.us", "Coca-Cola Co.", "NYSE", "USD", "America/New_York", "Consumer Staples", "US", 0.030),
    SymbolMeta("PFE", "pfe.us", "Pfizer Inc.", "NYSE", "USD", "America/New_York", "Health Care", "US", 0.059),
    SymbolMeta("7203.T", "7203.jp", "Toyota Motor Corp.", "TSE", "JPY", "Asia/Tokyo", "Automobiles", "JP", 0.024),
    SymbolMeta("6758.T", "6758.jp", "Sony Group Corp.", "TSE", "JPY", "Asia/Tokyo", "Technology", "JP", 0.009),
    SymbolMeta("9984.T", "9984.jp", "SoftBank Group Corp.", "TSE", "JPY", "Asia/Tokyo", "Communication Services", "JP", 0.005),
    SymbolMeta("8306.T", "8306.jp", "Mitsubishi UFJ Financial Group", "TSE", "JPY", "Asia/Tokyo", "Financials", "JP", 0.034),
    SymbolMeta("8035.T", "8035.jp", "Tokyo Electron Ltd.", "TSE", "JPY", "Asia/Tokyo", "Technology", "JP", 0.013),
    SymbolMeta("6861.T", "6861.jp", "Keyence Corp.", "TSE", "JPY", "Asia/Tokyo", "Technology", "JP", 0.008),
    SymbolMeta("9433.T", "9433.jp", "KDDI Corp.", "TSE", "JPY", "Asia/Tokyo", "Communication Services", "JP", 0.032),
    SymbolMeta("8058.T", "8058.jp", "Mitsubishi Corp.", "TSE", "JPY", "Asia/Tokyo", "Industrials", "JP", 0.027),
    SymbolMeta("4063.T", "4063.jp", "Shin-Etsu Chemical", "TSE", "JPY", "Asia/Tokyo", "Materials", "JP", 0.025),
    SymbolMeta("4502.T", "4502.jp", "Takeda Pharmaceutical", "TSE", "JPY", "Asia/Tokyo", "Health Care", "JP", 0.041),
]


def load_sp500_universe(existing_symbols: set[str], limit: int = 200) -> List[SymbolMeta]:
    url = "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/master/data/constituents.csv"
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"[warn] failed to load S&P 500 universe: {exc}")
        return []

    reader = csv.DictReader(response.text.splitlines())
    metas: List[SymbolMeta] = []
    for row in reader:
        symbol = row.get("Symbol", "").strip().upper()
        name = row.get("Name", "").strip()
        sector = row.get("Sector", "").strip() or "Unknown"
        if not symbol or symbol in existing_symbols:
            continue
        stooq_symbol = f"{symbol.lower().replace('.', '-').replace(' ', '-')}.us"
        meta = SymbolMeta(
            symbol=symbol,
            stooq=stooq_symbol,
            name=name or symbol,
            exchange="NYSE/NASDAQ",
            currency="USD",
            tz="America/New_York",
            sector=sector,
            country="US",
            dividend_yield=0.02,
        )
        metas.append(meta)
        existing_symbols.add(symbol)
        if len(metas) >= limit:
            break
    return metas


UNIVERSE: List[SymbolMeta] = BASE_UNIVERSE + load_sp500_universe({meta.symbol for meta in BASE_UNIVERSE}, limit=200)
print(f"[info] symbol universe size: {len(UNIVERSE)}")

INDEX_CONFIG = [
    ("SPX", "^spx", "S&P 500"),
    ("NDX", "^ndq", "NASDAQ 100"),
    ("N225", "^nikkei", "Nikkei 225"),
    ("TOPX", "^topix", "TOPIX"),
]

FX_CONFIG = [
    ("USDJPY", "usdjpy"),
    ("EURUSD", "eurusd"),
    ("GBPUSD", "gbpusd"),
]


def fetch_csv(symbol: str) -> str:
    url = f"https://stooq.com/q/d/l/?s={symbol}&i=d"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.text


def parse_csv(csv_text: str, meta: SymbolMeta | None) -> List[Dict[str, Any]]:
    if "Exceeded the daily hits limit" in csv_text:
        raise RuntimeError("stooq_limit")
    rows: List[Dict[str, Any]] = []
    reader = csv.DictReader(csv_text.splitlines())
    for record in reader:
        try:
            rows.append(
                {
                    "symbol": meta.symbol if meta else record.get("Symbol", ""),
                    "timeframe": "1d",
                    "ts": datetime.strptime(record["Date"], "%Y-%m-%d")
                    .replace(tzinfo=timezone.utc)
                    .isoformat(),
                    "open": float(record["Open"]),
                    "high": float(record["High"]),
                    "low": float(record["Low"]),
                    "close": float(record["Close"]),
                    "volume": float(record.get("Volume", 0) or 0),
                    "adjClose": float(record["Close"]),
                }
            )
        except (ValueError, KeyError):
            continue
    return rows


def percent_change(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0
    return (current - previous) / previous * 100.0


def take_last(items: List[float], window: int) -> List[float]:
    return items if len(items) <= window else items[-window:]


def mean(values: Iterable[float]) -> float:
    values = list(values)
    if not values:
        return 0.0
    return sum(values) / len(values)


def stddev(values: Iterable[float]) -> float:
    values = list(values)
    if not values:
        return 0.0
    avg = mean(values)
    variance = sum((value - avg) ** 2 for value in values) / len(values)
    return math.sqrt(variance)


def ema_series(values: List[float], period: int) -> List[float]:
    if not values:
        return []
    k = 2 / (period + 1)
    ema_values = [values[0]]
    for value in values[1:]:
        ema_values.append(value * k + ema_values[-1] * (1 - k))
    return ema_values


def compute_indicators(candles: List[Dict[str, Any]]) -> Dict[str, Any]:
    closes = [candle["close"] for candle in candles]
    sma20 = mean(take_last(closes, 20))
    sma50 = mean(take_last(closes, 50))
    bb_window = take_last(closes, 20)
    bb_middle = mean(bb_window)
    bb_std = stddev(bb_window)
    upper = bb_middle + bb_std * 2
    lower = bb_middle - bb_std * 2

    rsi_period = 14
    gains = []
    losses = []
    for idx in range(1, len(closes)):
        delta = closes[idx] - closes[idx - 1]
        gains.append(max(delta, 0))
        losses.append(max(-delta, 0))
    avg_gain = mean(take_last(gains, rsi_period))
    avg_loss = mean(take_last(losses, rsi_period))
    if avg_loss == 0:
        rsi14 = 100.0
    else:
        rs = avg_gain / avg_loss
        rsi14 = 100 - (100 / (1 + rs))

    ema12 = ema_series(closes, 12)
    ema26 = ema_series(closes, 26)
    macd_series = [ema12[i] - ema26[i] for i in range(min(len(ema12), len(ema26)))]
    signal_series = ema_series(macd_series, 9)
    macd_value = macd_series[-1] if macd_series else 0.0
    signal_value = signal_series[-1] if signal_series else 0.0
    histogram = macd_value - signal_value

    return {
        "rsi14": rsi14,
        "sma": {"sma20": sma20, "sma50": sma50},
        "bollinger": {"upper": upper, "middle": bb_middle, "lower": lower},
        "macd": {"macd": macd_value, "signal": signal_value, "histogram": histogram},
        "lastClose": closes[-1] if closes else 0.0,
    }


def compute_forecast(symbol: str, candles: List[Dict[str, Any]]) -> Dict[str, Any]:
    closes = [candle["close"] for candle in candles]
    if not closes:
        return {
            "symbol": symbol,
            "model": "Drift + Volatility Cone",
            "horizonDays": 30,
            "methodology": "Insufficient data",
            "bands": [],
        }

    horizon = 30
    returns = []
    for idx in range(1, len(closes)):
        prev = closes[idx - 1]
        if prev == 0:
            continue
        returns.append((closes[idx] - prev) / prev)
    recent_returns = take_last(returns, 60)
    mean_return = mean(recent_returns)
    volatility = stddev(recent_returns) or 0.02
    last_close = closes[-1]

    bands = []
    for step in range(1, horizon + 1):
        projected = last_close * ((1 + mean_return) ** step)
        spread = projected * volatility * math.sqrt(step)
        bands.append(
            {
                "step": step,
                "ts": (TODAY + timedelta(days=step)).isoformat(),
                "mid": projected,
                "lower": projected - spread,
                "upper": projected + spread,
            }
        )
    return {
        "symbol": symbol,
        "model": "Drift + Volatility Cone",
        "horizonDays": horizon,
        "methodology": "Simple drift using recent daily returns with volatility-based confidence bands.",
        "bands": bands,
    }


def generate_synthetic_candles(meta: SymbolMeta, days: int = 730) -> List[Dict[str, Any]]:
    rng = random.Random(meta.symbol)
    base_price = rng.uniform(20, 250)
    price = base_price
    candles: List[Dict[str, Any]] = []
    for idx in range(days):
        current_date = TODAY - timedelta(days=days - idx)
        change = rng.uniform(-0.035, 0.035)
        open_price = price
        close_price = max(1.0, price * (1 + change))
        high_price = max(open_price, close_price) * (1 + rng.uniform(0, 0.01))
        low_price = min(open_price, close_price) * (1 - rng.uniform(0, 0.01))
        volume = rng.randint(500_000, 15_000_000)
        candles.append(
            {
                "symbol": meta.symbol,
                "timeframe": "1d",
                "ts": current_date.isoformat(),
                "open": round(open_price, 2),
                "high": round(high_price, 2),
                "low": round(low_price, 2),
                "close": round(close_price, 2),
                "volume": volume,
                "adjClose": round(close_price, 2),
            }
        )
        price = close_price
    return candles


def load_yfinance_candles(meta: SymbolMeta, period: str = "5y") -> Optional[List[Dict[str, Any]]]:
    try:
        df = yf.download(meta.symbol, period=period, interval="1d", progress=False, threads=False)
    except Exception as exc:
        print(f"[warn] yfinance error for {meta.symbol}: {exc}")
        return None
    if df.empty:
        return None
    candles: List[Dict[str, Any]] = []
    for ts, row in df.iterrows():
        if any(value != value for value in (row.get("Open"), row.get("High"), row.get("Low"), row.get("Close"))):
            continue
        candles.append(
            {
                "symbol": meta.symbol,
                "timeframe": "1d",
                "ts": ts.to_pydatetime().replace(tzinfo=timezone.utc).isoformat(),
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": float(row.get("Volume", 0) or 0),
                "adjClose": float(row.get("Adj Close", row["Close"]))
            }
        )
    return candles


def traffic_light_score(indicators: Dict[str, Any]) -> str:
    sma20 = indicators["sma"]["sma20"]
    sma50 = indicators["sma"]["sma50"]
    trend_component = math.tanh((sma20 - sma50) / (sma50 or 1))
    rsi = indicators["rsi14"]
    rsi_component = 1 - min(abs(50 - rsi) / 50, 1)
    upper = indicators["bollinger"]["upper"]
    lower = indicators["bollinger"]["lower"]
    middle = indicators["bollinger"]["middle"] or 1
    width_component = 1 - min((upper - lower) / middle, 1)
    score = 0.4 * trend_component + 0.4 * rsi_component + 0.2 * width_component
    if score >= 0.2:
        return "GREEN"
    if score <= -0.2:
        return "RED"
    return "YELLOW"


def build_insight(meta: SymbolMeta, indicators: Dict[str, Any], latest_change: float) -> Dict[str, Any]:
    traffic_light = traffic_light_score(indicators)
    state = {
        "GREEN": "Bullish momentum",
        "YELLOW": "Neutral / rangebound",
        "RED": "Caution zone",
    }[traffic_light]
    highlights = []
    watchouts = []
    if latest_change > 0.5:
        highlights.append("Price gained over 0.5% on the latest session.")
    if indicators["sma"]["sma20"] > indicators["sma"]["sma50"]:
        highlights.append("20-day SMA is above the 50-day trend.")
    if indicators["macd"]["histogram"] > 0:
        highlights.append("MACD histogram is positive.")

    if latest_change < -0.5:
        watchouts.append("Recent session closed more than 0.5% lower.")
    if indicators["rsi14"] > 70:
        watchouts.append("RSI is above 70 (overbought territory).")
    if indicators["rsi14"] < 30:
        watchouts.append("RSI is below 30 (oversold territory).")

    if not highlights:
        highlights.append("Momentum indicators are mixed; await confirmation.")
    if not watchouts:
        watchouts.append("Monitor macro headlines and earnings updates.")

    return {
        "symbol": meta.symbol,
        "trafficLight": traffic_light,
        "state": state,
        "highlights": highlights,
        "watchouts": watchouts,
        "checklist": [
            "Review latest earnings release.",
            "Check sector peers for confirmation.",
            "Ensure position sizing fits risk plan.",
        ],
        "disclaimer": "Auto-generated summary based on end-of-day data. Educational use only.",
    }


def available_ranges(candles: List[Dict[str, Any]]) -> List[str]:
    days = len(candles)
    ranges: List[str] = []
    if days >= 22:
        ranges.append("1M")
    if days >= 66:
        ranges.append("3M")
    if days >= 132:
        ranges.append("6M")
    if days >= 264:
        ranges.append("1Y")
    if days >= 528:
        ranges.append("2Y")
    return ranges


def fetch_alpha_overview(symbol: str) -> Optional[Dict[str, float]]:
    if not ALPHA_KEY:
        return None
    url = "https://www.alphavantage.co/query"
    params = {"function": "OVERVIEW", "symbol": symbol, "apikey": ALPHA_KEY}
    response = requests.get(url, params=params, timeout=30)
    if response.status_code != 200:
        return None
    data = response.json()
    if "Symbol" not in data:
        return None
    dividend_yield_value = data.get("DividendYield")
    if not dividend_yield_value:
        dividend_yield_value = data.get("ForwardAnnualDividendYield")
    return {
        "dividendYield": safe_float(dividend_yield_value, 0.0),
        "dividendPerShare": safe_float(data.get("DividendPerShare"), 0.0),
    }


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def build_market_overview(symbol_snapshots: List[Dict[str, Any]], index_snapshots: List[Dict[str, Any]], fx_snapshots: List[Dict[str, Any]]) -> Dict[str, Any]:
    heatmap = [
        {
            "symbol": snapshot["meta"].symbol,
            "sector": snapshot["meta"].sector,
            "changePct": snapshot["changePct"],
            "weight": max(1.0, math.log((snapshot["latest"].get("volume") or 0) + 1, 10) ** 2),
            "lastClose": snapshot["latest"]["close"],
        }
        for snapshot in symbol_snapshots
    ]
    return {
        "lastUpdated": TODAY.isoformat(),
        "indices": [
            {
                "symbol": index["symbol"],
                "name": index["name"],
                "level": index["lastClose"],
                "changePct": index["changePct"],
            }
            for index in index_snapshots
        ],
        "fx": [
            {
                "pair": fx["pair"],
                "rate": fx["lastClose"],
                "changePct": fx["changePct"],
            }
            for fx in fx_snapshots
        ],
        "heatmap": heatmap[:50],
    }


def build_sector_overview(symbol_snapshots: List[Dict[str, Any]]) -> Dict[str, Any]:
    sectors: Dict[str, List[Dict[str, Any]]] = {}
    for snapshot in symbol_snapshots:
        sectors.setdefault(snapshot["meta"].sector, []).append(snapshot)
    data = []
    for sector, snapshots in sectors.items():
        sorted_snaps = sorted(snapshots, key=lambda s: s["changePct"], reverse=True)
        data.append(
            {
                "name": sector,
                "theme": sector,
                "performance1d": mean(snapshot["changePct"] for snapshot in snapshots),
                "performance1m": mean(snapshot["change1m"] for snapshot in snapshots),
                "leaders": [snap["meta"].symbol for snap in sorted_snaps[:3]],
                "laggards": [snap["meta"].symbol for snap in sorted_snaps[-3:]],
                "tags": [snapshots[0]["meta"].country],
            }
        )
    return {"lastUpdated": TODAY.isoformat(), "data": data}


def build_rankings(symbol_snapshots: List[Dict[str, Any]]) -> Dict[str, Any]:
    gainers = sorted(symbol_snapshots, key=lambda s: s["changePct"], reverse=True)
    dividends = sorted(symbol_snapshots, key=lambda s: s.get("dividendYield", 0), reverse=True)

    gainers_payload = [
        {
            "rank": idx + 1,
            "symbol": snapshot["meta"].symbol,
            "name": snapshot["meta"].name,
            "exchange": snapshot["meta"].exchange,
            "changePct": snapshot["changePct"],
            "lastPrice": snapshot["indicators"]["lastClose"],
        }
        for idx, snapshot in enumerate(gainers[:20])
    ]

    dividends_payload = [
        {
            "rank": idx + 1,
            "symbol": snapshot["meta"].symbol,
            "name": snapshot["meta"].name,
            "exchange": snapshot["meta"].exchange,
            "dividendYield": snapshot.get("dividendYield", 0),
            "lastPrice": snapshot["indicators"]["lastClose"],
        }
        for idx, snapshot in enumerate(dividends[:100])
    ]
    return {
        "lastUpdated": TODAY.isoformat(),
        "gainers": gainers_payload,
        "dividends": dividends_payload,
    }


def build_symbols_index(symbol_snapshots: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    items = []
    for idx, snapshot in enumerate(symbol_snapshots, start=1):
        meta: SymbolMeta = snapshot["meta"]
        items.append(
            {
                "id": idx,
                "symbol": meta.symbol,
                "exchange": meta.exchange,
                "currency": meta.currency,
                "tz": meta.tz,
                "name": meta.name,
                "sector": meta.sector,
                "updatedAt": snapshot["latest"]["ts"],
                "country": meta.country,
            }
        )
    return items


def process_symbol(meta: SymbolMeta) -> Optional[Dict[str, Any]]:
    candles: Optional[List[Dict[str, Any]]] = None
    suppress_error = False
    try:
        csv_text = fetch_csv(meta.stooq)
        candles = parse_csv(csv_text, meta)
    except RuntimeError as exc:
        if str(exc) == "stooq_limit":
            print(f"[warn] stooq limit reached for {meta.symbol}, trying yfinance")
            suppress_error = True
        else:
            print(f"[warn] stooq error for {meta.symbol}: {exc}")
            suppress_error = True
    except requests.HTTPError as exc:
        print(f"[warn] failed to fetch {meta.stooq}: {exc}; trying yfinance")
        suppress_error = True
    except Exception as exc:
        print(f"[warn] unexpected stooq error for {meta.symbol}: {exc}; trying yfinance")
        suppress_error = True

    if (not candles or len(candles) < 30) and suppress_error:
        yf_candles = load_yfinance_candles(meta)
        if yf_candles:
            candles = yf_candles

    if not candles:
        print(f"[warn] falling back to synthetic data for {meta.symbol}")
        candles = generate_synthetic_candles(meta)

    candles = candles[-730:]
    indicators = compute_indicators(candles)
    forecast = compute_forecast(meta.symbol, candles)
    alpha = fetch_alpha_overview(meta.symbol)
    dividend_yield = alpha["dividendYield"] if alpha else meta.dividend_yield
    latest = candles[-1]
    previous = candles[-2] if len(candles) > 1 else latest
    change_pct = percent_change(latest["close"], previous["close"])
    one_month_idx = max(len(candles) - 21, 0)
    change_1m = percent_change(latest["close"], candles[one_month_idx]["close"])
    insight = build_insight(meta, indicators, change_pct)

    symbol_dir = DATA_DIR / "symbols" / meta.symbol
    write_json(symbol_dir / "ohlcv.json", {"symbol": meta.symbol, "timeframe": "1d", "tz": meta.tz, "candles": candles})
    write_json(symbol_dir / "indicators.json", {"symbol": meta.symbol, "timeframe": "1d", **{k: v for k, v in indicators.items() if k != "lastClose"}})
    write_json(symbol_dir / "forecast.json", forecast)
    write_json(symbol_dir / "insights.json", insight)
    write_json(
        symbol_dir / "meta.json",
        {
            "symbol": meta.symbol,
            "name": meta.name,
            "exchange": meta.exchange,
            "currency": meta.currency,
            "tz": meta.tz,
            "sector": meta.sector,
            "country": meta.country,
        },
    )
    write_json(symbol_dir / "availableRanges.json", available_ranges(candles))

    sample_symbol_path = SAMPLES_DIR / "symbols" / f"{meta.symbol}.json"
    sample_payload = {
        "symbol": meta.symbol,
        "metadata": {
            "name": meta.name,
            "exchange": meta.exchange,
            "tz": meta.tz,
            "currency": meta.currency,
            "sector": meta.sector,
            "country": meta.country,
        },
        "ohlcv": {"symbol": meta.symbol, "timeframe": "1d", "tz": meta.tz, "candles": candles},
        "indicators": {
            "symbol": meta.symbol,
            "timeframe": "1d",
            "rsi14": indicators["rsi14"],
            "sma": indicators["sma"],
            "bollinger": indicators["bollinger"],
            "macd": indicators["macd"],
        },
        "forecast": forecast,
        "insights": insight,
        "availableRanges": available_ranges(candles),
    }
    write_json(sample_symbol_path, sample_payload)

    return {
        "meta": meta,
        "indicators": indicators,
        "forecast": forecast,
        "insight": insight,
        "dividendYield": dividend_yield,
        "changePct": change_pct,
        "change1m": change_1m,
        "latest": latest,
    }


def fetch_index_snapshot(symbol: str, stooq: str, name: str) -> Optional[Dict[str, Any]]:
    try:
        csv_text = fetch_csv(stooq)
    except requests.HTTPError:
        return None
    candles = parse_csv(csv_text, None)[-120:]
    if not candles:
        return None
    latest = candles[-1]
    previous = candles[-2] if len(candles) > 1 else latest
    return {
        "symbol": symbol,
        "name": name,
        "lastClose": latest["close"],
        "changePct": percent_change(latest["close"], previous["close"]),
    }


def fetch_fx_snapshot(pair: str, stooq: str) -> Optional[Dict[str, Any]]:
    try:
        csv_text = fetch_csv(stooq)
    except requests.HTTPError:
        return None
    candles = parse_csv(csv_text, None)[-60:]
    if not candles:
        return None
    latest = candles[-1]
    previous = candles[-2] if len(candles) > 1 else latest
    return {
        "pair": pair,
        "lastClose": latest["close"],
        "changePct": percent_change(latest["close"], previous["close"]),
    }


def load_dictionary() -> Any:
    dictionary_path = ROOT / "frontend" / "src" / "data" / "samples" / "indicators" / "index.json"
    if dictionary_path.exists():
        return json.loads(dictionary_path.read_text(encoding="utf-8"))
    return []


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    symbol_snapshots: List[Dict[str, Any]] = []

    for meta in UNIVERSE:
        snapshot = process_symbol(meta)
        if snapshot:
            symbol_snapshots.append(snapshot)

    if not symbol_snapshots:
        raise SystemExit("No symbol data could be generated.")

    index_snapshots = [
        snap for snap in (fetch_index_snapshot(sym, stooq, name) for sym, stooq, name in INDEX_CONFIG) if snap
    ]
    fx_snapshots = [
        snap for snap in (fetch_fx_snapshot(pair, stooq) for pair, stooq in FX_CONFIG) if snap
    ]
    rankings = build_rankings(symbol_snapshots)
    sector_overview = build_sector_overview(symbol_snapshots)
    market_overview = build_market_overview(symbol_snapshots, index_snapshots, fx_snapshots)
    symbols_index = build_symbols_index(symbol_snapshots)
    dictionary = load_dictionary()

    write_json(DATA_DIR / "markets" / "overview.json", market_overview)
    write_json(DATA_DIR / "sectors" / "overview.json", sector_overview)
    write_json(DATA_DIR / "rankings" / "top_lists.json", rankings)
    write_json(DATA_DIR / "rankings" / "top_movers.json", {"lastUpdated": rankings["lastUpdated"], "items": rankings["gainers"]})
    write_json(DATA_DIR / "rankings" / "dividends.json", {"lastUpdated": rankings["lastUpdated"], "items": rankings["dividends"]})
    write_json(DATA_DIR / "symbols" / "index.json", symbols_index)
    write_json(DATA_DIR / "dictionary.json", dictionary)

    sample_rankings_path = SAMPLES_DIR / "rankings.json"
    write_json(sample_rankings_path, {
        "lastUpdated": rankings["lastUpdated"],
        "gainers": rankings["gainers"],
        "dividends": rankings["dividends"]
    })

    write_json(SAMPLES_DIR / "markets.json", market_overview)
    write_json(SAMPLES_DIR / "symbols" / "index.json", symbols_index)

    print(f"Generated data for {len(symbol_snapshots)} symbols in {DATA_DIR}")


if __name__ == "__main__":
    main()

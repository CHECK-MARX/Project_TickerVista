const sampleModules = import.meta.glob("../data/samples/**/*.json");

const hasSample = (relative: string) => Boolean(sampleModules[`../data/samples/${relative}`]);

export const availability = {
  markets: hasSample("markets.json"),
  sectors: hasSample("sectors.json"),
  symbols: hasSample("symbols/index.json"),
  indicators: hasSample("indicators/index.json"),
  brokers: hasSample("symbols/index.json"),
  learn: true,
  strategies: true,
  about: true
};

export const navAvailability: Record<string, boolean> = {
  "/": true,
  "/markets": availability.markets,
  "/sectors": availability.sectors,
  "/symbols": availability.symbols,
  "/indicators": availability.indicators,
  "/strategies": availability.strategies,
  "/learn": availability.learn,
  "/brokers": availability.brokers,
  "/about": availability.about
};

export const isNavAvailable = (path: string) => navAvailability[path] ?? true;

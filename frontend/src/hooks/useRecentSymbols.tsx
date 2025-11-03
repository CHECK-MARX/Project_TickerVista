import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type RecentSymbol = {
  symbol: string;
  name?: string;
  exchange?: string;
  viewedAt: string;
};

type RecentSymbolsContextValue = {
  symbols: RecentSymbol[];
  addSymbol: (symbol: RecentSymbol) => void;
};

const RecentSymbolsContext = createContext<RecentSymbolsContextValue | undefined>(undefined);
const STORAGE_KEY = "tickervista_recent_symbols";
const LIMIT = 10;

const load = (): RecentSymbol[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentSymbol[];
  } catch {
    return [];
  }
};

export const RecentSymbolsProvider = ({ children }: { children: ReactNode }) => {
  const [symbols, setSymbols] = useState<RecentSymbol[]>([]);

  useEffect(() => {
    setSymbols(load());
  }, []);

  const addSymbol = (symbol: RecentSymbol) => {
    setSymbols((prev) => {
      const filtered = prev.filter((item) => item.symbol !== symbol.symbol);
      const next = [symbol, ...filtered].slice(0, LIMIT);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(() => ({ symbols, addSymbol }), [symbols]);

  return <RecentSymbolsContext.Provider value={value}>{children}</RecentSymbolsContext.Provider>;
};

export const useRecentSymbols = () => {
  const ctx = useContext(RecentSymbolsContext);
  if (!ctx) {
    throw new Error("useRecentSymbols must be used within RecentSymbolsProvider");
  }
  return ctx;
};

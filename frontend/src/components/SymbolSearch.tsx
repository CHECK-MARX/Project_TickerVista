import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useSymbolSearch } from "../hooks/useSymbolSearch";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { SymbolDto } from "../api/types";
import { useRecentSymbols } from "../hooks/useRecentSymbols";
import { useI18n } from "../lib/i18n";

type SymbolSearchProps = {
  onSelect?: (symbol: SymbolDto) => void;
  placeholder?: string;
  autoFocus?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
};

export const SymbolSearch = ({
  onSelect,
  placeholder = "Symbol or company",
  autoFocus = false,
  value,
  onValueChange
}: SymbolSearchProps) => {
  const { t } = useI18n();
  const [internalValue, setInternalValue] = useState(value ?? "");
  const query = value ?? internalValue;
  const debounced = useDebouncedValue(query, 300);
  const suggestions = useSymbolSearch(debounced);
  const { addSymbol } = useRecentSymbols();

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const highlight = (text: string) => {
    if (!debounced) return text;
    const escaped = debounced.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "ig");
    const parts = text.split(regex);
    const lowerQuery = debounced.toLowerCase();
    return parts.map((part, index) =>
      part.toLowerCase() === lowerQuery ? (
        <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-1 py-0.5 text-slate-900">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      )
    );
  };

  const handleSelect = (symbol: SymbolDto) => {
    addSymbol({
      symbol: symbol.symbol,
      name: symbol.name,
      exchange: symbol.exchange,
      viewedAt: new Date().toISOString()
    });
    if (value === undefined) {
      setInternalValue(symbol.symbol);
    }
    onSelect?.(symbol);
  };

  const list = useMemo(() => suggestions.data ?? [], [suggestions.data]);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-slate-900 dark:border-slate-700 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm focus:outline-none"
          placeholder={placeholder ?? t("common.search_placeholder")}
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            const nextValue = event.target.value.toUpperCase();
            if (value === undefined) {
              setInternalValue(nextValue);
            }
            onValueChange?.(nextValue);
          }}
        />
      </div>
      {query && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {suggestions.isLoading && <p className="px-4 py-2 text-xs text-slate-500">Loading...</p>}
          {!suggestions.isLoading && list.length === 0 && <p className="px-4 py-2 text-xs text-slate-500">No matches</p>}
          {list.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(item)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div>
                <p className="font-semibold">{highlight(item.symbol)}</p>
                <p className="text-xs text-slate-500">{highlight(item.name)}</p>
              </div>
              <span className="text-xs text-slate-400">{item.exchange}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

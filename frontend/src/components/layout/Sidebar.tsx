import { FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { NAV_ITEMS, NavKey } from "../../data/navigation";
import { useRecentSymbols } from "../../hooks/useRecentSymbols";
import { useI18n } from "../../lib/i18n";
import { isNavAvailable } from "../../lib/availability";

export const Sidebar = () => {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const { symbols } = useRecentSymbols();
  const { t } = useI18n();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (term.trim()) {
      navigate(`/symbols?q=${encodeURIComponent(term.trim())}`);
      setTerm("");
    }
  };

  return (
    <aside className="hidden w-72 flex-shrink-0 border-r border-slate-100 bg-white/70 px-4 py-6 dark:border-slate-800 dark:bg-slate-950/40 lg:flex lg:flex-col lg:gap-6" aria-label="Section navigation">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-slate-900 dark:border-slate-700 dark:bg-slate-900">
        <input
          className="w-full bg-transparent text-sm focus:outline-none"
          placeholder={t("common.search_placeholder")}
          value={term}
          onChange={(event) => setTerm(event.target.value.toUpperCase())}
        />
      </form>
      <nav className="flex-1 space-y-2 text-sm">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">MENU</p>
        {NAV_ITEMS.map((item) => (
          isNavAvailable(item.path) ? (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "block rounded-xl px-3 py-2 font-medium",
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white/10"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/60"
                ].join(" ")
              }
            >
              <span className="text-sm">{t(`nav.${item.i18nKey}` as `nav.${NavKey}`)}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
            </NavLink>
          ) : (
            <div
              key={item.path}
              className="rounded-xl px-3 py-2 font-medium text-slate-400"
              title={t("common.unavailable")}
            >
              <span className="text-sm">{t(`nav.${item.i18nKey}` as `nav.${NavKey}`)}</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
            </div>
          )
        ))}
      </nav>
      <div>
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{t("symbols.recent")}</p>
        <ul className="mt-2 space-y-2 text-sm">
          {symbols.length === 0 && <li className="px-2 text-xs text-slate-500">{t("dashboard.no_data")}</li>}
          {symbols.map((item) => (
            <li key={item.symbol} className="rounded-xl border border-slate-100 px-2 py-1 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate(`/?symbol=${item.symbol}`)}
                className="flex w-full flex-col items-start text-left"
              >
                <span className="font-semibold text-slate-800 dark:text-white">{item.symbol}</span>
                <span className="text-xs text-slate-500">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

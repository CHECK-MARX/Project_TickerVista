import { Menu } from "lucide-react";
import { useSyncExternalStore } from "react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS, NavKey } from "../../data/navigation";
import { formatRelativeTime } from "../../lib/time";
import { usePageMeta } from "../../contexts/PageMetaContext";
import { useI18n } from "../../lib/i18n";
import { getCurrentSource, subscribeSource } from "../../lib/apiClient";
import { isNavAvailable } from "../../lib/availability";

type HeaderProps = {
  onCommandOpen: () => void;
};

export const Header = ({ onCommandOpen }: HeaderProps) => {
  const { meta } = usePageMeta();
  const { t, lang, setLang } = useI18n();
  const source = useSyncExternalStore(subscribeSource, getCurrentSource, () => "fallback");
  const isDemo = source === "fallback";

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="flex items-center gap-8">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">TickerVista</p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Knowledge Hub</h1>
        </div>
        <nav className="hidden items-center gap-3 lg:flex" aria-label="Global">
          {NAV_ITEMS.filter((item) =>
            ["markets", "sectors", "symbols", "indicators", "strategies", "learn"].includes(item.i18nKey)
          ).map((item) =>
            isNavAvailable(item.path) ? (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "text-sm font-medium transition",
                    isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  ].join(" ")
                }
              >
                {t(`nav.${item.i18nKey}` as `nav.${NavKey}`)}
              </NavLink>
            ) : (
              <span key={item.path} className="text-sm font-medium text-slate-400" title={t("common.unavailable")}>
                {t(`nav.${item.i18nKey}` as `nav.${NavKey}`)}
              </span>
            )
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {meta.lastUpdated && (
          <p className="text-xs text-slate-500">
            Updated <span className="font-semibold text-slate-700 dark:text-slate-100">{formatRelativeTime(meta.lastUpdated)}</span>
          </p>
        )}
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            isDemo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isDemo ? t("common.demo") : t("common.live")}
        </span>
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
          {(["ja", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`px-2 py-0.5 font-semibold ${
                lang === code ? "text-slate-900 dark:text-white" : "text-slate-500"
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCommandOpen}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-white"
        >
          <Menu className="h-4 w-4" />
          <span>{t("common.search_placeholder")} ⌘K</span>
        </button>
      </div>
    </header>
  );
};

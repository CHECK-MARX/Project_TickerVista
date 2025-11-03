import * as Popover from "@radix-ui/react-popover";
import type { TooltipEntry } from "../api/types";
import { useI18n } from "../lib/i18n";

interface Props {
  entries: TooltipEntry[];
}

export const IndicatorDictionary = ({ entries }: Props) => {
  const { t } = useI18n();
  return (
    <section className="rounded-2xl bg-white/90 p-6 shadow-card dark:bg-slate-900">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">{t("nav.indicators")}</h3>
        <p className="text-sm text-slate-500">タップで指標の説明を表示します。</p>
      </header>
      <div className="flex flex-wrap gap-3">
        {entries.map((entry) => (
          <Popover.Root key={entry.term}>
            <Popover.Trigger className="rounded-2xl border border-slate-200 px-4 py-2 text-sm hover:border-brand-green focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green dark:border-slate-700">
              {entry.term}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-600 dark:bg-slate-900"
                sideOffset={8}
              >
                <h4 className="text-base font-semibold">{entry.label}</h4>
                <p className="mt-1 text-sm text-slate-500">{entry.description}</p>
                <p className="mt-2 text-xs text-slate-400">{entry.how_to_read}</p>
                <Popover.Arrow className="fill-white dark:fill-slate-900" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        ))}
        {entries.length === 0 && <p className="text-sm text-slate-500">{t("dashboard.no_data")}</p>}
      </div>
    </section>
  );
};

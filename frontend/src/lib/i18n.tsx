import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import ja from "../content/i18n/ja.json";

type Dictionary = typeof ja;
export type Lang = "ja" | "en";

const resources: Record<Lang, Dictionary> = {
  ja,
  en: ja
};

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getValue = (dict: Dictionary, path: string): string => {
  const segments = path.split(".");
  let current: any = dict;
  for (const key of segments) {
    current = current?.[key];
    if (current == null) {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("ja");
  const dictionary = resources[lang] ?? resources.ja;

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: (next) => setLangState(resources[next] ? next : "ja"),
      t: (path: string) => getValue(dictionary, path)
    }),
    [lang, dictionary]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
};

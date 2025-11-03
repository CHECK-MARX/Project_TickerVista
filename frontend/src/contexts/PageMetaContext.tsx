import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type PageMeta = {
  lastUpdated?: string;
};

type PageMetaContextValue = {
  meta: PageMeta;
  setMeta: (meta: PageMeta) => void;
};

const PageMetaContext = createContext<PageMetaContextValue | undefined>(undefined);

export const PageMetaProvider = ({ children }: { children: ReactNode }) => {
  const [meta, setMetaState] = useState<PageMeta>({});

  const setMeta = (next: PageMeta) => {
    setMetaState(next);
  };

  const value = useMemo(() => ({ meta, setMeta }), [meta]);

  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>;
};

export const usePageMeta = () => {
  const ctx = useContext(PageMetaContext);
  if (!ctx) {
    throw new Error("usePageMeta must be used inside PageMetaProvider");
  }
  return ctx;
};

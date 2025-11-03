import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import { RecentSymbolsProvider } from "./hooks/useRecentSymbols";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MarketsPage = lazy(() => import("./pages/MarketsPage"));
const SectorsPage = lazy(() => import("./pages/SectorsPage"));
const RankingsPage = lazy(() => import("./pages/RankingsPage"));
const SymbolsPage = lazy(() => import("./pages/SymbolsPage"));
const IndicatorsPage = lazy(() => import("./pages/IndicatorsPage"));
const StrategiesPage = lazy(() => import("./pages/StrategiesPage"));
const LearnPage = lazy(() => import("./pages/LearnPage"));
const BrokersPage = lazy(() => import("./pages/BrokersPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const MarkdownArticlePage = lazy(() => import("./pages/MarkdownArticlePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const App = () => (
  <BrowserRouter>
    <RecentSymbolsProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading...</div>}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="markets" element={<MarketsPage />} />
            <Route path="sectors" element={<SectorsPage />} />
            <Route path="rankings" element={<RankingsPage />} />
            <Route path="symbols" element={<SymbolsPage />} />
            <Route path="indicators" element={<IndicatorsPage />} />
            <Route path="indicators/:slug" element={<MarkdownArticlePage collection="indicators" />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="strategies/:slug" element={<MarkdownArticlePage collection="strategies" />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="learn/:slug" element={<MarkdownArticlePage collection="learn" />} />
            <Route path="brokers" element={<BrokersPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </RecentSymbolsProvider>
  </BrowserRouter>
);

export default App;

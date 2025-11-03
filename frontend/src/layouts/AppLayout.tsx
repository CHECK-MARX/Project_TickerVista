import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { CommandPalette } from "../components/layout/CommandPalette";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PageMetaProvider } from "../contexts/PageMetaContext";

const AppLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <PageMetaProvider>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header onCommandOpen={() => setOpen(true)} />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <Breadcrumbs />
            <Outlet />
          </main>
        </div>
        <CommandPalette open={open} onOpenChange={setOpen} />
      </div>
    </PageMetaProvider>
  );
};

export default AppLayout;

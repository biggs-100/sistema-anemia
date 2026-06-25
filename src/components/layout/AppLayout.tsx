import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import GlobalSearch from "./GlobalSearch";
import KeyboardNavigation from "./KeyboardNavigation";

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-neutral-50 p-6 dark:bg-neutral-950">
          <Outlet />
        </main>
      </div>

      {/* Global modals & keyboard handlers */}
      <GlobalSearch />
      <KeyboardNavigation />
    </div>
  );
}

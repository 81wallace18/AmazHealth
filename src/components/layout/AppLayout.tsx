import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SyncBanner } from "@/components/SyncBanner";
import { installSyncEventListeners, uninstallSyncEventListeners } from "@/lib/syncEvents";

export function AppLayout() {
  useEffect(() => {
    installSyncEventListeners();
    return () => uninstallSyncEventListeners();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <SyncBanner />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

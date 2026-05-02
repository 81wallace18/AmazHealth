import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toast } from "sonner";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { SyncBanner } from "@/components/SyncBanner";
import { installSyncEventListeners, uninstallSyncEventListeners } from "@/lib/syncEvents";
import { useAuth } from "@/hooks/useAuth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

export function AppLayout() {
  const { signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    installSyncEventListeners();
    return () => uninstallSyncEventListeners();
  }, []);

  // Logout automático após 15min de inatividade. Defesa contra "PC esquecido aberto" em UBS
  // compartilhada. 1min antes do timeout, mostra toast de aviso.
  useIdleTimeout({
    enabled: isAuthenticated,
    onWarning: () => {
      toast.warning("Sua sessão vai expirar em 1 minuto por inatividade. Mexa o mouse para continuar.", {
        duration: 10000,
      });
    },
    onTimeout: () => {
      signOut({ reason: "Sessão encerrada por inatividade." });
    },
  });

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

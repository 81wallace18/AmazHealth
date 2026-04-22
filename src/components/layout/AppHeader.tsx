import { Bell, Search, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { toast } from "sonner";

export function AppHeader() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  // Gera iniciais do nome
  const getInitials = (name?: string) => {
    if (!name) return 'US';
    return name
      .split(' ')
      .filter(n => n.length > 0)
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleUnavailableFeature = (feature: string) => {
    toast.info(`${feature} ainda não está disponível.`, {
      description: "A ação foi ocultada do fluxo principal e voltará quando estiver completa.",
    });
  };

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-card px-4 shadow-soft sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <SidebarTrigger className="h-10 w-10 shrink-0" />
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notificações"
          onClick={() => {
            handleUnavailableFeature("Notificações");
          }}
        >
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-3" aria-label="Menu do usuário">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium">
                {user?.fullName || 'Usuário'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <div className="font-medium">{user?.fullName || 'Usuário'}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              <div className="font-medium">{user?.organizationName}</div>
              <div>Papéis: {user?.roles?.join(', ') || 'Nenhum'}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleUnavailableFeature("Meu Perfil")}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUnavailableFeature("Configurações")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

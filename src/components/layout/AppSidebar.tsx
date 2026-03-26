import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Calendar,
  FileText,
  Pill,
  Stethoscope,
  BedDouble,
  BarChart3,
  CreditCard,
  UserPlus,
  TestTube,
  Leaf,
  Building,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole, normalizeRole } from "@/auth/rolePriority";
import type { UserRole } from "@/auth/capabilities";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  allowedRoles?: UserRole[];
  /** Modulo da organizacao necessario. Sem module = sempre visivel. */
  module?: string;
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    group: "Principal",
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
    group: "Atendimento",
    allowedRoles: ["ADMIN", "RECEPTIONIST", "NURSE", "NURSE_MANAGER", "DOCTOR"],
    module: "URGENCIA",
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    group: "Atendimento",
    allowedRoles: ["ADMIN", "RECEPTIONIST"],
    module: "AMBULATORIAL",
  },
  {
    title: "Prontuários",
    url: "/medical-records",
    icon: FileText,
    group: "Atendimento",
    allowedRoles: ["ADMIN", "DOCTOR"],
    module: "URGENCIA",
  },
  {
    title: "Consultas",
    url: "/consultations",
    icon: Stethoscope,
    group: "Atendimento",
    allowedRoles: ["ADMIN", "DOCTOR"],
    module: "URGENCIA",
  },
  {
    title: "Triagem",
    url: "/triage",
    icon: Leaf,
    group: "Atendimento",
    allowedRoles: ["ADMIN", "NURSE", "NURSE_MANAGER"],
    module: "URGENCIA",
  },
  {
    title: "Recepção",
    url: "/reception/triage",
    icon: UserPlus,
    group: "Atendimento",
    allowedRoles: ["ADMIN", "RECEPTIONIST"],
    module: "URGENCIA",
  },
  {
    title: "Gestão Hospitalar",
    url: "/hospital",
    icon: Building,
    group: "Hospitalização",
    allowedRoles: ["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER"],
    module: "INTERNACAO",
  },
  {
    title: "Internação",
    url: "/admissions",
    icon: BedDouble,
    group: "Hospitalização",
    allowedRoles: ["ADMIN", "HOSPITAL_MANAGER"],
    module: "INTERNACAO",
  },
  {
    title: "Laboratório",
    url: "/laboratory",
    icon: TestTube,
    group: "Exames",
    allowedRoles: ["ADMIN", "DOCTOR"],
    module: "LABORATORIO",
  },
  {
    title: "Farmácia",
    url: "/pharmacy",
    icon: Pill,
    group: "Medicamentos",
    allowedRoles: ["ADMIN", "PHARMACIST"],
    module: "FARMACIA",
  },
  {
    title: "Faturamento",
    url: "/billing",
    icon: CreditCard,
    group: "Financeiro",
    allowedRoles: ["ADMIN", "FINANCE"],
    module: "FATURAMENTO",
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    group: "Gestão",
    allowedRoles: ["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER", "FINANCE"],
    module: "RELATORIOS",
  },
  {
    title: "Equipe",
    url: "/staff",
    icon: Users,
    group: "Gestão",
    allowedRoles: ["ADMIN", "GESTAO"],
  },
  {
    title: "Usuários",
    url: "/users",
    icon: UserPlus,
    group: "Gestão",
    allowedRoles: ["ADMIN"],
  }
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles);
  const normalizedRoles = new Set(
    (user?.roles ?? [])
      .map(normalizeRole)
      .filter((role): role is UserRole => role !== null)
  );

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const enabledModules = user?.enabledModules;

  const filteredNavigationItems = navigationItems.filter(item => {
    // Filtro por role
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (!item.allowedRoles.some((role) => normalizedRoles.has(role))) {
        return false;
      }
    }
    // Filtro por modulo da organizacao (null = tudo habilitado)
    if (item.module && enabledModules && enabledModules.length > 0) {
      if (!enabledModules.includes(item.module)) {
        return false;
      }
    }
    return true;
  });

  const groupedItems = filteredNavigationItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const quickAction = (() => {
    switch (primaryRole) {
      case "ADMIN":
        return {
          title: "Gerir Usuários",
          description: "Criar acessos, revisar perfis e auditar permissões.",
          to: "/users",
          label: "Abrir usuários",
        };
      case "GESTAO":
        return {
          title: "Indicadores",
          description: "Acompanhar KPIs operacionais e relatórios da unidade.",
          to: "/reports",
          label: "Abrir relatórios",
        };
      case "HOSPITAL_MANAGER":
        return {
          title: "Capacidade Hospitalar",
          description: "Monitorar leitos, wards e pacientes internados.",
          to: "/hospital",
          label: "Abrir gestão",
        };
      case "FINANCE":
        return {
          title: "Cobranças",
          description: "Acompanhar pendências e faturamento do plantão.",
          to: "/billing",
          label: "Abrir faturamento",
        };
      case "NURSE_MANAGER":
      case "NURSE":
        return {
          title: "Fila de Triagem",
          description: "Priorizar atendimentos e redistribuir o fluxo clínico.",
          to: "/triage",
          label: "Abrir triagem",
        };
      case "DOCTOR":
        return {
          title: "Fila Médica",
          description: "Assumir atendimentos aguardando avaliação médica.",
          to: "/consultations",
          label: "Abrir consultas",
        };
      case "PHARMACIST":
        return {
          title: "Operação Farmácia",
          description: "Fila de dispensação e itens com estoque crítico.",
          to: "/pharmacy",
          label: "Abrir farmácia",
        };
      case "RECEPTIONIST":
        return {
          title: "Nova Ficha",
          description: "Registrar entrada, localizar paciente e abrir atendimento.",
          to: "/reception/triage",
          label: "Abrir recepção",
        };
      default:
        return null;
    }
  })();

  const groupOrder = ["Principal", "Atendimento", "Hospitalização", "Exames", "Medicamentos", "Financeiro", "Gestão"];

  const orderedGroups = groupOrder
    .filter((g) => groupedItems[g])
    .map((g) => [g, groupedItems[g]] as const);

  // Groups that contain the active route start open
  const activeGroup = filteredNavigationItems.find((item) =>
    isActive(item.url) && item.url !== "/"
  )?.group;

  return (
    <Sidebar
      className="w-64"
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg flex-shrink-0">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-primary truncate">AmazHealth</h1>
              <p className="text-xs text-muted-foreground truncate">Sistema Hospitalar</p>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        {orderedGroups.map(([groupName, items]) => {
          // "Principal" (Dashboard) is always visible, not collapsible
          if (groupName === "Principal") {
            return (
              <SidebarGroup key={groupName}>
                <SidebarGroupLabel className="text-primary font-semibold">
                  {groupName}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          tooltip={item.title}
                          className={isActive(item.url) ? "bg-primary text-primary-foreground shadow-medium hover:bg-primary hover:text-primary-foreground" : ""}
                        >
                          <NavLink to={item.url}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Other groups are collapsible
          const isGroupActive = activeGroup === groupName;
          return (
            <Collapsible
              key={groupName}
              defaultOpen={isGroupActive || items.length <= 2}
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="text-primary font-semibold cursor-pointer hover:bg-sidebar-accent rounded-md transition-colors"
                >
                  <CollapsibleTrigger className="flex w-full items-center">
                    {groupName}
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.url)}
                            tooltip={item.title}
                            className={isActive(item.url) ? "bg-primary text-primary-foreground shadow-medium hover:bg-primary hover:text-primary-foreground" : ""}
                          >
                            <NavLink to={item.url}>
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {/* Quick Action */}
        {quickAction && (
          <div className="p-4 mt-auto group-data-[collapsible=icon]:hidden">
            <div className="bg-gradient-hero p-4 rounded-lg text-white">
              <UserPlus className="h-6 w-6 mb-2" />
              <h3 className="font-semibold text-sm">{quickAction.title}</h3>
              <p className="text-xs opacity-90 mb-3">
                {quickAction.description}
              </p>
              <Link
                to={quickAction.to}
                className="block w-full bg-white/20 hover:bg-white/30 rounded-md py-2 px-3 text-xs font-medium transition-colors text-center"
              >
                {quickAction.label}
              </Link>
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

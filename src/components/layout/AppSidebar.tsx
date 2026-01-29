import { NavLink, useLocation } from "react-router-dom";
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
  Building
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
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCapabilities } from "@/auth/useCapabilities";
import { UserCapabilities } from "@/auth/capabilities";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  requiredCapabilities?: (keyof UserCapabilities)[];
  requiredRoles?: string[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
    group: "Principal"
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
    group: "Atendimento",
    requiredCapabilities: ["canListPatients"]
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    group: "Atendimento",
    requiredCapabilities: ["canReadAttendance"]
  },
  {
    title: "Prontuários",
    url: "/medical-records",
    icon: FileText,
    group: "Atendimento",
    requiredCapabilities: ["canReadAttendance"]
  },
  {
    title: "Consultas",
    url: "/consultations",
    icon: Stethoscope,
    group: "Atendimento",
    requiredCapabilities: ["canStartAttendance", "canReadAttendance"]
  },
  {
    title: "Triagem",
    url: "/triage",
    icon: Leaf,
    group: "Atendimento",
    requiredCapabilities: ["canReadTriage"]
  },
  {
    title: "Triagem (Recepção)",
    url: "/reception/triage",
    icon: UserPlus,
    group: "Atendimento",
    requiredCapabilities: ["canCreateAttendance"],
    requiredRoles: ["RECEPTIONIST", "ADMIN"]
  },
  {
    title: "Gestão Hospitalar",
    url: "/hospital",
    icon: Building,
    group: "Hospitalização",
    requiredCapabilities: ["canAdmitPatient", "canViewTriageBoard"]
  },
  {
    title: "Internação",
    url: "/admissions",
    icon: BedDouble,
    group: "Hospitalização",
    requiredCapabilities: ["canAdmitPatient"]
  },
  {
    title: "Laboratório",
    url: "/laboratory",
    icon: TestTube,
    group: "Exames",
    requiredCapabilities: ["canRequestExams", "canReadExamResults", "canInputExamResults"]
  },
  {
    title: "Farmácia",
    url: "/pharmacy",
    icon: Pill,
    group: "Medicamentos",
    requiredCapabilities: ["canReadPrescription", "canManageStock", "canDispenseMedication"]
  },
  {
    title: "Faturamento",
    url: "/billing",
    icon: CreditCard,
    group: "Financeiro",
    requiredCapabilities: ["canAccessFinancial", "canManageBilling"]
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    group: "Gestão",
    requiredCapabilities: ["canViewReports"]
  },
  {
    title: "Equipe",
    url: "/staff",
    icon: Users,
    group: "Gestão",
    requiredCapabilities: ["canListStaff"]
  },
  {
    title: "Usuários",
    url: "/users",
    icon: UserPlus,
    group: "Gestão",
    requiredCapabilities: ["canManageRoles"]
  }
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { canAny, hasRole } = useCapabilities();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Filter navigation items based on user capabilities
  const filteredNavigationItems = navigationItems.filter(item => {
    // If no capabilities required, show to everyone
    if (!item.requiredCapabilities || item.requiredCapabilities.length === 0) {
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      return item.requiredRoles.some(hasRole);
    }
    // Show if user has ANY of the required capabilities
    const hasCaps = canAny(item.requiredCapabilities);
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return hasCaps;
    }
    return hasCaps && item.requiredRoles.some(hasRole);
  });

  const groupedItems = filteredNavigationItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  return (
    <Sidebar
      className="w-64"
      collapsible={isMobile ? "offcanvas" : "none"}
    >
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Leaf className="h-6 w-6 text-white" />
            </div>
              <div>
                <h1 className="text-lg font-bold text-primary">AmazHealth</h1>
                <p className="text-xs text-muted-foreground">Sistema Hospitalar</p>
              </div>
          </div>
        </div>

        {/* Navigation Groups */}
        {Object.entries(groupedItems).map(([groupName, items]) => (
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
        ))}

        {/* Quick Action */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-hero p-4 rounded-lg text-white">
            <UserPlus className="h-6 w-6 mb-2" />
            <h3 className="font-semibold text-sm">Novo Paciente</h3>
            <p className="text-xs opacity-90 mb-3">
              Cadastrar rapidamente
            </p>
            <button className="w-full bg-white/20 hover:bg-white/30 rounded-md py-2 px-3 text-xs font-medium transition-colors">
              Cadastrar
            </button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

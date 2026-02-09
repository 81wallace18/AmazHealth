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
  Building,
  Clock3
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
    group: "Principal",
    requiredRoles: ["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER", "FINANCE"]
  },
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
    group: "Atendimento",
    requiredCapabilities: ["canListPatients"],
    requiredRoles: ["ADMIN", "RECEPTIONIST"]
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    group: "Atendimento",
    requiredCapabilities: ["canCreateAttendance"],
    requiredRoles: ["ADMIN", "RECEPTIONIST"]
  },
  {
    title: "Prontuários",
    url: "/medical-records",
    icon: FileText,
    group: "Atendimento",
    requiredCapabilities: ["canRecordEvolution"],
    requiredRoles: ["ADMIN", "DOCTOR"]
  },
  {
    title: "Consultas",
    url: "/consultations",
    icon: Stethoscope,
    group: "Atendimento",
    requiredCapabilities: ["canStartAttendance"],
    requiredRoles: ["ADMIN", "DOCTOR"]
  },
  {
    title: "Triagem",
    url: "/triage",
    icon: Leaf,
    group: "Atendimento",
    requiredCapabilities: ["canReadTriage"],
    requiredRoles: ["ADMIN", "NURSE", "DOCTOR", "NURSE_MANAGER"]
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
    title: "Andamento (Recepção)",
    url: "/reception/queue",
    icon: Clock3,
    group: "Atendimento",
    requiredCapabilities: ["canCreateAttendance"],
    requiredRoles: ["RECEPTIONIST", "ADMIN"]
  },
  {
    title: "Gestão Hospitalar",
    url: "/hospital",
    icon: Building,
    group: "Hospitalização",
    requiredCapabilities: ["canAccessOperational"],
    requiredRoles: ["ADMIN", "NURSE_MANAGER", "HOSPITAL_MANAGER"]
  },
  {
    title: "Internação",
    url: "/admissions",
    icon: BedDouble,
    group: "Hospitalização",
    requiredCapabilities: ["canAdmitPatient"],
    requiredRoles: ["ADMIN", "DOCTOR", "NURSE_MANAGER", "HOSPITAL_MANAGER"]
  },
  {
    title: "Laboratório",
    url: "/laboratory",
    icon: TestTube,
    group: "Exames",
    requiredCapabilities: ["canReadExamResults"],
    requiredRoles: ["ADMIN", "DOCTOR", "NURSE"]
  },
  {
    title: "Farmácia",
    url: "/pharmacy",
    icon: Pill,
    group: "Medicamentos",
    requiredCapabilities: ["canManageStock", "canDispenseMedication"],
    requiredRoles: ["ADMIN", "PHARMACIST"]
  },
  {
    title: "Faturamento",
    url: "/billing",
    icon: CreditCard,
    group: "Financeiro",
    requiredCapabilities: ["canAccessFinancial", "canManageBilling"],
    requiredRoles: ["ADMIN", "FINANCE"]
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    group: "Gestão",
    requiredCapabilities: ["canViewReports"],
    requiredRoles: ["ADMIN", "GESTAO", "NURSE_MANAGER", "HOSPITAL_MANAGER", "FINANCE"]
  },
  {
    title: "Equipe",
    url: "/staff",
    icon: Users,
    group: "Gestão",
    requiredCapabilities: ["canListStaff"],
    requiredRoles: ["ADMIN", "GESTAO"]
  },
  {
    title: "Usuários",
    url: "/users",
    icon: UserPlus,
    group: "Gestão",
    requiredCapabilities: ["canManageRoles"],
    requiredRoles: ["ADMIN"]
  }
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { can, hasRole } = useCapabilities();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Filter navigation items using strict role + capability checks
  const filteredNavigationItems = navigationItems.filter(item => {
    const hasRoles = !item.requiredRoles || item.requiredRoles.length === 0
      ? true
      : item.requiredRoles.some(hasRole);

    const hasCapabilities = !item.requiredCapabilities || item.requiredCapabilities.length === 0
      ? true
      : item.requiredCapabilities.every((capability) => can(capability));

    return hasRoles && hasCapabilities;
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
        {can("canCreatePatients") && hasRole("RECEPTIONIST") && (
          <div className="p-4 mt-auto">
            <div className="bg-gradient-hero p-4 rounded-lg text-white">
              <UserPlus className="h-6 w-6 mb-2" />
              <h3 className="font-semibold text-sm">Novo Paciente</h3>
              <p className="text-xs opacity-90 mb-3">
                Cadastrar rapidamente
              </p>
              <NavLink
                to="/patients"
                className="block w-full bg-white/20 hover:bg-white/30 rounded-md py-2 px-3 text-xs font-medium transition-colors text-center"
              >
                Cadastrar
              </NavLink>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

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
  Activity,
  DoorOpen,
  Bed
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
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
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
    group: "Atendimento"
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    group: "Atendimento"
  },
  {
    title: "Triagem",
    url: "/triage",
    icon: Activity,
    group: "Atendimento"
  },
  {
    title: "Prontuários",
    url: "/medical-records",
    icon: FileText,
    group: "Atendimento"
  },
  {
    title: "Consultas",
    url: "/consultations",
    icon: Stethoscope,
    group: "Atendimento"
  },
  {
    title: "Gestão Hospitalar",
    url: "/hospital",
    icon: Building,
    group: "Hospitalização"
  },
  {
    title: "Internação",
    url: "/admissions",
    icon: BedDouble,
    group: "Hospitalização"
  },
  {
    title: "Laboratório",
    url: "/laboratory",
    icon: TestTube,
    group: "Exames"
  },
  {
    title: "Farmácia",
    url: "/pharmacy",
    icon: Pill,
    group: "Medicamentos"
  },
  {
    title: "Faturamento",
    url: "/billing",
    icon: CreditCard,
    group: "Financeiro"
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    group: "Gestão"
  },
  {
    title: "Equipe Clínica",
    url: "/staff",
    icon: Users,
    group: "Gestão"
  },
  {
    title: "Usuários & Acessos",
    url: "/users",
    icon: UserPlus,
    group: "Gestão"
  },
  {
    title: "Setores & Enfermarias",
    url: "/facilities",
    icon: DoorOpen,
    group: "Administração",
    adminOnly: true
  },
  {
    title: "Gestão de Leitos",
    url: "/beds",
    icon: Bed,
    group: "Administração",
    adminOnly: true
  }
];

const receptionItems = [
  {
    title: "Pacientes",
    url: "/patients",
    icon: Users,
    group: "Recepção"
  },
  {
    title: "Agendamentos",
    url: "/appointments",
    icon: Calendar,
    group: "Recepção"
  },
  {
    title: "Triagem (Lista)",
    url: "/reception/triage",
    icon: Activity,
    group: "Recepção"
  },
  {
    title: "Andamento",
    url: "/reception/queue",
    icon: BarChart3,
    group: "Recepção"
  }
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const isReceptionistOnly = user?.roles?.length === 1 && user?.roles?.includes('RECEPTIONIST');
  const menuItems = isReceptionistOnly ? receptionItems : navigationItems;

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Filtrar itens baseado nas roles do usuário
  const filteredItems = menuItems.filter(item => {
    if (item.adminOnly) {
      return user?.roles?.includes('ADMIN');
    }
    return true;
  });

  const filteredGroupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

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
        {Object.entries(filteredGroupedItems).map(([groupName, items]) => (
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

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Calendar,
  BedDouble,
  Stethoscope,
  RefreshCw,
  Activity,
  Clock,
} from "lucide-react";
import dashboardService from "@/services/dashboardService";
import { useAuth } from "@/hooks/useAuth";
import { getPrimaryRole } from "@/auth/rolePriority";
import type { UserRole } from "@/auth/capabilities";

type QuickLink = {
  label: string;
  description: string;
  to: string;
};

export default function Dashboard() {
  const { user } = useAuth();
  const primaryRole = getPrimaryRole(user?.roles);
  const isReceptionist = primaryRole === "RECEPTIONIST";
  const isDoctor = primaryRole === "DOCTOR";

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.getSummary(),
    staleTime: 60_000,
    enabled: !isReceptionist,
  });

  const statsCards = useMemo(() => {
    const summary = {
      activePatients: data?.activePatients ?? 0,
      todaysAttendances: data?.todaysAttendances ?? 0,
      availableBeds: data?.availableBeds ?? 0,
      ongoingAttendances: data?.ongoingAttendances ?? 0
    };

    return [
      {
        title: "Pacientes Ativos",
        value: summary.activePatients.toString(),
        icon: Users,
        description: "Total de pacientes ativos na organização"
      },
      {
        title: "Atendimentos Hoje",
        value: summary.todaysAttendances.toString(),
        icon: Calendar,
        description: "Entradas registradas nas últimas 24h"
      },
      {
        title: "Leitos Disponíveis",
        value: summary.availableBeds.toString(),
        icon: BedDouble,
        description: "Leitos livres ou liberados para uso"
      },
      {
        title: "Consultas em Andamento",
        value: summary.ongoingAttendances.toString(),
        icon: Stethoscope,
        description: "Atendimentos em triagem/medicina/exames"
      }
    ];
  }, [data]);

  const lastUpdated = data?.generatedAt
    ? format(new Date(data.generatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : null;

  const hero = useMemo(() => {
    const heroByRole: Record<UserRole, { title: string; description: string }> = {
      ADMIN: {
        title: "Painel Administrativo",
        description: "Visão consolidada de operação, acessos, equipes e indicadores estratégicos.",
      },
      GESTAO: {
        title: "Painel Operacional",
        description: "Acompanhe fluxo assistencial, capacidade hospitalar e resultados da operação.",
      },
      HOSPITAL_MANAGER: {
        title: "Painel Hospitalar",
        description: "Monitore leitos, internações, capacidade e gargalos da unidade.",
      },
      FINANCE: {
        title: "Painel Financeiro",
        description: "Acompanhe cobranças, pendências e indicadores financeiros da operação.",
      },
      NURSE_MANAGER: {
        title: "Painel de Enfermagem",
        description: "Gerencie priorização clínica, triagem e apoio operacional do plantão.",
      },
      DOCTOR: {
        title: "Painel Médico",
        description: "Acesse rapidamente a fila médica, evoluções e desfechos do plantão.",
      },
      NURSE: {
        title: "Painel de Triagem",
        description: "Priorize pacientes, acompanhe classificações e distribua o fluxo clínico.",
      },
      PHARMACIST: {
        title: "Painel da Farmácia",
        description: "Monitore prescrições, dispensações e itens com estoque crítico.",
      },
      RECEPTIONIST: {
        title: "Painel da Recepção",
        description: "Cadastro de pacientes, abertura de fichas e acompanhamento da fila inicial.",
      },
    };

    return (
      (primaryRole && heroByRole[primaryRole]) || {
        title: "Início",
        description: "Visão geral em tempo real das operações hospitalares.",
      }
    );
  }, [primaryRole]);

  const quickLinks = useMemo<QuickLink[]>(() => {
    const linksByRole: Partial<Record<UserRole, QuickLink[]>> = {
      ADMIN: [
        { label: "Usuários", description: "Acessos e permissões", to: "/users" },
        { label: "Equipe", description: "Gestão de colaboradores", to: "/staff" },
        { label: "Relatórios", description: "Indicadores e consolidados", to: "/reports" },
        { label: "Faturamento", description: "Cobranças e repasses", to: "/billing" },
      ],
      GESTAO: [
        { label: "Gestão Hospitalar", description: "Capacidade e operação", to: "/hospital" },
        { label: "Relatórios", description: "Indicadores operacionais", to: "/reports" },
        { label: "Equipe", description: "Visão da equipe assistencial", to: "/staff" },
      ],
      HOSPITAL_MANAGER: [
        { label: "Gestão Hospitalar", description: "Leitos, alas e capacidade", to: "/hospital" },
        { label: "Internação", description: "Pacientes admitidos", to: "/admissions" },
        { label: "Relatórios", description: "Ocupação e produtividade", to: "/reports" },
      ],
      FINANCE: [
        { label: "Faturamento", description: "Cobranças e repasses", to: "/billing" },
        { label: "Relatórios", description: "Indicadores financeiros", to: "/reports" },
      ],
      NURSE_MANAGER: [
        { label: "Triagem", description: "Fila e priorização clínica", to: "/triage" },
        { label: "Pacientes", description: "Acompanhamento do plantão", to: "/patients" },
        { label: "Gestão Hospitalar", description: "Capacidade assistencial", to: "/hospital" },
      ],
      DOCTOR: [
        { label: "Consultas", description: "Fila médica do plantão", to: "/consultations" },
        { label: "Prontuários", description: "Histórico e evolução clínica", to: "/medical-records" },
        { label: "Laboratório", description: "Solicitações e resultados", to: "/laboratory" },
      ],
      NURSE: [
        { label: "Triagem", description: "Classificação de risco e fila", to: "/triage" },
        { label: "Pacientes", description: "Acompanhamento de pacientes", to: "/patients" },
      ],
      PHARMACIST: [
        { label: "Farmácia", description: "Fila, estoque e alertas", to: "/pharmacy" },
      ],
      RECEPTIONIST: [
        { label: "Recepção", description: "Abrir fichas e acompanhar fila", to: "/reception/triage" },
        { label: "Pacientes", description: "Cadastro e busca de pacientes", to: "/patients" },
      ],
    };

    return primaryRole ? linksByRole[primaryRole] ?? [] : [];
  }, [primaryRole]);

  // Recepcionista vai direto para a tela de Recepção (após todos os hooks)
  if (isReceptionist) {
    return <Navigate to="/reception/triage" replace />;
  }

  // Médico vai direto para a fila de atendimento médico.
  if (isDoctor) {
    return <Navigate to="/consultations" replace />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{hero.title}</h1>
          <p className="text-muted-foreground">
            {hero.description}
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado em {lastUpdated}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Não foi possível carregar os indicadores. Tente novamente em instantes.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <Badge variant="secondary" className="mt-2">
                  Atualizado
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>Módulos mais relevantes para o papel atual</CardDescription>
        </CardHeader>
        <CardContent>
          {quickLinks.length === 0 ? (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <p>Não há atalhos configurados para o papel atual.</p>
                <p>Use a navegação lateral para acessar os módulos disponíveis.</p>
              </div>
              <Clock className="h-6 w-6" />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{link.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {link.description}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

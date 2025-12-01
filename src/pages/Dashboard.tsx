import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

export default function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.getSummary(),
    staleTime: 60_000
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral em tempo real das operações hospitalares
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

      {/* Atividades Recentes - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>Últimas ações no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <p><strong>Atendimentos ativos:</strong> {data?.ongoingAttendances ?? 0}</p>
              <p><strong>Pacientes aguardando entrada hoje:</strong> {data?.todaysAttendances ?? 0}</p>
            </div>
            <Clock className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Gráficos - Placeholder para futuras implementações */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos por Dia</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">
              Gráfico será implementado após integração completa com backend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Ocupação</CardTitle>
            <CardDescription>Leitos hospitalares</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground text-sm">
              Gráfico será implementado após integração completa com backend
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

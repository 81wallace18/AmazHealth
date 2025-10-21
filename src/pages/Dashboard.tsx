import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Calendar,
  BedDouble,
  Stethoscope,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";

export default function Dashboard() {
  // TODO: Integrar com backend quando endpoints estiverem prontos
  const stats = {
    activePatients: 0,
    todayAppointments: 0,
    availableBeds: 0,
    ongoingConsultations: 0,
  };

  const statsCards = [
    {
      title: "Pacientes Ativos",
      value: stats.activePatients.toString(),
      change: "+0%",
      changeType: "neutral" as const,
      icon: Users,
      description: "Total de pacientes cadastrados"
    },
    {
      title: "Agendamentos Hoje",
      value: stats.todayAppointments.toString(),
      change: "+0%",
      changeType: "neutral" as const,
      icon: Calendar,
      description: "Consultas agendadas para hoje"
    },
    {
      title: "Leitos Disponíveis",
      value: stats.availableBeds.toString(),
      change: "0%",
      changeType: "neutral" as const,
      icon: BedDouble,
      description: "Leitos livres no hospital"
    },
    {
      title: "Consultas em Andamento",
      value: stats.ongoingConsultations.toString(),
      change: "+0%",
      changeType: "neutral" as const,
      icon: Stethoscope,
      description: "Atendimentos médicos ativos"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema hospitalar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <Badge
                variant={stat.changeType === "positive" ? "default" : "secondary"}
                className="mt-2"
              >
                <TrendingUp className="mr-1 h-3 w-3" />
                {stat.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

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
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhuma atividade recente</p>
              <p className="text-xs">As atividades aparecerão aqui conforme o uso do sistema</p>
            </div>
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

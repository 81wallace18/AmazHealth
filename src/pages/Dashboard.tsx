import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  Calendar,
  BedDouble,
  Stethoscope,
  TrendingUp,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

export default function Dashboard() {
  const { stats, recentActivities, loading } = useDashboard();

  const statsCards = [
    {
      title: "Pacientes Ativos",
      value: stats.activePatients.toString(),
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      description: "Total de pacientes cadastrados"
    },
    {
      title: "Consultas Hoje",
      value: stats.todayAppointments.toString(),
      change: "+8%",
      changeType: "positive" as const,
      icon: Stethoscope,
      description: "Agendamentos para hoje"
    },
    {
      title: "Leitos Ocupados",
      value: `${stats.occupiedBeds}/${stats.totalBeds}`,
      change: stats.totalBeds > 0 ? `${Math.round((stats.occupiedBeds / stats.totalBeds) * 100)}%` : "0%",
      changeType: "neutral" as const,
      icon: BedDouble,
      description: "Taxa de ocupação"
    },
    {
      title: "Fila de Espera",
      value: stats.waitingQueue.toString(),
      change: "-15%",
      changeType: "positive" as const,
      icon: Clock,
      description: "Pacientes aguardando"
    }
  ];


  const urgentTasks = [
    {
      id: 1,
      title: "Avaliação médica - Leito 8",
      priority: "alta",
      deadline: "30 min"
    },
    {
      id: 2,
      title: "Resultado de exame - João Silva",
      priority: "média",
      deadline: "2h"
    },
    {
      id: 3,
      title: "Renovar prescrição - Maria Santos",
      priority: "baixa",
      deadline: "4h"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao AmazHealth</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Hoje
          </Button>
          <Button className="bg-gradient-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    stat.changeType === "positive"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </Badge>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>
              Últimas movimentações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`
                  p-1.5 rounded-full flex-shrink-0
                  ${activity.status === "success" ? "bg-green-100 text-green-600" : 
                    activity.status === "warning" ? "bg-yellow-100 text-yellow-600" :
                    activity.status === "error" ? "bg-red-100 text-red-600" :
                    "bg-blue-100 text-blue-600"}
                `}>
                  {activity.status === "success" ? <CheckCircle className="h-3 w-3" /> :
                   activity.status === "error" ? <AlertCircle className="h-3 w-3" /> :
                   <Activity className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.message}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Tarefas Urgentes
            </CardTitle>
            <CardDescription>
              Ações que precisam de atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {urgentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        task.priority === "alta" ? "destructive" :
                        task.priority === "média" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Prazo: {task.deadline}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Ver
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <UserPlus className="h-6 w-6" />
              <span className="text-sm">Novo Paciente</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Agendar</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Stethoscope className="h-6 w-6" />
              <span className="text-sm">Consulta</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BedDouble className="h-6 w-6" />
              <span className="text-sm">Internação</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
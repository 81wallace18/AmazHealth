import { Users, Bed, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Admission } from "@/types/admission";

interface AdmissionStatsProps {
  admissions: Admission[];
}

export function AdmissionStats({ admissions }: AdmissionStatsProps) {
  const totalAdmissions = admissions.length;
  const activeAdmissions = admissions.filter(a => a.admissionStatus === 'ACTIVE' || a.admissionStatus === 'BED_ASSIGNED').length;
  const dischargedToday = admissions.filter(a =>
    a.admissionStatus === 'DISCHARGED' &&
    a.actualDischargeDate &&
    new Date(a.actualDischargeDate).toDateString() === new Date().toDateString()
  ).length;
  const admittedToday = admissions.filter(a =>
    new Date(a.admissionDate).toDateString() === new Date().toDateString()
  ).length;

  const stats = [
    {
      title: "Internações Ativas",
      value: activeAdmissions,
      description: "Pacientes internados",
      icon: Users,
      change: "+2% desde ontem",
    },
    {
      title: "Total de Internações",
      value: totalAdmissions,
      description: "Total geral",
      icon: Bed,
      change: "+5% este mês",
    },
    {
      title: "Internações Hoje",
      value: admittedToday,
      description: "Novas internações",
      icon: Calendar,
      change: "Dados de hoje",
    },
    {
      title: "Altas Hoje",
      value: dischargedToday,
      description: "Pacientes com alta",
      icon: TrendingUp,
      change: "Dados de hoje",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

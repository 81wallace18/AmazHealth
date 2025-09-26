import { useState } from "react";
import { BarChart3, TrendingUp, Users, Calendar, Activity, Download, Filter, Eye, DollarSign, Stethoscope, TestTube } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useReports } from "@/hooks/useReports";

const statusColors = {
  "Disponível": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "Processando": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Erro": "bg-red-500/10 text-red-700 border-red-200"
};

export default function Reports() {
  const { reportData, loading } = useReports();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading || !reportData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Analytics e relatórios gerenciais do sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{reportData.patients.total}</div>
            <p className="text-xs text-muted-foreground">
              +{reportData.patients.new_this_month} novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reportData.consultations.total}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.consultations.this_month} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Internações</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{reportData.admissions.current}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.admissions.this_month} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(reportData.financial.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(reportData.financial.monthly_revenue)} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exames</CardTitle>
            <TestTube className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{reportData.laboratory.total_tests}</div>
            <p className="text-xs text-muted-foreground">
              {reportData.laboratory.pending_results} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permanência Média</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{reportData.admissions.average_stay}</div>
            <p className="text-xs text-muted-foreground">dias por internação</p>
          </CardContent>
        </Card>
      </div>

      {/* Demographics and Status Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Gênero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Masculino</span>
                  <span className="text-sm font-semibold">{reportData.patients.by_gender.male} pacientes</span>
                </div>
                <Progress 
                  value={(reportData.patients.by_gender.male / reportData.patients.total) * 100} 
                  className="h-2" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feminino</span>
                  <span className="text-sm font-semibold">{reportData.patients.by_gender.female} pacientes</span>
                </div>
                <Progress 
                  value={(reportData.patients.by_gender.female / reportData.patients.total) * 100} 
                  className="h-2" 
                />
              </div>

              {reportData.patients.by_gender.other > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outro</span>
                    <span className="text-sm font-semibold">{reportData.patients.by_gender.other} pacientes</span>
                  </div>
                  <Progress 
                    value={(reportData.patients.by_gender.other / reportData.patients.total) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(reportData.consultations.by_status).map(([status, count]) => {
                const statusLabels: { [key: string]: string } = {
                  'scheduled': 'Agendadas',
                  'in_progress': 'Em Andamento',
                  'completed': 'Concluídas',
                  'cancelled': 'Canceladas'
                };
                
                return (
                  <div key={status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{statusLabels[status] || status}</div>
                      <div className="text-sm text-muted-foreground">{count} consultas</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {Math.round((count / reportData.consultations.total) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">do total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Specialties and Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Consultas por Especialidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reportData.consultations.by_specialty)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([specialty, count]) => (
                  <div key={specialty} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{specialty}</span>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{count} consultas</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((count / reportData.consultations.total) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <div>
                  <div className="font-medium text-emerald-700 dark:text-emerald-400">Faturas Pagas</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-500">
                    {reportData.financial.paid_bills} faturas
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(reportData.financial.total_revenue)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <div>
                  <div className="font-medium text-amber-700 dark:text-amber-400">Faturas Pendentes</div>
                  <div className="text-sm text-amber-600 dark:text-amber-500">
                    {reportData.financial.pending_bills} faturas
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-amber-700 dark:text-amber-400">
                    Aguardando pagamento
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div>
                  <div className="font-medium text-blue-700 dark:text-blue-400">Exames Realizados</div>
                  <div className="text-sm text-blue-600 dark:text-blue-500">
                    {reportData.laboratory.completed_today} hoje
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-700 dark:text-blue-400">
                    {reportData.laboratory.total_tests} total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Age Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(reportData.patients.by_age_group).map(([ageGroup, count]) => {
              const ageLabels: { [key: string]: string } = {
                '0-17': 'Crianças e Adolescentes (0-17 anos)',
                '18-64': 'Adultos (18-64 anos)',
                '65+': 'Idosos (65+ anos)'
              };
              
              return (
                <div key={ageGroup} className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-sm font-medium">{ageLabels[ageGroup] || ageGroup}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((count / reportData.patients.total) * 100)}% do total
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
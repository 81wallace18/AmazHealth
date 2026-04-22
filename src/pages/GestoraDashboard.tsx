import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, Users, Activity, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import dashboardService, { GestoraDashboard } from '@/services/dashboardService';

const TRIAGE_COLORS: Record<string, string> = {
  RED: '#ef4444',
  ORANGE: '#f97316',
  YELLOW: '#eab308',
  GREEN: '#22c55e',
  BLUE: '#3b82f6',
};

const TRIAGE_LABELS: Record<string, string> = {
  RED: 'Emergencia',
  ORANGE: 'Muito Urgente',
  YELLOW: 'Urgente',
  GREEN: 'Pouco Urgente',
  BLUE: 'Nao Urgente',
};

const OUTCOME_LABELS: Record<string, string> = {
  ALTA: 'Alta',
  INTERNACAO: 'Internacao',
  TRANSFERENCIA: 'Transferencia',
  OBITO: 'Obito',
  EVASAO: 'Evasao',
};

export default function GestoraDashboardPage() {
  const [data, setData] = useState<GestoraDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await dashboardService.getGestora(startDate, endDate);
      setData(result);
    } catch (error) {
      toast.error('Erro ao carregar dashboard gerencial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triagePieData = data
    ? Object.entries(data.triageColorCounts).map(([key, value]) => ({
        name: TRIAGE_LABELS[key] || key,
        value,
        fill: TRIAGE_COLORS[key] || '#94a3b8',
      }))
    : [];

  const outcomePieData = data
    ? Object.entries(data.outcomeCounts).map(([key, value]) => ({
        name: OUTCOME_LABELS[key] || key,
        value,
      }))
    : [];

  const OUTCOME_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ef4444', '#94a3b8'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Gerencial</h1>
          <p className="text-muted-foreground">Indicadores operacionais e analytics</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">De</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ate</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
          </div>
          <Button onClick={loadData} disabled={loading} size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Carregando...</p>
      ) : !data ? (
        <p className="text-muted-foreground text-center py-12">Sem dados disponiveis</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total no Periodo</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalPeriod}</div>
                <p className="text-xs text-muted-foreground">atendimentos registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Em Andamento Agora</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.ongoingNow}</div>
                <p className="text-xs text-muted-foreground">triagem/atendimento/exames</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Media Diaria</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.dailyCounts.length > 0
                    ? (data.totalPeriod / data.dailyCounts.length).toFixed(1)
                    : '0'}
                </div>
                <p className="text-xs text-muted-foreground">atendimentos/dia</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atendimentos por Dia</CardTitle>
                <CardDescription>Volume diario no periodo selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {data.dailyCounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Sem dados no periodo</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.dailyCounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B8E6F" name="Atendimentos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Complaints */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Queixas Mais Comuns</CardTitle>
                <CardDescription>Top 10 motivos de atendimento</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topComplaints.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Sem dados no periodo</p>
                ) : (
                  <div className="space-y-3">
                    {data.topComplaints.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm truncate flex-1 mr-4">{item.complaint}</span>
                        <Badge variant="secondary" className="shrink-0">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Triage Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classificacao de Risco</CardTitle>
                <CardDescription>Distribuicao por cor Manchester</CardDescription>
              </CardHeader>
              <CardContent>
                {triagePieData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Sem dados de triagem</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={triagePieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                           outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {triagePieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Outcome Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Desfechos Clinicos</CardTitle>
                <CardDescription>Distribuicao de resultados dos atendimentos</CardDescription>
              </CardHeader>
              <CardContent>
                {outcomePieData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Sem dados de desfecho</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={outcomePieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                           outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                        {outcomePieData.map((_, idx) => (
                          <Cell key={idx} fill={OUTCOME_COLORS[idx % OUTCOME_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

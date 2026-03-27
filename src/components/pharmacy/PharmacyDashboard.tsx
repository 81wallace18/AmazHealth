import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { pharmacyService } from "@/services/pharmacyService";
import type { HorusDashboardSummary, HorusSnapshotSummary, PharmacyDashboardData, PharmacyStatistics } from "@/types/pharmacy";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Boxes, ClipboardCheck, DatabaseZap, RefreshCcw, TriangleAlert } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ChartConfig } from "@/components/ui/chart";

export function PharmacyDashboard() {
  const [summary, setSummary] = useState<PharmacyDashboardData | null>(null);
  const [stats, setStats] = useState<PharmacyStatistics | null>(null);
  const [horusSummary, setHorusSummary] = useState<HorusDashboardSummary | null>(null);
  const [horusSnapshot, setHorusSnapshot] = useState<HorusSnapshotSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setError(null);
        const [dashboardData, statistics] = await Promise.all([
          pharmacyService.getDashboardData(),
          pharmacyService.getStatistics()
        ]);
        setSummary(dashboardData);
        setStats(statistics);
        const [horusData, snapshot] = await Promise.allSettled([
          pharmacyService.getHorusDashboard(),
          pharmacyService.getHorusLatestSnapshot()
        ]);
        if (horusData.status === "fulfilled") {
          setHorusSummary(horusData.value);
        }
        if (snapshot.status === "fulfilled") {
          setHorusSnapshot(snapshot.value);
        }
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar o dashboard da farmácia.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const chartData = summary?.consumptionTrend ?? [];
  const recentPrescriptions = summary?.recentPrescriptions ?? [];

  const chartConfig: ChartConfig = {
    quantity: {
      label: "Unidades dispensadas",
      color: "hsl(var(--primary))"
    }
  };

  const formatDateTime = (isoDate: string) => {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
    return formatter.format(new Date(isoDate));
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading || !summary || !stats) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Carregando informações da farmácia...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Medicamentos ativos"
          value={summary.totalMedicines}
          icon={<Boxes className="h-5 w-5 text-primary" />}
        />
        <DashboardCard
          title="Itens para reposição"
          value={summary.medicinesNeedingReorder}
          icon={<ClipboardCheck className="h-5 w-5 text-amber-500" />}
        />
        <DashboardCard
          title="Alertas ativos"
          value={summary.inventoryAlerts}
          icon={<TriangleAlert className="h-5 w-5 text-red-500" />}
        />
        <DashboardCard
          title="Lotes críticos"
          value={stats.expired + stats.nearExpiry}
          icon={<Activity className="h-5 w-5 text-blue-500" />}
        />
      </div>

      {horusSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Runs HÓRUS"
            value={horusSummary.totalRuns}
            icon={<RefreshCcw className="h-5 w-5 text-primary" />}
          />
          <DashboardCard
            title="Itens na fila HÓRUS"
            value={(horusSummary.queueByStatus.APT ?? 0) + (horusSummary.queueByStatus.PENDING_REVIEW ?? 0) + (horusSummary.queueByStatus.BLOCKED ?? 0)}
            icon={<DatabaseZap className="h-5 w-5 text-blue-500" />}
          />
          <DashboardCard
            title="Mapeamentos pendentes"
            value={horusSummary.pendingMappings}
            icon={<TriangleAlert className="h-5 w-5 text-amber-500" />}
          />
          <DashboardCard
            title="Solicitações conflitantes"
            value={horusSummary.requestsConflicted}
            icon={<ClipboardCheck className="h-5 w-5 text-red-500" />}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status do Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary.stockByStatus).map(([status, value]) => (
              <StatusRow key={status} label={status} value={value} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estoque por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary.stockByCategory).map(([category, value]) => (
              <StatusRow key={category} label={category} value={value} />
            ))}
          </CardContent>
        </Card>
      </div>

      {horusSummary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Operação HÓRUS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatusRow label="Último status do sync" valueLabel={horusSummary.lastSyncStatus} />
              <StatusRow label="Solicitações recebidas" value={horusSummary.requestsReceived} />
              <StatusRow label="Aptas" value={horusSummary.queueByStatus.APT ?? 0} />
              <StatusRow label="Pendentes de revisão" value={horusSummary.queueByStatus.PENDING_REVIEW ?? 0} />
              <StatusRow label="Bloqueadas" value={horusSummary.queueByStatus.BLOCKED ?? 0} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot HÓRUS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatusRow label="Linhas importadas" value={horusSnapshot?.totalRows ?? horusSummary.totalSnapshotRows} />
              <StatusRow label="Quantidade total" value={Math.round(horusSnapshot?.totalQuantity ?? horusSummary.totalSnapshotQuantity)} />
              <StatusRow
                label="Último snapshot"
                valueLabel={horusSnapshot?.snapshotAt ? formatDateTime(horusSnapshot.snapshotAt) : "Sem snapshot"}
              />
              <StatusRow label="Alertas de fila" value={horusSummary.alertsByType.REVIEW_QUEUE ?? 0} />
              <StatusRow label="Alertas de mapeamento" value={horusSummary.alertsByType.PENDING_MAPPING ?? 0} />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Consumo (últimos 30 dias)</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {chartData.length ? (
              <ChartContainer config={chartConfig}>
                <LineChart data={chartData} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="quantity"
                    stroke="var(--color-quantity)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Ainda não há movimentações registradas.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescrições recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentPrescriptions.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                Nenhuma prescrição disponível para exibição.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPrescriptions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.code}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.doctorName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

function DashboardCard({ title, value, icon }: DashboardCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-full bg-muted p-3">{icon}</div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, valueLabel }: { label: string; value?: number; valueLabel?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{valueLabel ?? value ?? 0}</span>
      </div>
      <Separator className="my-2" />
    </div>
  );
}

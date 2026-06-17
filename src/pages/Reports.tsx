import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, Stethoscope, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { reportService } from "@/services/reportService";
import type { AttendanceReport, PharmacyReport, TriageReport } from "@/types/report";

const formatCount = (value?: number) => value ?? 0;

const STATUS_PT: Record<string, string> = {
  CREATED: 'Criado',
  TRIAGEM: 'Triagem',
  AVALIACAO: 'Avaliação',
  DESFECHO: 'Desfecho',
  FECHADO: 'Fechado',
  IN_PROGRESS: 'Em andamento',
  DISCHARGED: 'Alta',
  ADMITTED: 'Internado',
  TRANSFERRED: 'Transferido',
  DECEASED: 'Óbito',
  ESCAPED: 'Evasão',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  CANCELED: 'Cancelado',
  WAITING_EXAM: 'Aguardando exame',
  WAITING_DOCTOR: 'Aguardando médico',
  EXAM_COMPLETED: 'Exame concluído',
  TRIAGED: 'Triado',
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

const TRIAGE_COLOR_PT: Record<string, string> = {
  BLUE: "Azul",
  GREEN: "Verde",
  YELLOW: "Amarelo",
  ORANGE: "Laranja",
  RED: "Vermelho",
};

const translateStatus = (status: string) =>
  STATUS_PT[status.toUpperCase().replace(/ /g, '_')] ?? status.replace(/_/g, ' ').toLowerCase();

const translateTriageColor = (color: string) =>
  TRIAGE_COLOR_PT[color.toUpperCase()] ?? color.toLowerCase();

const getStatusSortValue = ([, count]: [string, number]) => count;

interface MetricBarRow {
  key: string;
  label: string;
  value: number;
  unit: string;
}

function HorizontalMetricList({ items }: { items: MetricBarRow[] }) {
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <div className="space-y-2.5 text-sm">
      {items.map((item) => {
        const percentage = maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0;

        return (
          <div key={item.key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className={item.value > 0 ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
              <span className="tabular-nums font-semibold">{item.value}</span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              aria-label={`${item.label}: ${item.value} ${item.unit}`}
              role="img"
            >
              <div
                className={item.value > 0 ? "h-full rounded-full bg-primary" : "h-full rounded-full bg-muted-foreground/20"}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Reports() {
  const [triageReport, setTriageReport] = useState<TriageReport | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReport | null>(null);
  const [pharmacyReport, setPharmacyReport] = useState<PharmacyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportService.getTriage(),
      reportService.getAttendance(),
      reportService.getPharmacy()
    ])
      .then(([triage, attendance, pharmacy]) => {
        setTriageReport(triage);
        setAttendanceReport(attendance);
        setPharmacyReport(pharmacy);
      })
      .finally(() => setLoading(false));
  }, []);

  const triageTotals = useMemo(() => {
    const statusCounts = triageReport?.statusCounts ?? {};
    const colorCounts = triageReport?.colorCounts ?? {};
    const colorEntries = Object.entries(colorCounts)
      .sort((current, next) => getStatusSortValue(next) - getStatusSortValue(current))
      .map(([color, count]) => ({
        key: color,
        label: translateTriageColor(color),
        value: count,
        unit: count === 1 ? "triagem" : "triagens"
      }));

    return {
      total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      colorEntries
    };
  }, [triageReport]);

  const attendanceTotals = useMemo(() => {
    const statusCounts = attendanceReport?.statusCounts ?? {};
    const statusEntries = Object.entries(statusCounts).sort((current, next) =>
      getStatusSortValue(next) - getStatusSortValue(current)
    );

    return {
      total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      statusEntries: statusEntries.map(([status, count]) => ({
        key: status,
        label: translateStatus(status),
        value: count,
        unit: count === 1 ? "atendimento" : "atendimentos"
      }))
    };
  }, [attendanceReport]);

  const pharmacyTotals = useMemo(() => {
    const lowStockCount = formatCount(pharmacyReport?.lowStockCount);
    const nearExpiryCount = formatCount(pharmacyReport?.nearExpiryCount);
    const expiredCount = formatCount(pharmacyReport?.expiredCount);
    const items = [
      {
        key: "low-stock",
        label: "Estoque crítico",
        value: lowStockCount,
        unit: lowStockCount === 1 ? "item" : "itens"
      },
      {
        key: "near-expiry",
        label: "Próximo da validade",
        value: nearExpiryCount,
        unit: nearExpiryCount === 1 ? "item" : "itens"
      },
      {
        key: "expired",
        label: "Vencidos",
        value: expiredCount,
        unit: expiredCount === 1 ? "item" : "itens"
      }
    ].sort((current, next) => next.value - current.value);

    return {
      total: lowStockCount + nearExpiryCount + expiredCount,
      items
    };
  }, [pharmacyReport]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-40 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Indicadores operacionais e visão rápida do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triagem</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-primary">{formatCount(triageTotals.total)}</div>
              <div className="text-sm text-muted-foreground">total</div>
            </div>
            <HorizontalMetricList items={triageTotals.colorEntries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-primary">{formatCount(attendanceTotals.total)}</div>
              <div className="text-sm text-muted-foreground">total</div>
            </div>
            <HorizontalMetricList items={attendanceTotals.statusEntries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farmácia</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-primary">{formatCount(pharmacyTotals.total)}</div>
              <div className="text-sm text-muted-foreground">alertas</div>
            </div>
            <HorizontalMetricList items={pharmacyTotals.items} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle>Observações</CardTitle>
            <p className="text-sm text-muted-foreground">
              Indicadores atualizados em tempo real conforme o volume de atendimentos.
            </p>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

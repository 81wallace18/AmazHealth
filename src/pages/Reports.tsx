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
};

const translateStatus = (status: string) =>
  STATUS_PT[status] ?? status.replace(/_/g, ' ').toLowerCase();

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
    return {
      total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      statusCounts,
      colorCounts
    };
  }, [triageReport]);

  const attendanceTotals = useMemo(() => {
    const statusCounts = attendanceReport?.statusCounts ?? {};
    return {
      total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
      statusCounts
    };
  }, [attendanceReport]);

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
            <div className="text-2xl font-bold text-primary">{formatCount(triageTotals.total)}</div>
            <div className="text-sm text-muted-foreground">total de triagens registradas</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(triageTotals.colorCounts).map(([color, count]) => (
                <div key={color} className="flex items-center justify-between">
                  <span className="capitalize">{color}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-primary">{formatCount(attendanceTotals.total)}</div>
            <div className="text-sm text-muted-foreground">total de atendimentos</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(attendanceTotals.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span>{translateStatus(status)}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farmácia</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-primary">{formatCount(pharmacyReport?.lowStockCount)}</div>
            <div className="text-sm text-muted-foreground">itens com estoque crítico</div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Próximo da validade</span>
                <span className="font-semibold">{formatCount(pharmacyReport?.nearExpiryCount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vencidos</span>
                <span className="font-semibold">{formatCount(pharmacyReport?.expiredCount)}</span>
              </div>
            </div>
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

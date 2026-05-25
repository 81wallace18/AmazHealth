import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  DatabaseZap,
  Loader2,
  RefreshCw,
  SplitSquareHorizontal,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pharmacyService } from "@/services/pharmacyService";
import type { PharmacyParityReportId, PharmacyParityReportResponse } from "@/types/pharmacy";

const postIngestionReportIds: PharmacyParityReportId[] = [
  "HORUS_INGESTION_COVERAGE",
  "HORUS_OPERATIONAL_DIVERGENCES",
  "SECTOR_CONSUMPTION",
  "SECTOR_COST_INFORMATION",
];

const reportIcons: Partial<Record<PharmacyParityReportId, JSX.Element>> = {
  HORUS_INGESTION_COVERAGE: <DatabaseZap className="h-5 w-5 text-blue-600" />,
  HORUS_OPERATIONAL_DIVERGENCES: <TriangleAlert className="h-5 w-5 text-amber-600" />,
  SECTOR_CONSUMPTION: <SplitSquareHorizontal className="h-5 w-5 text-emerald-600" />,
  SECTOR_COST_INFORMATION: <CircleDollarSign className="h-5 w-5 text-violet-600" />,
};

const statusLabels: Record<string, string> = {
  LOCAL_ONLY: "Somente local",
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  RECONCILED: "Conciliado",
  DIVERGENT: "Divergente",
};

const summaryLabels: Record<string, string> = {
  runs: "Execuções",
  artifacts: "Artefatos",
  snapshots: "Snapshots",
  importRows: "Linhas",
  latestRunStatus: "Último sync",
  divergences: "Divergências",
  openOrActionable: "Acionáveis",
  requestedQuantity: "Solicitado",
  fulfilledQuantity: "Atendido",
  pendingQuantity: "Pendente",
  informationalCost: "Custo info.",
  missingCostItems: "Sem custo",
  costGap: "Lacuna",
};

function formatValue(value: unknown, key?: string) {
  if (value === null || value === undefined) return "Sem registro";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "number") {
    const options = key?.toLowerCase().includes("cost")
      ? { style: "currency", currency: "BRL", maximumFractionDigits: 2 }
      : { maximumFractionDigits: 2 };
    return new Intl.NumberFormat("pt-BR", options).format(value);
  }
  if (typeof value === "string") return value;
  return "";
}

function relevantSummary(report: PharmacyParityReportResponse) {
  return Object.entries(report.summary ?? {})
    .filter(([key, value]) => summaryLabels[key] && typeof value !== "object")
    .slice(0, 6);
}

function rowColumns(rows: Array<Record<string, unknown>>) {
  const keys = new Set<string>();
  rows.slice(0, 5).forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });
  return Array.from(keys).filter((key) => !["rawPayload", "storagePath", "localPath"].includes(key)).slice(0, 6);
}

function statusVariant(status: string) {
  if (status === "DIVERGENT") return "destructive";
  if (status === "RECONCILED") return "secondary";
  return "outline";
}

export function PharmacyPostIngestionReports() {
  const [reports, setReports] = useState<PharmacyParityReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pharmacyService.getParityReports();
      setReports(response.filter((report) => postIngestionReportIds.includes(report.reportId as PharmacyParityReportId)));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Não foi possível carregar os relatórios pós-ingestão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    return {
      reports: reports.length,
      divergent: reports.filter((report) => report.reconciliationStatus === "DIVERGENT").length,
      partial: reports.filter((report) => report.reconciliationStatus === "PARTIAL").length,
      gaps: reports.filter((report) => report.summary?.costGap === true || Number(report.summary?.missingCostItems ?? 0) > 0).length,
    };
  }, [reports]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Relatórios Pós-Ingestão</h2>
          <p className="text-sm text-muted-foreground">
            Cobertura de ingestão, divergências, consumo por setor e lacunas de custo.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando relatórios...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-md border py-12 text-center text-sm text-muted-foreground">
          Nenhum relatório pós-ingestão disponível.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Relatórios" value={totals.reports} detail="Contratos pós-ingestão" icon={<BarChart3 className="h-5 w-5 text-primary" />} />
            <MetricCard title="Divergentes" value={totals.divergent} detail="Exigem análise" icon={<TriangleAlert className="h-5 w-5 text-red-600" />} />
            <MetricCard title="Parciais" value={totals.partial} detail="Com pendência operacional" icon={<RefreshCw className="h-5 w-5 text-amber-600" />} />
            <MetricCard title="Lacunas" value={totals.gaps} detail="Principalmente custo" icon={<CircleDollarSign className="h-5 w-5 text-violet-600" />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {reports.map((report) => (
              <ReportCard key={report.reportId} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: JSX.Element;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ReportCard({ report }: { report: PharmacyParityReportResponse }) {
  const summary = relevantSummary(report);
  const columns = rowColumns(report.rows ?? []);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {reportIcons[report.reportId as PharmacyParityReportId] ?? <BarChart3 className="h-5 w-5" />}
            {report.displayName}
          </CardTitle>
          <Badge variant={statusVariant(report.reconciliationStatus)}>
            {statusLabels[report.reconciliationStatus] ?? report.reconciliationStatus}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {report.localSources.slice(0, 4).map((source) => (
            <Badge key={source} variant="outline">{source}</Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map(([key, value]) => (
            <div key={key} className="rounded-md border px-3 py-2">
              <div className="text-xs text-muted-foreground">{summaryLabels[key]}</div>
              <div className="text-sm font-medium">{formatValue(value, key)}</div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">{report.knownGap}</p>

        {columns.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{summaryLabels[column] ?? column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.slice(0, 8).map((row, index) => (
                  <TableRow key={`${report.reportId}-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column}>{formatValue(row[column], column)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border py-6 text-center text-sm text-muted-foreground">
            Sem linhas detalhadas para este relatório.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

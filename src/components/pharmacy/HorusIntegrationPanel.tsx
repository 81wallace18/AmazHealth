import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  DatabaseZap,
  Link2,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { pharmacyService } from "@/services/pharmacyService";
import type {
  HorusDashboardSummary,
  HorusExternalMedicineMapping,
  HorusSnapshotSummary,
  HorusStockDivergence,
  HorusSyncArtifact,
} from "@/types/pharmacy";

const syncStatusLabels: Record<string, string> = {
  SUCCESS: "Sincronizado",
  PARTIAL: "Parcial",
  FAILED: "Falhou",
  RUNNING: "Em execução",
  PENDING: "Pendente",
  NEVER_RUN: "Sem execução",
};

const mappingStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  REVIEW: "Revisão",
  MATCHED: "Vinculado",
  IGNORED: "Ignorado",
};

function formatDateTime(value?: string | null) {
  if (!value) return "Sem registro";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function numberLabel(value?: number | null) {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

export function HorusIntegrationPanel() {
  const [summary, setSummary] = useState<HorusDashboardSummary | null>(null);
  const [snapshot, setSnapshot] = useState<HorusSnapshotSummary | null>(null);
  const [artifacts, setArtifacts] = useState<HorusSyncArtifact[]>([]);
  const [mappings, setMappings] = useState<HorusExternalMedicineMapping[]>([]);
  const [divergences, setDivergences] = useState<HorusStockDivergence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardResult, snapshotResult, mappingsResult, divergencesResult] = await Promise.allSettled([
        pharmacyService.getHorusDashboard(),
        pharmacyService.getHorusLatestSnapshot(),
        pharmacyService.getHorusMappings({ status: "PENDING" }),
        pharmacyService.getHorusDivergences(),
      ]);

      if (dashboardResult.status === "fulfilled") {
        setSummary(dashboardResult.value);
      }
      if (snapshotResult.status === "fulfilled") {
        setSnapshot(snapshotResult.value);
        if (snapshotResult.value?.runId) {
          const runArtifacts = await pharmacyService.getHorusArtifacts(snapshotResult.value.runId).catch(() => []);
          setArtifacts(runArtifacts);
        } else {
          setArtifacts([]);
        }
      }
      if (mappingsResult.status === "fulfilled") {
        setMappings(mappingsResult.value);
      }
      if (divergencesResult.status === "fulfilled") {
        setDivergences(divergencesResult.value);
      }

      const rejected = [dashboardResult, snapshotResult, mappingsResult, divergencesResult].some(
        (result) => result.status === "rejected"
      );
      if (rejected) {
        setError("Alguns dados da integração HÓRUS não puderam ser carregados.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const queueTotal = useMemo(() => {
    return Object.values(summary?.queueByStatus ?? {}).reduce((total, value) => total + value, 0);
  }, [summary]);

  const criticalCount = divergences.length + mappings.length + (summary?.requestsConflicted ?? 0);
  const syncStatus = summary?.lastSyncStatus ?? "NEVER_RUN";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Integração HÓRUS</h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento operacional da ingestão, conciliação e pendências do provedor legado.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando integração HÓRUS...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Último sync"
              value={syncStatusLabels[syncStatus] ?? syncStatus}
              detail={formatDateTime(summary?.lastSyncAt)}
              icon={syncStatus === "SUCCESS" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <RefreshCw className="h-5 w-5 text-amber-600" />}
            />
            <MetricCard
              title="Snapshot importado"
              value={`${numberLabel(snapshot?.totalRows ?? summary?.totalSnapshotRows)} linhas`}
              detail={`${numberLabel(snapshot?.totalQuantity ?? summary?.totalSnapshotQuantity)} unidades`}
              icon={<Boxes className="h-5 w-5 text-primary" />}
            />
            <MetricCard
              title="Fila externa"
              value={queueTotal}
              detail={`${summary?.queueByStatus.PENDING_REVIEW ?? 0} em revisão`}
              icon={<DatabaseZap className="h-5 w-5 text-blue-600" />}
            />
            <MetricCard
              title="Pendências"
              value={criticalCount}
              detail={`${mappings.length} mapeamentos, ${divergences.length} divergências`}
              icon={<TriangleAlert className="h-5 w-5 text-red-600" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TriangleAlert className="h-4 w-4" />
                  Divergências do Último Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {divergences.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-muted-foreground">Nenhuma divergência operacional detectada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Motivos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {divergences.slice(0, 8).map((item) => (
                          <TableRow key={item.rowId}>
                            <TableCell className="font-medium">{item.productName || "Sem nome"}</TableCell>
                            <TableCell>{item.batchNumber || "Sem lote"}</TableCell>
                            <TableCell>{numberLabel(item.quantity)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {item.divergenceTypes.map((type) => (
                                  <Badge key={type} variant="secondary">{type}</Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Link2 className="h-4 w-4" />
                    Mapeamentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum produto externo aguardando vínculo.</p>
                  ) : (
                    mappings.slice(0, 5).map((mapping) => (
                      <div key={mapping.id} className="rounded-md border p-3">
                        <div className="text-sm font-medium">{mapping.externalProductName || "Sem nome"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {mapping.externalProgramName || "sem programa"} · {mapping.externalUnitName || "sem unidade"}
                        </div>
                        <Badge className="mt-2" variant="outline">
                          {mappingStatusLabels[mapping.mappingStatus] ?? mapping.mappingStatus}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Artefatos Auditáveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {artifacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem artefatos registrados para o snapshot atual.</p>
                  ) : (
                    artifacts.map((artifact) => (
                      <div key={artifact.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{artifact.artifactType}</p>
                          <p className="truncate text-xs text-muted-foreground">{artifact.originalFilename || artifact.mimeType || "arquivo sanitizado"}</p>
                        </div>
                        <Badge variant="secondary">{artifact.sizeBytes ? `${Math.ceil(artifact.sizeBytes / 1024)} KB` : "sem tamanho"}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
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
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

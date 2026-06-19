import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { pharmacyService } from "@/services/pharmacyService";
import type {
  PharmacyCorrectionResponse,
  PharmacyExternalDispenseQueueResult,
  PharmacyExternalTaskResponse,
  PharmacyParityReportResponse,
  PharmacyReceivingResponse,
  PharmacyReplenishmentDestinationType,
  PharmacyReplenishmentResponse
} from "@/types/pharmacy";
import { ClipboardCheck, FileBarChart2, ListChecks, Plus, RefreshCw, RotateCcw, ShieldAlert, Truck } from "lucide-react";

type LoadState = {
  requests: PharmacyReplenishmentResponse[];
  externalTasks: PharmacyExternalTaskResponse[];
  receivings: PharmacyReceivingResponse[];
  queue: PharmacyExternalDispenseQueueResult | null;
  corrections: PharmacyCorrectionResponse[];
  reports: PharmacyParityReportResponse[];
};

const emptyState: LoadState = {
  requests: [],
  externalTasks: [],
  receivings: [],
  queue: null,
  corrections: [],
  reports: []
};

export function CanonicalPharmacyOperations() {
  const { user } = useAuth();
  const [data, setData] = useState<LoadState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    authorStaffId: "",
    destinationType: "EMERGENCY" as PharmacyReplenishmentDestinationType,
    destinationDepartment: "Emergência",
    priority: "NORMAL",
    justification: "",
    requestNote: "",
    medicineId: "",
    requestedQuantity: "1"
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requests, externalTasks, receivings, queue, corrections, reports] = await Promise.all([
        pharmacyService.getReplenishmentRequests(),
        pharmacyService.getExternalTasks({ provider: "HORUS_LEGACY" }),
        pharmacyService.getReceivings({ status: "PENDING_CONFERENCE" }),
        pharmacyService.getExternalDispenseQueue({ provider: "HORUS_LEGACY" }),
        pharmacyService.getCorrections(),
        pharmacyService.getParityReports()
      ]);
      setData({ requests, externalTasks, receivings, queue, corrections, reports });
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar a operação farmacêutica canônica.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (user?.staffId) {
      setForm((current) => ({ ...current, authorStaffId: current.authorStaffId || user.staffId || "" }));
    }
  }, [user?.staffId]);

  const createSetorialRequest = async () => {
    const authorStaffId = form.authorStaffId.trim() || user?.staffId;
    const medicineId = form.medicineId.trim();
    const quantity = Number(form.requestedQuantity);
    if (!authorStaffId || !medicineId || !Number.isFinite(quantity) || quantity <= 0) {
      setError("Informe profissional, medicamento e quantidade válida para criar a solicitação setorial.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await pharmacyService.createReplenishmentRequest({
        authorStaffId,
        operatorStaffId: user?.staffId ?? null,
        initialStatus: "SUBMITTED_LOCAL",
        destination: form.destinationDepartment.trim(),
        destinationType: form.destinationType,
        destinationDepartment: form.destinationDepartment.trim(),
        priority: form.priority.trim() || "NORMAL",
        justification: form.justification.trim() || null,
        requestNote: form.requestNote.trim() || null,
        items: [{ medicineId, requestedQuantity: quantity }]
      });
      setForm((current) => ({ ...current, medicineId: "", requestedQuantity: "1", requestNote: "", justification: "" }));
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Não foi possível criar a solicitação setorial.");
    } finally {
      setCreating(false);
    }
  };

  const confirmTask = async (task: PharmacyExternalTaskResponse) => {
    const operatorStaffId = window.prompt("ID do operador responsável");
    if (!operatorStaffId) return;
    await pharmacyService.confirmExternalTask(task.id, {
      provider: task.provider,
      operatorStaffId,
      confirmedAt: new Date().toISOString(),
      evidenceType: "MANUAL_SCREEN",
      note: "Confirmação operacional pela tela de farmácia"
    });
    await load();
  };

  const reviewQueueItem = async (id: string) => {
    const operatorStaffId = window.prompt("ID do operador responsável");
    if (!operatorStaffId) return;
    await pharmacyService.markExternalDispenseManualReview(id, {
      operatorStaffId,
      reason: "Revisão manual pela tela de farmácia"
    });
    await load();
  };

  const fulfillRequestItem = async (request: PharmacyReplenishmentResponse) => {
    const item = request.items.find((candidate) => (candidate.pendingQuantity ?? candidate.requestedQuantity) > 0);
    if (!item) return;
    const operatorStaffId = user?.staffId || window.prompt("ID do operador responsável");
    if (!operatorStaffId) return;
    const quantityText = window.prompt("Quantidade atendida", String(item.pendingQuantity ?? item.requestedQuantity));
    const fulfilledQuantity = Number(quantityText);
    if (!Number.isFinite(fulfilledQuantity) || fulfilledQuantity < 0) return;
    await pharmacyService.fulfillReplenishmentItem(request.id, item.id, {
      operatorStaffId,
      fulfilledQuantity
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Operação canônica</h2>
          <p className="text-sm text-muted-foreground">Solicitações, Hórus, recebimentos, correções e relatórios locais</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Solicitação setorial
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Destino</Label>
            <Select
              value={form.destinationType}
              onValueChange={(value) => setForm((current) => ({ ...current, destinationType: value as PharmacyReplenishmentDestinationType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMERGENCY">Emergência</SelectItem>
                <SelectItem value="DENTISTRY">Odontologia</SelectItem>
                <SelectItem value="PHARMACY">Farmácia</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Departamento</Label>
            <Input value={form.destinationDepartment} onChange={(event) => setForm((current) => ({ ...current, destinationDepartment: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Medicamento</Label>
            <Input value={form.medicineId} onChange={(event) => setForm((current) => ({ ...current, medicineId: event.target.value }))} placeholder="ID do medicamento" />
          </div>
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input type="number" min="0" step="0.01" value={form.requestedQuantity} onChange={(event) => setForm((current) => ({ ...current, requestedQuantity: event.target.value }))} />
          </div>
          {!user?.staffId && (
            <div className="space-y-2">
              <Label>Profissional solicitante</Label>
              <Input value={form.authorStaffId} onChange={(event) => setForm((current) => ({ ...current, authorStaffId: event.target.value }))} placeholder="ID do profissional" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Input value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Justificativa</Label>
            <Textarea value={form.justification} onChange={(event) => setForm((current) => ({ ...current, justification: event.target.value }))} rows={2} />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <Label>Observação</Label>
            <Textarea value={form.requestNote} onChange={(event) => setForm((current) => ({ ...current, requestNote: event.target.value }))} rows={2} />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void createSetorialRequest()} disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              Criar solicitação
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Solicitações" icon={<ListChecks className="h-5 w-5" />} value={data.requests.length} loading={loading}>
          {data.requests.slice(0, 4).map((request) => (
            <div key={request.id} className="space-y-2 rounded-md border p-3">
              <Row
                primary={request.destinationDepartment || request.destination || request.id}
                secondary={`${request.destinationType || "OTHER"} · ${request.priority || "NORMAL"}`}
                status={request.status}
              />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {request.items.map((item) => (
                  <Badge key={item.id} variant="outline">
                    pendente {item.pendingQuantity ?? 0}/{item.requestedQuantity}
                  </Badge>
                ))}
              </div>
              {request.items.some((item) => (item.pendingQuantity ?? item.requestedQuantity) > 0) && (
                <Button variant="outline" size="sm" onClick={() => void fulfillRequestItem(request)}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Atender item
                </Button>
              )}
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title="Tarefas Hórus" icon={<Truck className="h-5 w-5" />} value={data.externalTasks.length} loading={loading}>
          {data.externalTasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <Row primary={task.localReferenceType} secondary={task.statusReason || task.localReferenceId} status={task.status} />
              {task.status !== "CONFIRMED" && task.status !== "DISCARDED" && (
                <Button variant="outline" size="sm" onClick={() => void confirmTask(task)}>
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title="Recebimentos" icon={<ClipboardCheck className="h-5 w-5" />} value={data.receivings.length} loading={loading}>
          {data.receivings.slice(0, 4).map((receiving) => (
            <Row key={receiving.id} primary={receiving.requestId} secondary={`${receiving.items.length} item(ns)`} status={receiving.status} />
          ))}
        </SummaryCard>

        <SummaryCard title="Fila diária" icon={<RotateCcw className="h-5 w-5" />} value={data.queue?.items.length ?? 0} loading={loading}>
          <div className="mb-3 flex flex-wrap gap-2">
            {Object.entries(data.queue?.statusCounts ?? {}).map(([status, count]) => (
              <Badge key={status} variant="secondary">{status}: {count}</Badge>
            ))}
          </div>
          {data.queue?.items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <Row primary={item.localReferenceType} secondary={item.errorMessage || item.localReferenceId} status={item.status} />
              <Button variant="outline" size="sm" onClick={() => void reviewQueueItem(item.id)}>
                <ShieldAlert className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </SummaryCard>

        <SummaryCard title="Correções" icon={<ShieldAlert className="h-5 w-5" />} value={data.corrections.length} loading={loading}>
          {data.corrections.slice(0, 4).map((correction) => (
            <Row key={correction.id} primary={correction.type} secondary={correction.reason} status={correction.status} />
          ))}
        </SummaryCard>

        <SummaryCard title="Relatórios" icon={<FileBarChart2 className="h-5 w-5" />} value={data.reports.length} loading={loading}>
          {data.reports.slice(0, 4).map((report) => (
            <Row key={report.reportId} primary={report.displayName} secondary={report.knownGap} status={report.dataOrigin} />
          ))}
        </SummaryCard>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  icon,
  value,
  loading,
  children
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">{icon}{title}</span>
          <Badge variant="outline">{loading ? "..." : value}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56 pr-3">
          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : value === 0 ? (
              <div className="text-sm text-muted-foreground">Sem registros no filtro atual.</div>
            ) : (
              children
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function Row({ primary, secondary, status }: { primary: string; secondary?: string | null; status: string }) {
  return (
    <div className="min-w-0 rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-sm font-medium">{primary}</p>
        <Badge variant="secondary">{status}</Badge>
      </div>
      {secondary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{secondary}</p>}
    </div>
  );
}

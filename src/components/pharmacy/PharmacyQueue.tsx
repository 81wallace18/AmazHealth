import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Stethoscope, Eye, CheckCircle2, XCircle } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import prescriptionService from "@/services/prescriptionService";
import type { Prescription, PrescriptionStatus } from "@/types/prescription";
import type { HorusQueueItem, HorusQueueStatus } from "@/types/pharmacy";
import { useToast } from "@/hooks/use-toast";
import { DispensationForm } from "./DispensationForm";
import { Label } from "@/components/ui/label";
import { useCapabilities } from "@/auth/useCapabilities";
import { useOrgConfig, INTEGRATIONS } from "@/hooks/useOrgConfig";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusLabels: Record<PrescriptionStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  DISPENSED: "Dispensada",
  REJECTED: "Recusada",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada"
};

interface PharmacyQueueProps {
  onDispensed?: () => void;
}

export function PharmacyQueue({ onDispensed }: PharmacyQueueProps) {
  const capabilities = useCapabilities();
  const { hasIntegration } = useOrgConfig();
  const horusEnabled = hasIntegration(INTEGRATIONS.HORUS_PHARMACY);
  const [queueMode, setQueueMode] = useState<"LOCAL" | "HORUS">("LOCAL");
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | "ALL">("ACTIVE");
  const [pending, setPending] = useState<Prescription[]>([]);
  const [horusStatusFilter, setHorusStatusFilter] = useState<HorusQueueStatus | "ALL">("ALL");
  const [horusPending, setHorusPending] = useState<HorusQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [selectedHorus, setSelectedHorus] = useState<HorusQueueItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [refusing, setRefusing] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const [reviewingHorus, setReviewingHorus] = useState(false);
  const { toast } = useToast();

  const loadQueue = async () => {
    setLoading(true);
    try {
      setError(null);
      if (queueMode === "LOCAL") {
        const response = await pharmacyService.getPendingPrescriptions({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          page: 0,
          size: 50
        });
        setPending(response.content);
      } else {
        const response = await pharmacyService.getHorusQueue({
          status: horusStatusFilter === "ALL" ? undefined : horusStatusFilter,
          page: 0,
          size: 50
        });
        setHorusPending(response.content);
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar a fila da farmácia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [queueMode, statusFilter, horusStatusFilter]);

  const handleOpenDetails = (prescription: Prescription) => {
    setRefuseReason("");
    setSelected(prescription);
    setShowDetails(true);
  };

  const handleOpenDispense = (prescription: Prescription) => {
    if (!capabilities.canDispenseMedication) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para dispensar prescrições.",
        variant: "destructive",
      });
      return;
    }
    setRefuseReason("");
    setSelected(prescription);
    setShowDispense(true);
  };

  const handleRefuse = async () => {
    if (!selected) return;
    if (!capabilities.canDispenseMedication) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para validar/recusar prescrições.",
        variant: "destructive",
      });
      return;
    }
    if (!refuseReason || refuseReason.trim().length < 5) {
      toast({
        title: "Informe o motivo",
        description: "Digite um motivo com pelo menos 5 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setRefusing(true);
    try {
      const payload = {
        approved: false,
        observations: refuseReason,
        notes: refuseReason,
        items: selected.items.map((item) => ({
          itemId: item.id!,
          medicineId: item.medicineId,
          quantity: 0,
          batchNumber: item.batchNumber ?? "N/A",
          expirationDate: new Date().toISOString(),
          dispensationStatus: "REFUSED",
          observations: refuseReason,
          prescriptionId: selected.id,
          notes: refuseReason
        }))
      };
      await prescriptionService.validateByPharmacy(selected.id, payload);
      toast({
        title: "Prescrição recusada",
        description: "A prescrição foi marcada como recusada."
      });
      setShowDetails(false);
      setSelected(null);
      setRefuseReason("");
      await loadQueue();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Erro ao recusar prescrição";
      toast({
        title: "Falha ao recusar",
        description: message,
        variant: "destructive"
      });
    } finally {
      setRefusing(false);
    }
  };

  const prescriptionsToShow = useMemo(() => pending, [pending]);

  const handleHorusReview = async (decision: "APPROVE" | "BLOCK" | "DEFER") => {
    if (!selectedHorus) return;
    setReviewingHorus(true);
    try {
      await pharmacyService.reviewHorusQueueItem(selectedHorus.id, {
        decision,
        notes: refuseReason || undefined
      });
      toast({
        title: "Fila HÓRUS atualizada",
        description: "A revisão humana foi registrada com sucesso."
      });
      setSelectedHorus(null);
      setRefuseReason("");
      await loadQueue();
    } catch (err: any) {
      toast({
        title: "Falha ao revisar item HÓRUS",
        description: err.message || "Não foi possível registrar a revisão.",
        variant: "destructive"
      });
    } finally {
      setReviewingHorus(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5" />
            Fila de Prescrições
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Prescrições aguardando validação farmacêutica e dispensação
          </p>
        </div>
        <div className="flex items-center gap-2">
          {horusEnabled && (
            <Tabs value={queueMode} onValueChange={(value) => setQueueMode(value as "LOCAL" | "HORUS")}>
              <TabsList>
                <TabsTrigger value="LOCAL">Prescrições locais</TabsTrigger>
                <TabsTrigger value="HORUS">Operação HÓRUS</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {queueMode === "LOCAL" ? (
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PrescriptionStatus | "ALL")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="ACTIVE">Ativas</SelectItem>
                <SelectItem value="DRAFT">Rascunhos</SelectItem>
                <SelectItem value="DISPENSED">Dispensadas</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select value={horusStatusFilter} onValueChange={(value) => setHorusStatusFilter(value as HorusQueueStatus | "ALL")}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Status HÓRUS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="APT">Aptos</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pendentes</SelectItem>
                <SelectItem value="BLOCKED">Bloqueados</SelectItem>
                <SelectItem value="SENT">Enviados</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={loadQueue}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <Alert variant="destructive" className="mx-4 mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando prescrições...
          </div>
        ) : queueMode === "LOCAL" && prescriptionsToShow.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma prescrição encontrada.</div>
        ) : queueMode === "HORUS" && horusPending.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Nenhum item operacional HÓRUS encontrado.</div>
        ) : (
          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {queueMode === "LOCAL" ? (
                    <>
                      <TableHead>Código</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueMode === "LOCAL" ? prescriptionsToShow.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-semibold">{prescription.prescriptionCode}</TableCell>
                    <TableCell>{prescription.patientName}</TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>{new Date(prescription.prescriptionDate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{statusLabels[prescription.status]}</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetails(prescription)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenDispense(prescription)}
                        disabled={!capabilities.canDispenseMedication}
                        title={!capabilities.canDispenseMedication ? "Você não tem permissão para dispensar" : ""}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar &amp; Dispensar
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : horusPending.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.patientName}</p>
                        <p className="text-xs text-muted-foreground">{item.patientIdentifier || "sem identificador"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.requestedItemName}</p>
                        <p className="text-xs text-muted-foreground">{item.mappedMedicineName || "sem mapeamento"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{item.candidateBatchNumber || "—"}</TableCell>
                    <TableCell>{item.availableQuantity ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.queueStatus}</Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRefuseReason("");
                          setSelectedHorus(item);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Revisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescrição {selected?.prescriptionCode}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <span><strong>Paciente:</strong> {selected.patientName}</span>
                <span><strong>Médico:</strong> {selected.doctorName}</span>
                <span><strong>Status:</strong> {statusLabels[selected.status]}</span>
                <span><strong>Observações:</strong> {selected.notes ?? "—"}</span>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-sm font-semibold mb-2">Itens</p>
                <ul className="space-y-2 text-sm">
                  {selected.items.map((item) => (
                    <li key={item.id ?? item.medicineId} className="border-b pb-2 last:border-0 last:pb-0">
                      <p className="font-medium">{item.medicineName}</p>
                      <p className="text-muted-foreground">
                        {item.dosage} • {item.frequency} • {item.duration}
                      </p>
                      <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refuse-reason">Motivo da recusa</Label>
                <Textarea
                  id="refuse-reason"
                  value={refuseReason}
                  onChange={(event) => setRefuseReason(event.target.value)}
                  placeholder="Ex: ausência de assinatura do prescritor..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Fechar
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    if (!selected) return;
                    setShowDetails(false);
                    handleOpenDispense(selected);
                  }}
                  disabled={!capabilities.canDispenseMedication}
                  title={!capabilities.canDispenseMedication ? "Você não tem permissão para dispensar" : ""}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar &amp; Dispensar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRefuse}
                  disabled={refusing || !capabilities.canDispenseMedication}
                  title={!capabilities.canDispenseMedication ? "Você não tem permissão para recusar" : ""}
                >
                  {refusing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Recusar prescrição
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedHorus} onOpenChange={(open) => !open && setSelectedHorus(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Operação HÓRUS</DialogTitle>
          </DialogHeader>
          {selectedHorus && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <span><strong>Paciente:</strong> {selectedHorus.patientName}</span>
                <span><strong>Solicitação:</strong> {selectedHorus.requestedItemName}</span>
                <span><strong>Status:</strong> {selectedHorus.queueStatus}</span>
                <span><strong>Médico:</strong> {selectedHorus.prescriberName || "—"}</span>
                <span><strong>Lote candidato:</strong> {selectedHorus.candidateBatchNumber || "—"}</span>
                <span><strong>Validade:</strong> {selectedHorus.candidateExpiryDate || "—"}</span>
                <span><strong>Saldo disponível:</strong> {selectedHorus.availableQuantity ?? "—"}</span>
              </div>

              {selectedHorus.decisionReasons && selectedHorus.decisionReasons.length > 0 && (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-semibold mb-2">Motivos da decisão</p>
                  <ul className="space-y-1">
                    {selectedHorus.decisionReasons.map((reason) => (
                      <li key={reason} className="text-muted-foreground">• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedHorus.blockedReason || selectedHorus.reviewNotes) && (
                <Alert>
                  <AlertDescription>
                    {selectedHorus.blockedReason || selectedHorus.reviewNotes}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="horus-review-notes">Notas da revisão</Label>
                <Textarea
                  id="horus-review-notes"
                  value={refuseReason}
                  onChange={(event) => setRefuseReason(event.target.value)}
                  placeholder="Informe o motivo da aprovação, bloqueio ou adiamento"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" disabled={reviewingHorus} onClick={() => handleHorusReview("DEFER")}>
                  Adiar
                </Button>
                <Button variant="destructive" disabled={reviewingHorus} onClick={() => handleHorusReview("BLOCK")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Bloquear
                </Button>
                <Button disabled={reviewingHorus} onClick={() => handleHorusReview("APPROVE")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DispensationForm
        open={capabilities.canDispenseMedication && showDispense}
        prescription={selected}
        onClose={() => setShowDispense(false)}
        onSuccess={async () => {
          await loadQueue();
          onDispensed?.();
        }}
      />
    </Card>
  );
}

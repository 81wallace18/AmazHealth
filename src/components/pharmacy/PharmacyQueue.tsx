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
import { useToast } from "@/hooks/use-toast";
import { DispensationForm } from "./DispensationForm";
import { Label } from "@/components/ui/label";

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
  const [statusFilter, setStatusFilter] = useState<PrescriptionStatus | "ALL">("ACTIVE");
  const [pending, setPending] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [refusing, setRefusing] = useState(false);
  const [showDispense, setShowDispense] = useState(false);
  const { toast } = useToast();

  const loadQueue = async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await pharmacyService.getPendingPrescriptions({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page: 0,
        size: 50
      });
      setPending(response.content);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar a fila da farmácia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [statusFilter]);

  const handleOpenDetails = (prescription: Prescription) => {
    setSelected(prescription);
    setShowDetails(true);
  };

  const handleOpenDispense = (prescription: Prescription) => {
    setSelected(prescription);
    setShowDispense(true);
  };

  const handleRefuse = async () => {
    if (!selected) return;
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
        ) : prescriptionsToShow.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma prescrição encontrada.</div>
        ) : (
          <ScrollArea className="h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptionsToShow.map((prescription) => (
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
                      <Button variant="default" size="sm" onClick={() => handleOpenDispense(prescription)}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar &amp; Dispensar
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
                    setShowDispense(true);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar &amp; Dispensar
                </Button>
                <Button variant="destructive" onClick={handleRefuse} disabled={refusing}>
                  {refusing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                  Recusar prescrição
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DispensationForm
        open={showDispense}
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

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, PackagePlus } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import type { MedicineStock } from "@/types/pharmacy";
import type { Prescription, PrescriptionItem } from "@/types/prescription";
import { useToast } from "@/hooks/use-toast";
import prescriptionService from "@/services/prescriptionService";

interface DispensationFormProps {
  open: boolean;
  prescription: Prescription | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemFormState {
  quantity: number;
  batchNumber: string;
  expirationDate?: string;
  observations?: string;
  stock: MedicineStock[];
}

export function DispensationForm({ open, prescription, onClose, onSuccess }: DispensationFormProps) {
  const [loading, setLoading] = useState(false);
  const [itemState, setItemState] = useState<Record<string, ItemFormState>>({});
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const items = useMemo(() => prescription?.items ?? [], [prescription]);

  useEffect(() => {
    if (!open || !prescription) {
      setItemState({});
      setError(null);
      return;
    }

    const loadStock = async () => {
      const nextState: Record<string, ItemFormState> = {};
      for (const item of prescription.items) {
        const stateKey = item.id ?? item.medicineId ?? item.medicineName;
        if (!item.medicineId) {
          nextState[stateKey] = {
            quantity: item.quantity,
            batchNumber: "",
            stock: []
          };
          continue;
        }
        try {
          const stockPage = await pharmacyService.getStockByMedicine(item.medicineId, { page: 0, size: 50 });
          nextState[stateKey] = {
            quantity: item.quantity,
            batchNumber: stockPage.content[0]?.batchNumber ?? "",
            expirationDate: stockPage.content[0]?.expiryDate,
            observations: "",
            stock: stockPage.content
          };
        } catch (err) {
          nextState[stateKey] = {
            quantity: item.quantity,
            batchNumber: "",
            stock: []
          };
        }
      }
      setItemState(nextState);
    };

    void loadStock();
  }, [open, prescription]);

  const handleChange = (item: PrescriptionItem, field: keyof ItemFormState, value: string | number) => {
    setItemState((prev) => ({
      ...prev,
      [item.id ?? item.medicineId ?? item.medicineName]: {
        ...prev[item.id ?? item.medicineId ?? item.medicineName],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!prescription) return;
    setLoading(true);
    setError(null);

    try {
      const payload = items.map((item) => {
        const state = itemState[item.id ?? item.medicineId ?? item.medicineName];
        if (!state || !state.batchNumber) {
          throw new Error(`Selecione o lote para ${item.medicineName}`);
        }

        const stock = state.stock.find((s) => s.batchNumber === state.batchNumber);
        if (!stock?.expiryDate) {
          throw new Error(`Lote inválido para ${item.medicineName}`);
        }

        return {
          itemId: item.id!,
          medicineId: item.medicineId,
          quantity: state.quantity,
          batchNumber: state.batchNumber,
          expirationDate: new Date(stock.expiryDate).toISOString(),
          dispensationStatus: "DISPENSED",
          observations: state.observations,
          prescriptionId: prescription.id,
          notes: state.observations
        };
      });

      await prescriptionService.validateByPharmacy(prescription.id, {
        approved: true,
        observations: "Dispensação registrada na farmácia.",
        notes: "",
        items: payload
      });
      toast({
        title: "Dispensação registrada",
        description: "A prescrição foi marcada como dispensada."
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Erro ao dispensar medicamentos";
      setError(message);
      toast({
        title: "Falha ao dispensar",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            Dispensar Prescrição {prescription?.prescriptionCode}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {items.map((item) => {
              const formState = itemState[item.id ?? item.medicineId ?? item.medicineName];
              const stockOptions = formState?.stock ?? [];

              return (
                <div key={item.id ?? item.medicineId} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.medicineName}</p>
                      <p className="text-sm text-muted-foreground">{item.dosage} • {item.frequency}</p>
                    </div>
                    <BadgeForMedicationType type={item.medicationType} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Lote *</Label>
                      <Select
                        value={formState?.batchNumber}
                        onValueChange={(value) => handleChange(item, "batchNumber", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={stockOptions.length === 0 ? "Sem estoque disponível" : "Selecione"} />
                        </SelectTrigger>
                        <SelectContent>
                          {stockOptions.map((stock) => (
                            <SelectItem key={stock.batchNumber} value={stock.batchNumber}>
                              {stock.batchNumber} • {stock.quantityInStock} un • vence em {stock.expiryDate ?? "-"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formState?.quantity ?? item.quantity}
                        onChange={(event) => handleChange(item, "quantity", Number(event.target.value))}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Observações</Label>
                      <Input
                        value={formState?.observations ?? ""}
                        onChange={(event) => handleChange(item, "observations", event.target.value)}
                        placeholder="Observações adicionais"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator className="my-2" />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !prescription}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Dispensação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BadgeForMedicationType({ type }: { type: string }) {
  const colors: Record<string, string> = {
    ANTIBIOTIC: "bg-blue-100 text-blue-700",
    CONTROLLED: "bg-red-100 text-red-700",
    BLOOD_COMPONENT: "bg-purple-100 text-purple-700"
  };

  const label: Record<string, string> = {
    ANTIBIOTIC: "Antibiótico",
    CONTROLLED: "Controlado",
    BLOOD_COMPONENT: "Hemocomponente"
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[type] ?? "bg-muted text-muted-foreground"}`}>
      {label[type] ?? "Padrão"}
    </span>
  );
}

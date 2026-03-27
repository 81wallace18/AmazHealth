import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BellRing } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import type { HorusDashboardSummary, InventoryAlert, Medicine } from "@/types/pharmacy";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const severityStyles: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-amber-100 text-amber-800",
  ERROR: "bg-red-100 text-red-800"
};

export function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<InventoryAlert | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [horusSummary, setHorusSummary] = useState<HorusDashboardSummary | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await pharmacyService.getAlerts();
      setAlerts(data);
      const horus = await pharmacyService.getHorusDashboard().catch(() => null);
      setHorusSummary(horus);
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os alertas de estoque.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadAlerts();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleViewDetails = async (alert: InventoryAlert) => {
    setSelectedAlert(alert);
    setDetailsOpen(true);
    setSelectedMedicine(null);
    setDetailsLoading(true);
    try {
      const medicine = await pharmacyService.getMedicineById(alert.medicineId);
      setSelectedMedicine(medicine);
    } catch (err: any) {
      toast({
        title: "Não foi possível carregar o medicamento",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive"
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    if (filter === "ALL") return alerts;
    return alerts.filter((alert) => alert.type === filter);
  }, [alerts, filter]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5" />
            Alertas de Estoque
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitoramento de lotes vencidos, baixos e próximos ao vencimento
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar alertas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="LOW_STOCK">Estoque baixo</SelectItem>
            <SelectItem value="NEAR_EXPIRY">Próximo ao vencimento</SelectItem>
            <SelectItem value="EXPIRED">Vencido</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        {horusSummary && (
          <div className="grid gap-3 border-b p-4 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Fila HÓRUS em revisão</p>
              <p className="text-2xl font-semibold">{horusSummary.alertsByType.REVIEW_QUEUE ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Mapeamentos pendentes</p>
              <p className="text-2xl font-semibold">{horusSummary.alertsByType.PENDING_MAPPING ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Itens bloqueados no HÓRUS</p>
              <p className="text-2xl font-semibold">{horusSummary.alertsByType.BLOCKED_QUEUE ?? 0}</p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mx-4 mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Carregando alertas...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhum alerta para o filtro selecionado.
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 p-4">
              {filteredAlerts.map((alert, index) => (
                <div key={`${alert.medicineId}-${index}`} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{alert.medicineName}</p>
                      <p className="text-xs text-muted-foreground">{alert.medicineCode}</p>
                    </div>
                    <Badge variant="outline" className={severityStyles[alert.severity] ?? "bg-gray-100 text-gray-800"}>
                      {alert.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm">{alert.message}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {alert.batchNumber && <span>Lote: {alert.batchNumber}</span>}
                    {alert.currentQuantity != null && <span>Qtd atual: {alert.currentQuantity}</span>}
                    {alert.expiryDate && <span>Vence em: {alert.expiryDate}</span>}
                    {alert.daysToExpiry != null && <span>Faltam {alert.daysToExpiry} dias</span>}
                  </div>
                  <div className="mt-3">
                    <Button variant="link" className="px-0 text-primary" onClick={() => handleViewDetails(alert)}>
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do alerta</DialogTitle>
            <DialogDescription>
              Informações complementares do medicamento e do lote sinalizado.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{selectedAlert.medicineName}</p>
                <p className="text-xs text-muted-foreground">{selectedAlert.medicineCode}</p>
              </div>
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <p className="font-medium">Resumo do alerta</p>
                <p>{selectedAlert.message}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {selectedAlert.batchNumber && <span>Lote: {selectedAlert.batchNumber}</span>}
                  {selectedAlert.expiryDate && <span>Validade: {selectedAlert.expiryDate}</span>}
                  {selectedAlert.currentQuantity != null && <span>Quantidade: {selectedAlert.currentQuantity}</span>}
                </div>
              </div>
              <Separator />
              {detailsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando informações do medicamento...</p>
              ) : selectedMedicine ? (
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Dados do medicamento</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    <span>Fabricante: {selectedMedicine.manufacturer ?? "—"}</span>
                    <span>Categoria: {selectedMedicine.category ?? "—"}</span>
                    <span>Classe terapêutica: {selectedMedicine.therapeuticClass ?? "—"}</span>
                    <span>Nível de reposição: {selectedMedicine.reorderLevel ?? "—"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedMedicine.description ?? "Nenhuma descrição adicional."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível carregar os dados do medicamento.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um alerta para visualizar.</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

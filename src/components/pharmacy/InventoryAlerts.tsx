import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, BellRing } from "lucide-react";
import { pharmacyService } from "@/services/pharmacyService";
import type { InventoryAlert } from "@/types/pharmacy";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        setError(null);
        const data = await pharmacyService.getAlerts();
        setAlerts(data);
      } catch (err: any) {
        setError(err.message || "Não foi possível carregar os alertas de estoque.");
      } finally {
        setLoading(false);
      }
    };

    void loadAlerts();
  }, []);

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
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

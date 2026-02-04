import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCapabilities } from "@/auth/useCapabilities";
import { PharmacyDashboard } from "@/components/pharmacy/PharmacyDashboard";
import { PharmacyQueue } from "@/components/pharmacy/PharmacyQueue";
import { StockManagement } from "@/components/pharmacy/StockManagement";
import { InventoryAlerts } from "@/components/pharmacy/InventoryAlerts";

export default function Pharmacy() {
  const capabilities = useCapabilities();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Farmácia</h1>
        <p className="text-muted-foreground">
          Fila de prescrições, estoque e alertas operacionais
        </p>
      </div>

      {!capabilities.canDispenseMedication && (
        <Alert>
          <AlertDescription>
            Seu perfil está em modo de leitura. Ações de estoque e dispensação podem ficar bloqueadas.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="queue">Fila</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <PharmacyDashboard />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <PharmacyQueue />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <StockManagement />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <InventoryAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}

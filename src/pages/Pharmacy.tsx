import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PharmacyDashboard } from "@/components/pharmacy/PharmacyDashboard";
import { PharmacyQueue } from "@/components/pharmacy/PharmacyQueue";
import { StockManagement } from "@/components/pharmacy/StockManagement";
import { InventoryAlerts } from "@/components/pharmacy/InventoryAlerts";

export default function Pharmacy() {
  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-3xl font-bold">Módulo de Farmácia</h1>
        <p className="text-muted-foreground">
          Gestão de prescrições, dispensação e controle de estoque.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="queue">Fila de Prescrições</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PharmacyDashboard />
        </TabsContent>

        <TabsContent value="queue">
          <PharmacyQueue />
        </TabsContent>

        <TabsContent value="stock">
          <StockManagement />
        </TabsContent>

        <TabsContent value="alerts">
          <InventoryAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
}

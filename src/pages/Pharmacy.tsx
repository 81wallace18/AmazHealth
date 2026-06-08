import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCapabilities } from "@/auth/useCapabilities";
import { useOrgConfig, INTEGRATIONS } from "@/hooks/useOrgConfig";
import { PharmacyDashboard } from "@/components/pharmacy/PharmacyDashboard";
import { PharmacyQueue } from "@/components/pharmacy/PharmacyQueue";
import { StockManagement } from "@/components/pharmacy/StockManagement";
import { InventoryAlerts } from "@/components/pharmacy/InventoryAlerts";
import { HorusAuditLog } from "@/components/pharmacy/HorusAuditLog";
import { HorusIntegrationPanel } from "@/components/pharmacy/HorusIntegrationPanel";
import { HorusMappingsPanel } from "@/components/pharmacy/HorusMappingsPanel";
import { HorusOperationalDivergencesPanel } from "@/components/pharmacy/HorusOperationalDivergencesPanel";
import { PharmacyPostIngestionReports } from "@/components/pharmacy/PharmacyPostIngestionReports";
import { CanonicalPharmacyOperations } from "@/components/pharmacy/CanonicalPharmacyOperations";
import { CatmatSanitation } from "@/components/pharmacy/CatmatSanitation";

export default function Pharmacy() {
  const capabilities = useCapabilities();
  const { hasIntegration } = useOrgConfig();
  const horusEnabled = hasIntegration(INTEGRATIONS.HORUS_LEGACY);

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
          <TabsTrigger value="dashboard">Painel</TabsTrigger>
          <TabsTrigger value="queue">Fila</TabsTrigger>
          <TabsTrigger value="canonical">Operação canônica</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="catmat">CATMAT/LME</TabsTrigger>
          {horusEnabled && <TabsTrigger value="horus-integration">Integração HÓRUS</TabsTrigger>}
          {horusEnabled && <TabsTrigger value="horus-mappings">Mapeamentos HÓRUS</TabsTrigger>}
          {horusEnabled && <TabsTrigger value="horus-divergences">Divergências HÓRUS</TabsTrigger>}
          <TabsTrigger value="post-ingestion-reports">Relatórios pós-ingestão</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          {horusEnabled && <TabsTrigger value="audit">Auditoria legada</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <PharmacyDashboard />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <PharmacyQueue />
        </TabsContent>

        <TabsContent value="canonical" className="space-y-4">
          <CanonicalPharmacyOperations />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <StockManagement canManageStock={capabilities.canManageStock} />
        </TabsContent>

        <TabsContent value="catmat" className="space-y-4">
          <CatmatSanitation />
        </TabsContent>

        {horusEnabled && (
          <TabsContent value="horus-integration" className="space-y-4">
            <HorusIntegrationPanel />
          </TabsContent>
        )}

        {horusEnabled && (
          <TabsContent value="horus-mappings" className="space-y-4">
            <HorusMappingsPanel />
          </TabsContent>
        )}

        {horusEnabled && (
          <TabsContent value="horus-divergences" className="space-y-4">
            <HorusOperationalDivergencesPanel />
          </TabsContent>
        )}

        <TabsContent value="post-ingestion-reports" className="space-y-4">
          <PharmacyPostIngestionReports />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <InventoryAlerts />
        </TabsContent>

        {horusEnabled && (
          <TabsContent value="audit" className="space-y-4">
            <HorusAuditLog />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

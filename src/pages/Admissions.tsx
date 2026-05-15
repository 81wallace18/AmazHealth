import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmissions } from "@/hooks/useAdmissions";
import { AdmissionForm } from "@/components/admissions/AdmissionForm";
import { AdmissionList } from "@/components/admissions/AdmissionList";
import { AdmissionStats } from "@/components/admissions/AdmissionStats";
import { BedBoardMap } from "@/components/admissions/BedBoardMap";
import { useCapabilities } from "@/auth/useCapabilities";

export default function Admissions() {
  const [showForm, setShowForm] = useState(false);
  const { admissions, loading, refetch } = useAdmissions();
  const capabilities = useCapabilities();

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Internações</h1>
          <p className="text-muted-foreground">
            Gerencie internações hospitalares e leitos
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          disabled={!capabilities.canAdmitPatient}
          title={!capabilities.canAdmitPatient ? "Você não tem permissão para internar pacientes" : ""}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Internação
        </Button>
      </div>

      <AdmissionStats admissions={admissions} />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Internações</TabsTrigger>
          <TabsTrigger value="beds">Mapa de Leitos</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <AdmissionList />
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          <BedBoardMap />
        </TabsContent>
      </Tabs>

      <AdmissionForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

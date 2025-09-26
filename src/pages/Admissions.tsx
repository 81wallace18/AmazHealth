import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmissions } from "@/hooks/useAdmissions";
import { useHospital } from "@/hooks/useHospital";
import { AdmissionForm } from "@/components/forms/AdmissionForm";
import { AdmissionTable } from "@/components/admissions/AdmissionTable";
import { AdmissionStats } from "@/components/admissions/AdmissionStats";

export default function Admissions() {
  const [showForm, setShowForm] = useState(false);
  const { admissions, loading, addAdmission, dischargePatient, refetch } = useAdmissions();
  const { wards, beds, loading: hospitalLoading } = useHospital();

  const handleAddAdmission = async (data: any) => {
    try {
      await addAdmission(data);
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error('Error adding admission:', error);
    }
  };

  const handleDischarge = async (admissionId: string, dischargeData: any) => {
    try {
      await dischargePatient(admissionId, dischargeData);
      refetch();
    } catch (error) {
      console.error('Error discharging patient:', error);
    }
  };

  if (loading || hospitalLoading) {
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Internação
        </Button>
      </div>

      <AdmissionStats admissions={admissions} />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Internações</TabsTrigger>
          <TabsTrigger value="wards">Enfermarias</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Internações Ativas</CardTitle>
              <CardDescription>
                Lista de todos os pacientes internados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdmissionTable 
                admissions={admissions} 
                onDischarge={handleDischarge}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wards.map((ward) => (
              <Card key={ward.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{ward.name}</CardTitle>
                  <CardDescription>{ward.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Capacidade:</span>
                      <span>{ward.capacity} leitos</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ocupação:</span>
                      <span>{ward.current_occupancy}/{ward.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        ward.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ward.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showForm && (
        <AdmissionForm
          wards={wards}
          beds={beds}
          onSubmit={handleAddAdmission}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
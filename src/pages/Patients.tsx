import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { usePatients } from "@/hooks/usePatients";
import { PatientForm } from "@/components/forms/PatientForm";
import { PatientStats } from "@/components/patients/PatientStats";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientDetails } from "@/components/patients/PatientDetails";

export default function Patients() {
  const { patients, loading, addPatient, updatePatient, deletePatient } = usePatients();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    document.title = "Pacientes | Gestão de Pacientes";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Gestão de pacientes: cadastro, filtros e atualização');
  }, []);

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patient_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
    
    return matchesSearch && matchesStatus && matchesGender;
  });

  const handleAddPatient = async (data: any) => {
    try {
      await addPatient(data);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const openView = (patient: any) => {
    setSelectedPatient(patient);
    setIsViewOpen(true);
  };

  const openEdit = (patient: any) => {
    setSelectedPatient(patient);
    setIsEditOpen(true);
  };

  const handleUpdatePatient = async (data: any) => {
    if (!selectedPatient) return;
    try {
      await updatePatient(selectedPatient.id, data);
      setIsEditOpen(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error updating patient:', error);
    }
  };

  const handleDeletePatient = async (patient: any) => {
    if (!patient) return;
    const confirmed = window.confirm('Confirmar exclusão deste paciente?');
    if (!confirmed) return;
    try {
      await deletePatient(patient.id);
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando pacientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Cadastro e gerenciamento de pacientes</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <PatientForm onSubmit={handleAddPatient} loading={loading} />
          </DialogContent>
        </Dialog>
      </div>

      <PatientStats patients={patients} />
      
      <PatientFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
      />

      <PatientTable 
        patients={filteredPatients}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDeletePatient}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedPatient && <PatientDetails patient={selectedPatient} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <PatientForm onSubmit={handleUpdatePatient} loading={loading} initialData={selectedPatient} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
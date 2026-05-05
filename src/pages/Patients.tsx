import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePatients } from "@/hooks/usePatients";
import { PatientForm } from "@/components/forms/PatientForm";
import { NewAttendanceDialog } from "@/components/attendance/NewAttendanceDialog";
import { EmergencyBypassDialog } from "@/components/attendance/EmergencyBypassDialog";
import { PatientStats } from "@/components/patients/PatientStats";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientDetails } from "@/components/patients/PatientDetails";
import { useCapabilities } from "@/auth/useCapabilities";
import attendanceService from "@/services/attendanceService";
import { patientService } from "@/services/patientService";
import { toast } from "sonner";

export default function Patients() {
  const { patients, loading, addPatient, updatePatient, deletePatient, refetch } = usePatients();
  const capabilities = useCapabilities();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [genderFilter, setGenderFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [attendancePatient, setAttendancePatient] = useState<any>(null);
  const [isBypassOpen, setIsBypassOpen] = useState(false);
  const [bypassPatient, setBypassPatient] = useState<any>(null);

  useEffect(() => {
    document.title = "Pacientes | Gestão de Pacientes";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Gestão de pacientes: cadastro, filtros e atualização');
  }, []);

  const filteredPatients = useMemo(() => patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const matchesGender = genderFilter === "all" || patient.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesGender;
  }), [patients, searchTerm, statusFilter, genderFilter]);

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

  const handleStartAttendance = (patient: any) => {
    setAttendancePatient(patient);
    setIsAttendanceOpen(true);
  };

  const handleEmergencyBypass = (patient: any) => {
    setBypassPatient(patient);
    setIsBypassOpen(true);
  };

  const handlePrintLabel = async (patient: any) => {
    try {
      const data = await patientService.getIdentification(patient.id);
      const printWindow = window.open("", "_blank", "width=400,height=300");
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Etiqueta</title><style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .code { font-family: monospace; font-size: 18px; font-weight: bold; }
            .name { font-size: 16px; margin: 8px 0; }
            .info { font-size: 12px; color: #666; }
          </style></head><body>
            <div class="code">${data.patientCode}</div>
            <div class="name">${data.fullName}</div>
            <div class="info">Nasc: ${new Date(data.dateOfBirth).toLocaleDateString("pt-BR")}</div>
            ${data.attendanceNumber ? `<div class="info">Atendimento: ${data.attendanceNumber}</div>` : ""}
            <div class="info">UBS Serra Pelada</div>
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      await patientService.printIdentification(patient.id);
    } catch {
      toast.error("Erro ao imprimir etiqueta.");
    }
  };

  const handleCreateAttendance = async (data: { visitType: 'URGENCIA' | 'AMBULATORIAL'; doctorId?: string; chiefComplaint: string }) => {
    if (!attendancePatient) return;
    await attendanceService.create({
      patientId: attendancePatient.id,
      visitType: data.visitType,
      chiefComplaint: data.chiefComplaint,
      ...(data.doctorId ? { doctorId: data.doctorId } : {}),
    });
    await refetch();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("active");
    setGenderFilter("all");
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
    <div className="p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Consulta e gerenciamento de pacientes</p>
        </div>
      </div>

      <PatientStats patients={patients} />
      
      <PatientFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        onClearFilters={handleClearFilters}
      />

      <PatientTable
        patients={filteredPatients}
        onView={openView}
        onEdit={openEdit}
        onDelete={capabilities.canDeletePatients ? handleDeletePatient : undefined}
        onPrintLabel={handlePrintLabel}
        onEmergencyBypass={capabilities.canCreateAttendance ? handleEmergencyBypass : undefined}
      />

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>Visualização completa do cadastro.</DialogDescription>
          </DialogHeader>
          {selectedPatient && <PatientDetails patient={selectedPatient} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>Atualize os dados do paciente.</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm onSubmit={handleUpdatePatient} loading={loading} initialData={selectedPatient} />
          )}
        </DialogContent>
      </Dialog>

      <NewAttendanceDialog
        patient={attendancePatient}
        open={isAttendanceOpen}
        onOpenChange={(open) => {
          setIsAttendanceOpen(open);
          if (!open) {
            setAttendancePatient(null);
          }
        }}
        onSubmit={handleCreateAttendance}
        loading={loading}
      />

      <EmergencyBypassDialog
        patient={bypassPatient}
        open={isBypassOpen}
        onOpenChange={(open) => {
          setIsBypassOpen(open);
          if (!open) {
            setBypassPatient(null);
          }
        }}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { usePatientsSpring } from "@/hooks/usePatientsSpring";
import { PatientFormNew } from "@/components/forms/PatientFormNew";
import { PatientStats } from "@/components/patients/PatientStats";
import { PatientFilters } from "@/components/patients/PatientFilters";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientDetails } from "@/components/patients/PatientDetails";
import { PatientsEmptyState } from "@/components/patients/PatientsEmptyState";
import { PatientIdentification } from "@/components/patients/PatientIdentification";
import { NewAttendanceDialog } from "@/components/attendance/NewAttendanceDialog";
import attendanceService from "@/services/attendanceService";
import { patientService } from "@/services/patientService";

export default function Patients() {
  const { patients, loading, addPatient, updatePatient, deletePatient, refetch } = usePatientsSpring();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dateOfBirthFilter, setDateOfBirthFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
  const [isNewAttendanceOpen, setIsNewAttendanceOpen] = useState(false);
  const [currentAttendanceNumber, setCurrentAttendanceNumber] = useState<string | undefined>();

  useEffect(() => {
    document.title = "Recepção PA | Pronto Atendimento";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Recepção Pronto Atendimento: buscar, cadastrar e iniciar atendimento');
  }, []);

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.firstName} ${patient.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.cpf?.includes(searchTerm) ||
                         patient.cns?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const matchesGender = genderFilter === "all" || patient.gender === genderFilter;
    const matchesDateOfBirth = !dateOfBirthFilter || patient.dateOfBirth === dateOfBirthFilter;

    return matchesSearch && matchesStatus && matchesGender && matchesDateOfBirth;
  });

  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all" || genderFilter !== "all" || dateOfBirthFilter !== "";

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setGenderFilter("all");
    setDateOfBirthFilter("");
  };

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

  const handlePrintLabel = (patient: any) => {
    setSelectedPatient(patient);
    setIsPrintLabelOpen(true);
  };

  const handlePrint = async () => {
    if (!selectedPatient) return;

    try {
      // Registra impressão no audit trail
      await patientService.printIdentification(
        selectedPatient.id,
        currentAttendanceNumber
      );

      // Imprime
      window.print();
    } catch (error) {
      console.error('Error logging print:', error);
      // Mesmo com erro no log, permite impressão
      window.print();
    }
  };

  const handleReprint = async () => {
    if (!selectedPatient) return;

    try {
      // Registra reimpressão no audit trail
      await patientService.reprintIdentification(
        selectedPatient.id,
        'Reimpressão solicitada pelo usuário'
      );

      // Imprime
      window.print();
    } catch (error) {
      console.error('Error logging reprint:', error);
      // Mesmo com erro no log, permite impressão
      window.print();
    }
  };

  const handleStartAttendance = (patient: any) => {
    setSelectedPatient(patient);
    setIsNewAttendanceOpen(true);
  };

  const handleCreateAttendance = async (data: any) => {
    if (!selectedPatient) return;

    try {
      const attendance = await attendanceService.create({
        patientId: selectedPatient.id,
        ...data,
      });

      // Armazena o número de atendimento para a etiqueta
      setCurrentAttendanceNumber(attendance.attendanceNumber);

      // Fecha o modal de novo atendimento
      setIsNewAttendanceOpen(false);

      // Abre automaticamente o modal de impressão de etiqueta
      setIsPrintLabelOpen(true);

      // TODO: Notificar sucesso ao usuário
      console.log('Atendimento criado com sucesso:', attendance);
    } catch (error) {
      console.error('Error creating attendance:', error);
      // TODO: Mostrar erro ao usuário
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
            <PatientFormNew onSubmit={handleAddPatient} loading={loading} />
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
        dateOfBirthFilter={dateOfBirthFilter}
        setDateOfBirthFilter={setDateOfBirthFilter}
        onClearFilters={handleClearFilters}
      />

      {filteredPatients.length === 0 ? (
        <PatientsEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          onAddPatient={() => setIsFormOpen(true)}
        />
      ) : (
        <PatientTable
          patients={filteredPatients}
          onView={openView}
          onEdit={openEdit}
          onDelete={handleDeletePatient}
          onPrintLabel={handlePrintLabel}
          onStartAttendance={handleStartAttendance}
        />
      )}

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedPatient && <PatientDetails patient={selectedPatient} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <PatientFormNew onSubmit={handleUpdatePatient} loading={loading} initialData={selectedPatient} />
          )}
        </DialogContent>
      </Dialog>

      <PatientIdentification
        patient={selectedPatient}
        open={isPrintLabelOpen}
        onOpenChange={setIsPrintLabelOpen}
        onPrint={handlePrint}
        onReprint={handleReprint}
        attendanceNumber={currentAttendanceNumber}
      />

      <NewAttendanceDialog
        patient={selectedPatient}
        open={isNewAttendanceOpen}
        onOpenChange={setIsNewAttendanceOpen}
        onSubmit={handleCreateAttendance}
        loading={loading}
      />
    </div>
  );
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToastAction } from "@/components/ui/toast";
import { usePatientsSpring } from "@/hooks/usePatientsSpring";
import { useToast } from "@/hooks/use-toast";
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
import type { Patient, PatientIdentification as PatientIdentificationInfo } from "@/types/patient";

export default function Patients() {
  const { patients, loading, addPatient, updatePatient, deletePatient, refetch } = usePatientsSpring();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [dateOfBirthFilter, setDateOfBirthFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPrintLabelOpen, setIsPrintLabelOpen] = useState(false);
  const [isNewAttendanceOpen, setIsNewAttendanceOpen] = useState(false);
  const [currentAttendanceNumber, setCurrentAttendanceNumber] = useState<string | undefined>();
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | undefined>();
  const [identificationInfo, setIdentificationInfo] = useState<PatientIdentificationInfo | null>(null);
  const [isLoadingIdentification, setIsLoadingIdentification] = useState(false);

  useEffect(() => {
    document.title = "Recepção PA | Pronto Atendimento";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Recepção Pronto Atendimento: buscar, cadastrar e iniciar atendimento');
  }, []);

  useEffect(() => {
    if (!isPrintLabelOpen) {
      setIdentificationInfo(null);
      setIsLoadingIdentification(false);
      setCurrentAttendanceNumber(undefined);
      setCurrentAttendanceId(undefined);
    }
  }, [isPrintLabelOpen]);

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

  const openView = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewOpen(true);
  };

  const openEdit = (patient: Patient) => {
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

  const handleDeletePatient = async (patient: Patient) => {
    if (!patient) return;
    const confirmed = window.confirm('Confirmar exclusão deste paciente?');
    if (!confirmed) return;
    try {
      await deletePatient(patient.id);
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const fetchIdentification = async (patientId: string) => {
    setIsLoadingIdentification(true);
    try {
      const data = await patientService.getIdentification(patientId);
      setIdentificationInfo(data);
      setCurrentAttendanceNumber((prev) => data.attendanceNumber ?? prev);
      setCurrentAttendanceId((prev) => data.attendanceId ?? prev);
    } catch (error) {
      console.error('Error fetching identification data:', error);
    } finally {
      setIsLoadingIdentification(false);
    }
  };

  const handlePrintLabel = (patient: Patient) => {
    setSelectedPatient(patient);
    setIdentificationInfo(null);
    setCurrentAttendanceNumber(undefined);
    setCurrentAttendanceId(undefined);
    setIsPrintLabelOpen(true);
    void fetchIdentification(patient.id);
  };

  const handlePrint = async () => {
    if (!selectedPatient) return;

    try {
      await patientService.printIdentification(
        selectedPatient.id,
        currentAttendanceNumber ?? identificationInfo?.attendanceNumber
      );
    } catch (error) {
      console.error('Error logging print:', error);
    } finally {
      await fetchIdentification(selectedPatient.id);
    }
  };

  const handleReprint = async () => {
    if (!selectedPatient) return;
    const attendanceId = identificationInfo?.attendanceId || currentAttendanceId;
    if (!attendanceId) {
      toast({
        title: "Não foi possível reimprimir",
        description: "Nenhum atendimento ativo foi encontrado para este paciente.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedInfo = await attendanceService.reprintLabel(
        attendanceId,
        'Reimpressão solicitada manualmente'
      );
      setIdentificationInfo(updatedInfo);
      setCurrentAttendanceNumber(updatedInfo.attendanceNumber ?? currentAttendanceNumber);
      setCurrentAttendanceId(updatedInfo.attendanceId ?? currentAttendanceId);
      toast({
        title: "Etiqueta reimpressa",
        description: "A ação foi registrada no log de auditoria.",
      });
    } catch (error: any) {
      console.error('Error logging reprint:', error);
      const message = error.response?.data?.message || 'Erro ao reimprimir etiqueta. Tente novamente.';
      toast({
        title: "Erro ao reimprimir",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleStartAttendance = (patient: Patient) => {
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
      setCurrentAttendanceId(attendance.id);
      setIdentificationInfo(null);

      // Fecha o modal de novo atendimento
      setIsNewAttendanceOpen(false);

      // Abre automaticamente o modal de impressão de etiqueta
      setIsPrintLabelOpen(true);

      void fetchIdentification(selectedPatient.id);

      toast({
        title: "Atendimento criado",
        description: "Paciente encaminhado para a triagem Manchester.",
        action: (
          <ToastAction altText="Ir para triagem" onClick={() => navigate("/triage")}>
            Ir para triagem
          </ToastAction>
        ),
      });
    } catch (error: any) {
      console.error('Error creating attendance:', error);
      const message = error.response?.data?.message || error.message || 'Erro ao criar atendimento';
      toast({
        title: "Erro ao criar atendimento",
        description: message,
        variant: "destructive",
      });
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
            <DialogHeader>
              <DialogTitle>Cadastrar novo paciente</DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para registrar um novo paciente no sistema.
              </DialogDescription>
            </DialogHeader>
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
          <DialogHeader>
            <DialogTitle>Detalhes do paciente</DialogTitle>
            <DialogDescription>
              Consulte as informações cadastradas para o paciente selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && <PatientDetails patient={selectedPatient} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar paciente</DialogTitle>
            <DialogDescription>
              Atualize os dados necessários e salve as alterações realizadas.
            </DialogDescription>
          </DialogHeader>
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
        attendanceNumber={currentAttendanceNumber ?? identificationInfo?.attendanceNumber}
        printedAt={identificationInfo?.printedAt}
        printedBy={identificationInfo?.printedBy}
        isLoading={isLoadingIdentification}
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

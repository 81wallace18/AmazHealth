import { useEffect, useState } from 'react';
import { Search, FileText, AlertCircle, ClipboardList, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MedicalRecordHistory } from '@/components/medical-records/MedicalRecordHistory';
import { MedicalRecordForm } from '@/components/medical-records/MedicalRecordForm';
import { LabTestOrderForm } from '@/components/medical-records/LabTestOrderForm';
import { LabTestList } from '@/components/medical-records/LabTestList';
import { AttendanceOutcomeForm } from '@/components/medical-records/AttendanceOutcomeForm';
import { PrescriptionForm } from '@/components/prescriptions/PrescriptionForm';
import { PrescriptionList } from '@/components/prescriptions/PrescriptionList';
import { patientService } from '@/services/patientService';
import attendanceService, { type Attendance } from '@/services/attendanceService';
import type { Patient } from '@/types/patient';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

export default function MedicalRecords() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAttendances, setIsLoadingAttendances] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [labOrderOpen, setLabOrderOpen] = useState(false);
  const [labTestsVersion, setLabTestsVersion] = useState(0);
  const [prescriptionFormOpen, setPrescriptionFormOpen] = useState(false);
  const [prescriptionsVersion, setPrescriptionsVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<'records' | 'lab-tests' | 'prescriptions'>('records');
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);

  useEffect(() => {
    setLabTestsVersion((prev) => prev + 1);
    setPrescriptionsVersion((prev) => prev + 1);
  }, [selectedPatient?.id, selectedAttendance?.id]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedPatient(null);
    setAttendances([]);
    setSelectedAttendance(null);

    try {
      const response = await patientService.search({
        query: searchQuery,
        page: 0,
        size: 10
      });

      setSearchResults(response.content);

      if (response.content.length === 0) {
        // toast.error não está importado, então não vou usar
        alert('Nenhum paciente encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      alert('Erro ao buscar paciente');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchResults([]); // Limpa os resultados da busca
    setIsLoadingAttendances(true);
    setAttendances([]);
    setSelectedAttendance(null);

    try {
      const patientAttendances = await attendanceService.findByPatient(patient.id);

      // Filtrar apenas atendimentos não finalizados/cancelados
      const activeAttendances = patientAttendances.filter(
        att => att.status !== 'FINALIZADO' && att.status !== 'CANCELADO'
      );

      setAttendances(activeAttendances);

      // Se houver apenas 1 atendimento ativo, seleciona automaticamente
      if (activeAttendances.length === 1) {
        setSelectedAttendance(activeAttendances[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar atendimentos:', error);
      alert('Erro ao buscar atendimentos do paciente');
    } finally {
      setIsLoadingAttendances(false);
    }
  };

  const getStatusLabel = (status: Attendance['status']) => {
    const labels: Record<Attendance['status'], string> = {
      'AGUARDANDO_TRIAGEM': 'Aguardando Triagem',
      'EM_TRIAGEM': 'Em Triagem',
      'AGUARDANDO_ATENDIMENTO': 'Aguardando Atendimento',
      'EM_ATENDIMENTO': 'Em Atendimento',
      'AGUARDANDO_EXAMES': 'Aguardando Exames',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: Attendance['status']) => {
    const colors: Record<Attendance['status'], string> = {
      'AGUARDANDO_TRIAGEM': 'bg-yellow-100 text-yellow-800',
      'EM_TRIAGEM': 'bg-blue-100 text-blue-800',
      'AGUARDANDO_ATENDIMENTO': 'bg-orange-100 text-orange-800',
      'EM_ATENDIMENTO': 'bg-green-100 text-green-800',
      'AGUARDANDO_EXAMES': 'bg-purple-100 text-purple-800',
      'FINALIZADO': 'bg-gray-100 text-gray-800',
      'CANCELADO': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Prontuários Eletrônicos
        </h1>
        <p className="text-muted-foreground mt-1">
          Registros médicos completos dos pacientes
        </p>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Paciente</CardTitle>
          <CardDescription>
            Digite o nome, CPF ou código do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: João Silva, 123.456.789-00, P-2025-001"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da Busca */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
            <CardDescription>
              Selecione um paciente para visualizar o prontuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CPF: {patient.cpf} | Código: {patient.patientCode}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Selecionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paciente Selecionado */}
      {selectedPatient && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </CardTitle>
                  <CardDescription>
                    CPF: {selectedPatient.cpf} | Código: {selectedPatient.patientCode}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null);
                    setAttendances([]);
                    setSelectedAttendance(null);
                  }}
                >
                  Trocar Paciente
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Atendimentos do Paciente */}
          {isLoadingAttendances ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Carregando atendimentos...</p>
              </CardContent>
            </Card>
          ) : attendances.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Atendimentos Ativos
                  </CardTitle>
                  <CardDescription>
                    Selecione um atendimento para visualizar ou criar registros no prontuário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attendances.map((attendance) => (
                      <div
                        key={attendance.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors",
                          selectedAttendance?.id === attendance.id
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-accent"
                        )}
                        onClick={() => setSelectedAttendance(attendance)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{attendance.attendanceNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {attendance.type} | Entrada: {new Date(attendance.entryDate).toLocaleDateString('pt-BR')}
                            </p>
                            {attendance.chiefComplaint && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Queixa: {attendance.chiefComplaint}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getStatusColor(attendance.status)
                            )}>
                              {getStatusLabel(attendance.status)}
                            </span>
                            {selectedAttendance?.id === attendance.id && (
                              <span className="text-xs text-primary font-medium">
                                Selecionado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Histórico, registros e exames */}
              {selectedAttendance && (
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as 'records' | 'lab-tests' | 'prescriptions')
                  }
                >
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="records">Prontuário</TabsTrigger>
                    <TabsTrigger value="lab-tests">Exames</TabsTrigger>
                    <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>
                  </TabsList>

                  <TabsContent value="records" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Prontuário do Paciente</CardTitle>
                            <CardDescription>
                              Atendimento: {selectedAttendance.attendanceNumber}
                            </CardDescription>
                          </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowOutcomeForm(true)}
                            disabled={selectedAttendance.status === 'FINALIZADO'}
                          >
                            Finalizar atendimento
                          </Button>
                          <Button
                            onClick={() => setShowRecordForm(true)}
                            disabled={!selectedAttendance.visitId}
                            title={!selectedAttendance.visitId ? 'Atendimento sem visita associada' : ''}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Novo Registro
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                    <MedicalRecordHistory
                      patientId={selectedPatient.id}
                      patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                      patientCode={selectedPatient.patientCode}
                      attendanceNumber={selectedAttendance.attendanceNumber}
                    />

                    {selectedAttendance.visitId ? (
                      <MedicalRecordForm
                        open={showRecordForm}
                        onOpenChange={setShowRecordForm}
                        visitId={selectedAttendance.visitId}
                        patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                        onSuccess={() => {
                          setShowRecordForm(false);
                        }}
                      />
                    ) : (
                      showRecordForm && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Este atendimento não possui uma visita associada. Não é possível criar registros no prontuário.
                          </AlertDescription>
                        </Alert>
                      )
                    )}
                  </TabsContent>

                  <TabsContent value="lab-tests" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Exames Laboratoriais</CardTitle>
                            <CardDescription>
                              Solicite exames e acompanhe resultados vinculados ao atendimento.
                            </CardDescription>
                          </div>
                          <Button onClick={() => setLabOrderOpen(true)}>
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Solicitar exame
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>

                    <LabTestList
                      patientId={selectedPatient.id}
                      visitId={selectedAttendance.visitId}
                      version={labTestsVersion}
                    />
                  </TabsContent>

                  <TabsContent value="prescriptions" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Prescrições Médicas</CardTitle>
                            <CardDescription>
                              Gere novas prescrições e consulte o histórico do paciente.
                            </CardDescription>
                          </div>
                          <Button
                            onClick={() => setPrescriptionFormOpen(true)}
                            disabled={!selectedAttendance.visitId}
                            title={
                              !selectedAttendance.visitId
                                ? 'Atendimento sem visita associada'
                                : undefined
                            }
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Nova prescrição
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>

                    <PrescriptionList
                      patientId={selectedPatient.id}
                      version={prescriptionsVersion}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este paciente não possui atendimentos ativos. Para criar um registro no prontuário,
                é necessário primeiro criar um atendimento (entrada) para o paciente.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Estado vazio */}
      {!selectedPatient && searchResults.length === 0 && !isSearching && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Busque um paciente para visualizar ou criar registros no prontuário
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPatient && (
        <LabTestOrderForm
          open={labOrderOpen}
          onOpenChange={setLabOrderOpen}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          visitId={selectedAttendance?.visitId}
          onSuccess={() => {
            setLabOrderOpen(false);
            setLabTestsVersion((prev) => prev + 1);
          }}
        />
      )}

      {selectedPatient && selectedAttendance && (
        <PrescriptionForm
          open={prescriptionFormOpen}
          onOpenChange={setPrescriptionFormOpen}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          visitId={selectedAttendance.visitId}
          attendanceId={selectedAttendance.id}
          defaultDoctorId={user?.staffId ?? undefined}
          onSuccess={() => {
            setPrescriptionsVersion((prev) => prev + 1);
            setPrescriptionFormOpen(false);
          }}
        />
      )}

      {selectedAttendance && selectedPatient && (
        <AttendanceOutcomeForm
          open={showOutcomeForm}
          onOpenChange={setShowOutcomeForm}
          attendanceId={selectedAttendance.id}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
          attendanceNumber={selectedAttendance.attendanceNumber}
          onSuccess={() => {
            setShowOutcomeForm(false);
            handleSelectPatient(selectedPatient);
          }}
        />
      )}
    </div>
  );
}

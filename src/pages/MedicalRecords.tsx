import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileText, Plus, Search, User, Calendar, Eye, Download, Edit, AlertTriangle, Heart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useMedicalRecords } from "@/hooks/useMedicalRecords";
import { useCapabilities } from "@/auth/useCapabilities";
import { useAuth } from "@/hooks/useAuth";
import { PrescriptionForm } from "@/components/prescriptions/PrescriptionForm";
import { PrescriptionList } from "@/components/prescriptions/PrescriptionList";
import { AttendanceOutcomeForm } from "@/components/medical-records/AttendanceOutcomeForm";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { MedicalRecordRequest, RecordType } from "@/types/medicalRecord";
import type { Patient } from "@/types/patient";
import attendanceService, { type Attendance, type VisitStatus as AttendanceVisitStatus } from "@/services/attendanceService";
import { patientService } from "@/services/patientService";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  "consultation": "bg-blue-500/10 text-blue-700 border-blue-200",
  "examination": "bg-green-500/10 text-green-700 border-green-200", 
  "procedure": "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  "surgery": "bg-red-500/10 text-red-700 border-red-200",
  "discharge": "bg-gray-500/10 text-gray-700 border-gray-200"
};

const statusLabels = {
  "consultation": "Consulta",
  "examination": "Exame",
  "procedure": "Procedimento", 
  "surgery": "Cirurgia",
  "discharge": "Alta"
};

const attendanceStatusLabels: Record<AttendanceVisitStatus, string> = {
  CREATED: "Criado",
  TRIAGED: "Triado",
  WAITING_DOCTOR: "Aguardando médico",
  IN_PROGRESS: "Em atendimento",
  WAITING_EXAM: "Aguardando exame",
  EXAM_COMPLETED: "Exame concluído",
  DISCHARGED: "Alta",
  ADMITTED: "Internado",
  TRANSFERRED: "Transferido",
  CANCELLED: "Cancelado",
};

export default function MedicalRecords() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const visitId = searchParams.get('visitId') || undefined;
  const isWorkspace = Boolean(visitId);
  const { records, loading, createRecord, refetch } = useMedicalRecords({ visitId });
  const capabilities = useCapabilities();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [doctorQueueLoading, setDoctorQueueLoading] = useState(false);
  const [doctorQueue, setDoctorQueue] = useState<Array<{
    visitId: string;
    visitCode: string;
    patientName: string;
    patientCode: string;
    status: AttendanceVisitStatus;
  }>>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptionVersion, setPrescriptionVersion] = useState(0);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    recordType: 'EVOLUTION' as RecordType,
    notes: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: '',
    diagnosis: '',
    treatment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Prontuários Médicos | Gestão de Prontuários";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Gestão de prontuários médicos: registros, consultas e histórico médico');
  }, []);

  useEffect(() => {
    if (!visitId) {
      setAttendance(null);
      setPatient(null);
      setAttendanceError(null);
      return;
    }

    let cancelled = false;

    const loadContext = async () => {
      setAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const nextAttendance = await attendanceService.findByVisitId(visitId);
        if (!nextAttendance) {
          throw new Error("Atendimento não encontrado.");
        }
        if (cancelled) return;
        setAttendance(nextAttendance);

        try {
          const nextPatient = await patientService.getById(nextAttendance.patientId);
          if (!cancelled) setPatient(nextPatient);
        } catch (err) {
          // Não bloqueia o fluxo do atendimento; só degrada o header.
          console.error("Erro ao carregar paciente do atendimento:", err);
        }
      } catch (err: any) {
        const message = err?.message || "Não foi possível carregar o atendimento.";
        if (!cancelled) setAttendanceError(message);
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    };

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  useEffect(() => {
    const isDoctor = user?.roles?.includes("DOCTOR");
    if (visitId || !isDoctor || !user?.staffId) {
      setDoctorQueue([]);
      return;
    }

    let cancelled = false;
    const loadDoctorQueue = async () => {
      setDoctorQueueLoading(true);
      try {
        const [waitingDoctor, inProgress] = await Promise.all([
          attendanceService.findByStatus("WAITING_DOCTOR"),
          attendanceService.findByStatus("IN_PROGRESS"),
        ]);

        const queue = [...waitingDoctor, ...inProgress]
          .filter((item) => item.doctorId === user.staffId)
          .sort((a, b) => {
            const rank = (status: AttendanceVisitStatus) =>
              status === "WAITING_DOCTOR" ? 0 : status === "IN_PROGRESS" ? 1 : 99;
            const statusDiff = rank(a.status) - rank(b.status);
            if (statusDiff !== 0) return statusDiff;
            return new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime();
          });

        const uniquePatientIds = Array.from(new Set(queue.map((item) => item.patientId)));
        const patientLookup = new Map<string, { name: string; code: string }>();

        await Promise.all(
          uniquePatientIds.map(async (patientId) => {
            try {
              const loadedPatient = await patientService.getById(patientId);
              patientLookup.set(patientId, {
                name: `${loadedPatient.firstName} ${loadedPatient.lastName}`.trim(),
                code: loadedPatient.patientCode ?? "-",
              });
            } catch {
              patientLookup.set(patientId, {
                name: "Paciente não encontrado",
                code: "-",
              });
            }
          })
        );

        if (cancelled) return;
        setDoctorQueue(
          queue.map((item) => ({
            visitId: item.id,
            visitCode: item.visitCode,
            patientName: patientLookup.get(item.patientId)?.name ?? "Paciente",
            patientCode: patientLookup.get(item.patientId)?.code ?? "-",
            status: item.status,
          }))
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar fila do médico:", error);
          setDoctorQueue([]);
        }
      } finally {
        if (!cancelled) {
          setDoctorQueueLoading(false);
        }
      }
    };

    void loadDoctorQueue();
    return () => {
      cancelled = true;
    };
  }, [visitId, user?.roles, user?.staffId]);

  const filteredRecords = records.filter(record => {
    const patientName = record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '';
    const doctorName = record.doctor ? `${record.doctor.first_name} ${record.doctor.last_name}` : '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || record.record_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: records.length,
    consultas: records.filter(r => r.record_type === "consultation").length,
    exames: records.filter(r => r.record_type === "examination").length,
    atualizadosHoje: records.filter(r => {
      const today = new Date().toISOString().split('T')[0];
      const recordDate = new Date(r.created_at).toISOString().split('T')[0];
      return recordDate === today;
    }).length
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const uniqueTypes = [...new Set(records.map(r => r.record_type))];
  const workspacePatientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : undefined;
  const workspacePatientCode = patient?.patientCode;
  const workspaceAttendanceCode = attendance?.visitCode;
  const workspaceStatusLabel = attendance?.status ? attendanceStatusLabels[attendance.status] : undefined;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando prontuários...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            {isWorkspace ? "Atendimento" : "Prontuários Médicos"}
          </h1>
          {isWorkspace ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {workspacePatientName ? `Paciente: ${workspacePatientName}` : "Atendimento selecionado"}
                {workspacePatientCode ? ` · Código: ${workspacePatientCode}` : ""}
                {workspaceAttendanceCode ? ` · Atendimento: ${workspaceAttendanceCode}` : visitId ? ` · ID: ${visitId}` : ""}
                {workspaceStatusLabel ? ` · Status: ${workspaceStatusLabel}` : ""}
              </p>
              {attendance?.chiefComplaint && (
                <p>Queixa: {attendance.chiefComplaint}</p>
              )}
              {attendanceLoading && (
                <p>Carregando contexto do atendimento...</p>
              )}
              {attendanceError && (
                <p className="text-destructive">{attendanceError}</p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Gestão completa de registros médicos dos pacientes</p>
          )}
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary/90"
              disabled={!capabilities.canRecordEvolution}
              title={!capabilities.canRecordEvolution ? "Você não tem permissão para registrar prontuários" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Prontuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Novo Prontuário</h2>
                <p className="text-sm text-muted-foreground">
                  Preencha os dados clínicos do atendimento.
                </p>
              </div>

              {!visitId && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Selecione uma consulta para registrar o prontuário.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Registro</Label>
                  <Select
                    value={form.recordType}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, recordType: value as RecordType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANAMNESIS">Anamnese</SelectItem>
                      <SelectItem value="EVOLUTION">Evolução</SelectItem>
                      <SelectItem value="PROCEDURE">Procedimento</SelectItem>
                      <SelectItem value="DISCHARGE_SUMMARY">Resumo de Alta</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Queixa Principal</Label>
                  <Input
                    value={form.chiefComplaint}
                    onChange={(e) => setForm((prev) => ({ ...prev, chiefComplaint: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>História da Doença Atual</Label>
                <Textarea
                  value={form.historyOfPresentIllness}
                  onChange={(e) => setForm((prev) => ({ ...prev, historyOfPresentIllness: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Exame Físico</Label>
                <Textarea
                  value={form.physicalExamination}
                  onChange={(e) => setForm((prev) => ({ ...prev, physicalExamination: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diagnóstico</Label>
                  <Input
                    value={form.diagnosis}
                    onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conduta / Tratamento</Label>
                  <Input
                    value={form.treatment}
                    onChange={(e) => setForm((prev) => ({ ...prev, treatment: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas (obrigatório)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!visitId || submitting || !form.notes.trim()}
                  onClick={async () => {
                    if (!visitId) return;
                    try {
                      setSubmitting(true);
                      const payload: MedicalRecordRequest = {
                        visitId,
                        recordType: form.recordType,
                        notes: form.notes,
                        chiefComplaint: form.chiefComplaint || undefined,
                        historyOfPresentIllness: form.historyOfPresentIllness || undefined,
                        physicalExamination: form.physicalExamination || undefined,
                        diagnosis: form.diagnosis || undefined,
                        treatment: form.treatment || undefined,
                      };
                      await createRecord(payload);
                      await refetch();
                      setIsFormOpen(false);
                      setForm({
                        recordType: 'EVOLUTION',
                        notes: '',
                        chiefComplaint: '',
                        historyOfPresentIllness: '',
                        physicalExamination: '',
                        diagnosis: '',
                        treatment: '',
                      });
                      toast({
                        title: 'Prontuário registrado',
                        description: 'Registro criado com sucesso.',
                      });
                    } catch (error: any) {
                      toast({
                        title: 'Erro ao salvar prontuário',
                        description: error?.message || 'Não foi possível salvar o prontuário.',
                        variant: 'destructive',
                      });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? 'Salvando...' : 'Salvar prontuário'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prontuários</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">registros no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas</CardTitle>
            <Heart className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.consultas}</div>
            <p className="text-xs text-muted-foreground">consultas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exames</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.exames}</div>
            <p className="text-xs text-muted-foreground">exames realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atualizados Hoje</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.atualizadosHoje}</div>
            <p className="text-xs text-muted-foreground">registros modificados</p>
          </CardContent>
        </Card>
      </div>

      {!isWorkspace && user?.roles?.includes("DOCTOR") && (
        <Card>
          <CardHeader>
            <CardTitle>Fila do Médico</CardTitle>
          </CardHeader>
          <CardContent>
            {doctorQueueLoading ? (
              <p className="text-sm text-muted-foreground">Carregando atendimentos...</p>
            ) : doctorQueue.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nenhum atendimento do seu usuário está aguardando ou em andamento.
                </p>
                <Button variant="outline" onClick={() => navigate("/triage")}>
                  Ir para Triagem
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Código Paciente</TableHead>
                      <TableHead>Atendimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorQueue.map((item) => (
                      <TableRow key={item.visitId}>
                        <TableCell className="font-medium">{item.patientName}</TableCell>
                        <TableCell className="font-mono text-xs">{item.patientCode}</TableCell>
                        <TableCell className="font-mono text-xs">{item.visitCode}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "IN_PROGRESS" ? "default" : "secondary"}>
                            {attendanceStatusLabels[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/medical-records?visitId=${item.visitId}`)}
                          >
                            Abrir atendimento
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{isWorkspace ? "Prontuário" : "Lista de Prontuários"}</TabsTrigger>
          {isWorkspace && <TabsTrigger value="prescriptions">Prescrições</TabsTrigger>}
          {isWorkspace && <TabsTrigger value="finalize">Finalizar</TabsTrigger>}
          {!isWorkspace && <TabsTrigger value="analytics">Relatórios</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por paciente, médico ou diagnóstico..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{statusLabels[type as keyof typeof statusLabels]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Medical Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Prontuários Médicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Médico Responsável</TableHead>
                      <TableHead>Tipo de Registro</TableHead>
                      <TableHead>Queixa Principal</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Data do Registro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const patientName = record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : 'Paciente não encontrado';
                      const doctorName = record.doctor ? `Dr(a). ${record.doctor.first_name} ${record.doctor.last_name}` : 'Médico não encontrado';
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold">{patientName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {record.patient?.patient_code || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{doctorName}</div>
                              <div className="text-sm text-muted-foreground">{record.doctor?.staff_code || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={statusColors[record.record_type as keyof typeof statusColors]}
                            >
                              {statusLabels[record.record_type as keyof typeof statusLabels]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <div className="text-sm">{record.chief_complaint || 'Não informado'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-48">
                              <div className="font-medium text-sm">{record.diagnosis || 'Aguardando diagnóstico'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="Visualizar">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Download">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isWorkspace && (
          <TabsContent value="prescriptions" className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Prescrições</h2>
                <p className="text-sm text-muted-foreground">
                  Crie e acompanhe prescrições vinculadas ao paciente do atendimento.
                </p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsPrescriptionOpen(true)}
                disabled={!capabilities.canCreatePrescription || !attendance}
                title={
                  !capabilities.canCreatePrescription
                    ? "Você não tem permissão para criar prescrições"
                    : !attendance
                    ? "Carregue o atendimento para continuar"
                    : ""
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Prescrição
              </Button>
            </div>

            {attendanceLoading ? (
              <div className="text-sm text-muted-foreground">Carregando atendimento...</div>
            ) : attendanceError ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {attendanceError}
              </div>
            ) : !attendance ? (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                Nenhum atendimento carregado. Volte para a triagem e selecione um atendimento.
              </div>
            ) : (
              <>
                <PrescriptionList patientId={attendance.patientId} version={prescriptionVersion} />
                <PrescriptionForm
                  open={isPrescriptionOpen}
                  onOpenChange={setIsPrescriptionOpen}
                  patientId={attendance.patientId}
                  patientName={workspacePatientName}
                  visitId={visitId}
                  attendanceId={visitId}
                  defaultDoctorId={attendance.doctorId}
                  onSuccess={() => setPrescriptionVersion((prev) => prev + 1)}
                />
              </>
            )}
          </TabsContent>
        )}

        {isWorkspace && (
          <TabsContent value="finalize" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Finalização do atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Registre o desfecho do atendimento (ex.: Alta). Esta ação altera o status do atendimento.
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setIsFinalizeOpen(true)}
                  disabled={!capabilities.canDefineOutcome || !visitId}
                  title={!capabilities.canDefineOutcome ? "Você não tem permissão para finalizar atendimentos" : ""}
                >
                  Finalizar atendimento
                </Button>
              </CardContent>
            </Card>

            {visitId && (
              <AttendanceOutcomeForm
                open={isFinalizeOpen}
                onOpenChange={setIsFinalizeOpen}
                attendanceId={visitId}
                patientName={workspacePatientName}
                attendanceNumber={workspaceAttendanceCode}
                onSuccess={() => {
                  navigate("/triage");
                }}
              />
            )}
          </TabsContent>
        )}

        {!isWorkspace && (
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {uniqueTypes.map(type => {
                          const count = records.filter(r => r.record_type === type).length;
                          const percentage = records.length > 0 ? ((count / records.length) * 100).toFixed(1) : '0';
                          return (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-sm">{statusLabels[type as keyof typeof statusLabels]}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{count}</span>
                                <span className="text-xs text-muted-foreground">({percentage}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estatísticas Mensais</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total de registros</span>
                          <span className="text-sm font-medium">{records.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Registros hoje</span>
                          <span className="text-sm font-medium">{stats.atualizadosHoje}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Média diária</span>
                          <span className="text-sm font-medium">{(records.length / 30).toFixed(1)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Prontuário
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar Dados
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Relatório Mensal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

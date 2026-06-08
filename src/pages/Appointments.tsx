import { useEffect, useMemo, useState } from "react";
import { Calendar, Plus, Search, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppointments } from "@/hooks/useAppointments";
import { useCapabilities } from "@/auth/useCapabilities";
import { patientService } from "@/services/patientService";
import { staffService } from "@/services/staffService";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Patient } from "@/types/patient";
import type { Staff } from "@/services/staffService";
import { DemoAutofillButton } from "@/demo/DemoAutofillButton";
import { getAdminAppointmentExample } from "@/demo/demoFixtures";
import { getDemoRunId } from "@/demo/demoMode";

const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-500/10 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-gray-500/10 text-gray-700 border-gray-200",
  NO_SHOW: "bg-red-500/10 text-red-700 border-red-200"
};

const statusIcons: Record<AppointmentStatus, typeof CheckCircle2> = {
  SCHEDULED: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle
};

const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou"
};

const appointmentTypes = [
  "Consulta",
  "Retorno",
  "Avaliação",
  "Exame",
  "Procedimento"
];

export default function Appointments() {
  const { appointments, loading, createAppointment, updateStatus } = useAppointments();
  const { hasRole } = useCapabilities();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    patientId: "",
    doctorId: "",
    type: "",
    scheduledDate: "",
    durationMinutes: "",
    reason: "",
    notes: ""
  });

  const canCreate = hasRole("ADMIN") || hasRole("RECEPTIONIST");
  const canUpdate = hasRole("ADMIN") || hasRole("DOCTOR") || hasRole("RECEPTIONIST");

  useEffect(() => {
    if (!isCreateOpen) return;
    if (patients.length > 0 && doctors.length > 0) return;
    setLoadingLookups(true);
    Promise.all([
      patientService.list(0, 50),
      staffService.findActiveDoctors()
    ])
      .then(([patientPage, doctorList]) => {
        setPatients(patientPage.content ?? []);
        setDoctors(doctorList ?? []);
      })
      .finally(() => setLoadingLookups(false));
  }, [isCreateOpen, patients.length, doctors.length]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const patientName = appointment.patientName ?? "";
      const doctorName = appointment.doctorName ?? "";
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointmentCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === "SCHEDULED").length,
      completed: appointments.filter(a => a.status === "COMPLETED").length,
      cancelled: appointments.filter(a => a.status === "CANCELLED").length,
      noShow: appointments.filter(a => a.status === "NO_SHOW").length
    };
  }, [appointments]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  const resetForm = () => {
    setFormError(null);
    setFormState({
      patientId: "",
      doctorId: "",
      type: "",
      scheduledDate: "",
      durationMinutes: "",
      reason: "",
      notes: ""
    });
  };

  const fillAppointmentExample = () => {
    const example = getAdminAppointmentExample(getDemoRunId()).data;
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      patientId: patients[0]?.id ?? prev.patientId,
      doctorId: doctors[0]?.id ?? prev.doctorId,
      type: example.type,
      scheduledDate: example.scheduledDate,
      durationMinutes: example.durationMinutes,
      reason: example.reason,
      notes: example.notes,
    }));
  };

  const handleCreate = async () => {
    if (!formState.patientId || !formState.doctorId || !formState.type || !formState.scheduledDate || !formState.reason) {
      setFormError("Preencha paciente, médico, tipo, data e motivo.");
      return;
    }

    const scheduledIso = new Date(formState.scheduledDate).toISOString();
    const duration = formState.durationMinutes ? Number(formState.durationMinutes) : null;

    await createAppointment({
      patientId: formState.patientId,
      doctorId: formState.doctorId,
      type: formState.type,
      scheduledDate: scheduledIso,
      durationMinutes: duration,
      reason: formState.reason,
      notes: formState.notes || null
    });

    resetForm();
    setIsCreateOpen(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">Controle de consultas, retornos e procedimentos</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button disabled={!canCreate} title={!canCreate ? "Sem permissão para criar agendamento" : ""}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>Informe os dados principais da consulta.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <DemoAutofillButton
                onFill={fillAppointmentExample}
                disabled={loadingLookups}
                aria-label="Preencher exemplo de agendamento"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Paciente</label>
                <Select
                  value={formState.patientId}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLookups ? "Carregando..." : "Selecione o paciente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.patientCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Médico</label>
                <Select
                  value={formState.doctorId}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, doctorId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingLookups ? "Carregando..." : "Selecione o médico"} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.firstName} {doctor.lastName} {doctor.specialization ? `(${doctor.specialization})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={formState.type}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data e Hora</label>
                <Input
                  type="datetime-local"
                  value={formState.scheduledDate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, scheduledDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duração (min)</label>
                <Input
                  inputMode="numeric"
                  placeholder="30"
                  value={formState.durationMinutes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, durationMinutes: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Motivo</label>
                <Input
                  placeholder="Ex: Dor lombar, Retorno, Exames"
                  value={formState.reason}
                  onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  rows={3}
                  placeholder="Observações adicionais"
                  value={formState.notes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!canCreate}>Agendar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">finalizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faltas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.noShow}</div>
            <p className="text-xs text-muted-foreground">no-show</p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Buscar por paciente, médico ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | AppointmentStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="SCHEDULED">Agendado</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="NO_SHOW">Faltou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultas Agendadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment: Appointment) => {
                  const StatusIcon = statusIcons[appointment.status];
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-mono text-sm">{appointment.appointmentCode}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{appointment.patientName ?? "Paciente não informado"}</div>
                        <div className="text-sm text-muted-foreground">ID: {appointment.patientId?.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell>{appointment.doctorName ?? "Médico não informado"}</TableCell>
                      <TableCell>{formatDateTime(appointment.scheduledDate)}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[appointment.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[appointment.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={appointment.status}
                          onValueChange={(value) => updateStatus(appointment.id, value as AppointmentStatus)}
                          disabled={!canUpdate}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Atualizar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SCHEDULED">Agendado</SelectItem>
                            <SelectItem value="COMPLETED">Concluído</SelectItem>
                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                            <SelectItem value="NO_SHOW">Faltou</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredAppointments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum agendamento encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Plus, Search, Clock, User, MapPin, CheckCircle, XCircle, AlertCircle, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  "confirmed": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "scheduled": "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  "cancelled": "bg-red-500/10 text-red-700 border-red-200",
  "completed": "bg-blue-500/10 text-blue-700 border-blue-200",
  "in_progress": "bg-purple-500/10 text-purple-700 border-purple-200",
  "no_show": "bg-gray-500/10 text-gray-700 border-gray-200"
};

const statusLabels = {
  "confirmed": "Confirmado",
  "scheduled": "Agendado",
  "cancelled": "Cancelado",
  "completed": "Realizado",
  "in_progress": "Em Andamento",
  "no_show": "Não Compareceu"
};

const statusIcons = {
  "confirmed": CheckCircle,
  "scheduled": Clock,
  "cancelled": XCircle,
  "completed": CheckCircle,
  "in_progress": AlertCircle,
  "no_show": XCircle
};

export default function Appointments() {
  const { appointments, loading, addAppointment, updateAppointmentStatus } = useAppointments();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    document.title = "Agendamentos | Gestão de Agendamentos";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Gestão de agendamentos: lista, calendário, confirmações e lembretes');
  }, []);

  const handleAddAppointment = async (data: any) => {
    try {
      await addAppointment(data);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  const confirmAppointment = async (id: string) => {
    try {
      await updateAppointmentStatus(id, 'confirmed');
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      await updateAppointmentStatus(id, 'cancelled');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const sendReminder = (appointment: any) => {
    const patientName = appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Paciente';
    const d = new Date(appointment.scheduled_date);
    const date = d.toISOString().split('T')[0];
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    toast({ title: 'Lembrete enviado', description: `${patientName} - ${formatDate(date)} às ${time}` });
  };

  const filteredAppointments = appointments.filter(appointment => {
    const patientName = appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : '';
    const doctorName = appointment.doctor ? `${appointment.doctor.first_name} ${appointment.doctor.last_name}` : '';
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const appointmentDate = new Date(appointment.scheduled_date).toISOString().split('T')[0];
    const matchesDate = dateFilter === "all" || appointmentDate === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: appointments.length,
    confirmados: appointments.filter(a => a.status === "confirmed").length,
    pendentes: appointments.filter(a => a.status === "scheduled").length,
    hoje: appointments.filter(a => {
      const appointmentDate = new Date(a.scheduled_date).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return appointmentDate === today;
    }).length
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando agendamentos...</div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  const uniqueDates = [...new Set(appointments.map(a => new Date(a.scheduled_date).toISOString().split('T')[0]))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">Gestão de consultas e compromissos médicos</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AppointmentForm onSubmit={handleAddAppointment} loading={loading} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.confirmados}</div>
            <p className="text-xs text-muted-foreground">agendamentos confirmados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.hoje}</div>
            <p className="text-xs text-muted-foreground">consultas para hoje</p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Buscar por paciente, médico ou especialidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="completed">Realizado</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="no_show">Não Compareceu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Datas</SelectItem>
                {uniqueDates.map(date => (
                  <SelectItem key={date} value={date}>{formatDate(date)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => {
                  const StatusIcon = statusIcons[appointment.status as keyof typeof statusIcons];
                  const patientName = appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Paciente não encontrado';
                  const patientAge = appointment.patient ? calculateAge(appointment.patient.date_of_birth) : 0;
                  const doctorName = appointment.doctor ? `Dr(a). ${appointment.doctor.first_name} ${appointment.doctor.last_name}` : 'Médico não encontrado';
                  const appointmentDate = new Date(appointment.scheduled_date);
                  const appointmentTime = appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(patientName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{patientName}</div>
                            <div className="text-sm text-muted-foreground">{patientAge} anos</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{doctorName}</div>
                          <div className="text-sm text-muted-foreground">{appointment.doctor?.specialization || 'Especialização não informada'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{appointment.reason}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(appointmentDate.toISOString().split('T')[0])}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {appointmentTime} ({appointment.duration_minutes}min)
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          Consultório
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{appointment.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusColors[appointment.status as keyof typeof statusColors]}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" aria-label="Confirmar" onClick={() => confirmAppointment(appointment.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Cancelar" onClick={() => cancelAppointment(appointment.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" aria-label="Enviar lembrete" onClick={() => sendReminder(appointment)}>
                              <Bell className="h-4 w-4" />
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
    </div>
  );
}
import { useState } from "react";
import { Calendar, Clock, User, Stethoscope, FileText, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsultations } from "@/hooks/useConsultations";

const statusColors = {
  "completed": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "in_progress": "bg-blue-500/10 text-blue-700 border-blue-200",
  "scheduled": "bg-amber-500/10 text-amber-700 border-amber-200",
  "cancelled": "bg-red-500/10 text-red-700 border-red-200"
};

const statusLabels = {
  "completed": "Concluída",
  "in_progress": "Em andamento",
  "scheduled": "Agendada",
  "cancelled": "Cancelada"
};

const typeLabels = {
  "consultation": "Consulta",
  "follow_up": "Retorno",
  "emergency": "Emergência"
};

export default function Consultations() {
  const { consultations, loading, updateConsultationStatus } = useConsultations();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  const filteredConsultations = consultations.filter(consultation => {
    const patientName = `${consultation.patients?.first_name} ${consultation.patients?.last_name}`;
    const doctorName = `${consultation.staff?.first_name} ${consultation.staff?.last_name}`;
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (consultation.staff?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
    const matchesSpecialty = specialtyFilter === "all" || consultation.staff?.specialization === specialtyFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialty;
  });

  const todayStats = {
    total: consultations.length,
    concluidas: consultations.filter(c => c.status === "completed").length,
    emAndamento: consultations.filter(c => c.status === "in_progress").length,
    agendadas: consultations.filter(c => c.status === "scheduled").length
  };

  const uniqueSpecialties = [...new Set(consultations.map(c => c.staff?.specialization).filter(Boolean))];

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return { date: dateStr, time: timeStr };
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Consultas</h1>
          <p className="text-muted-foreground">Gerenciamento de consultas médicas</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{todayStats.total}</div>
            <p className="text-xs text-muted-foreground">consultas registradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <Stethoscope className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{todayStats.concluidas}</div>
            <p className="text-xs text-muted-foreground">finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayStats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">em atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <User className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{todayStats.agendadas}</div>
            <p className="text-xs text-muted-foreground">aguardando</p>
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
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Especialidades</SelectItem>
                {uniqueSpecialties.map(specialty => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consultations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Consultas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Queixa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.map((consultation) => {
                  const dateTime = formatDateTime(consultation.visit_date);
                  const patientName = `${consultation.patients?.first_name} ${consultation.patients?.last_name}`;
                  const doctorName = `${consultation.staff?.first_name} ${consultation.staff?.last_name}`;
                  
                  return (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{patientName}</div>
                          <div className="text-sm text-muted-foreground">
                            Código: {consultation.patients?.patient_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{consultation.visit_code}</TableCell>
                      <TableCell>{doctorName}</TableCell>
                      <TableCell>{consultation.staff?.specialization || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dateTime.date}</div>
                          <div className="text-sm text-muted-foreground">{dateTime.time}</div>
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[consultation.visit_type] || consultation.visit_type}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusColors[consultation.status]}
                        >
                          {statusLabels[consultation.status] || consultation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {consultation.chief_complaint}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="Ver prontuário">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Atualizar status"
                            onClick={() => {
                              const nextStatus = consultation.status === 'scheduled' ? 'in_progress' : 
                                               consultation.status === 'in_progress' ? 'completed' : 'scheduled';
                              updateConsultationStatus(consultation.id, nextStatus);
                            }}
                          >
                            <Stethoscope className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredConsultations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma consulta encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
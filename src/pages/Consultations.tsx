import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Clock, FileText, RefreshCw, Search, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsultations } from "@/hooks/useConsultations";
import { useCapabilities } from "@/auth/useCapabilities";
import { useToast } from "@/hooks/use-toast";
import { formatWaitingTime, getManchesterColorInfo, type ManchesterColor } from "@/types/triage";

const statusLabels = {
  WAITING_DOCTOR: "Aguardando médico",
  IN_PROGRESS: "Em atendimento",
} as const;

const statusClasses = {
  WAITING_DOCTOR: "bg-amber-500/10 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-500/10 text-blue-700 border-blue-200",
} as const;

export default function Consultations() {
  const { consultations, loading, startAttendance, refetch } = useConsultations();
  const { canStartAttendance } = useCapabilities();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "WAITING_DOCTOR" | "IN_PROGRESS">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [startingId, setStartingId] = useState<string | null>(null);

  const filteredConsultations = useMemo(
    () =>
      consultations.filter((consultation) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
          search.length === 0 ||
          consultation.patientName.toLowerCase().includes(search) ||
          consultation.patientCode.toLowerCase().includes(search) ||
          (consultation.serviceName ?? "").toLowerCase().includes(search) ||
          (consultation.areaName ?? "").toLowerCase().includes(search);

        const matchesStatus = statusFilter === "all" || consultation.status === statusFilter;
        const matchesService =
          serviceFilter === "all" || (consultation.serviceName ?? "Sem serviço definido") === serviceFilter;

        return matchesSearch && matchesStatus && matchesService;
      }),
    [consultations, searchTerm, serviceFilter, statusFilter]
  );

  const queueStats = useMemo(() => {
    const waiting = consultations.filter((item) => item.status === "WAITING_DOCTOR");
    const inProgress = consultations.filter((item) => item.status === "IN_PROGRESS");
    const averageWait = waiting.length
      ? Math.round(waiting.reduce((total, item) => total + item.waitingTimeMinutes, 0) / waiting.length)
      : 0;

    return {
      total: consultations.length,
      waiting: waiting.length,
      inProgress: inProgress.length,
      averageWait,
    };
  }, [consultations]);

  const uniqueServices = useMemo(
    () =>
      Array.from(
        new Set(consultations.map((item) => item.serviceName ?? "Sem serviço definido"))
      ).sort((a, b) => a.localeCompare(b)),
    [consultations]
  );

  const handleStartAttendance = async (visitId: string) => {
    try {
      setStartingId(visitId);
      await startAttendance(visitId);
      toast({
        title: "Atendimento iniciado",
        description: "A fila médica foi atualizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível iniciar o atendimento",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setStartingId(null);
    }
  };

  const renderPriorityBadge = (triageColor: ManchesterColor | null) => {
    if (!triageColor) {
      return <Badge variant="outline">Sem classificação</Badge>;
    }

    const color = getManchesterColorInfo(triageColor);
    return (
      <Badge variant="outline" className={color.borderColor}>
        {color.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fila Médica</h1>
          <p className="text-muted-foreground">
            Atendimentos aguardando médico ou já iniciados no plantão atual.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar fila
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total na fila</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{queueStats.total}</div>
            <p className="text-xs text-muted-foreground">atendimentos visíveis para este usuário</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando médico</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{queueStats.waiting}</div>
            <p className="text-xs text-muted-foreground">prontos para avaliação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em atendimento</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{queueStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">consultas já assumidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espera média</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatWaitingTime(queueStats.averageWait)}
            </div>
            <p className="text-xs text-muted-foreground">considerando quem ainda aguarda médico</p>
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
                  placeholder="Buscar por paciente, código, serviço ou área..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="WAITING_DOCTOR">Aguardando médico</SelectItem>
                <SelectItem value="IN_PROGRESS">Em atendimento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {uniqueServices.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atendimentos do Plantão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Espera</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.map((consultation) => {
                  const entryAt = new Date(consultation.visit_date);
                  const dateLabel = entryAt.toLocaleDateString("pt-BR");
                  const timeLabel = entryAt.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <TableRow key={consultation.id}>
                      <TableCell className="font-medium">{consultation.patientName}</TableCell>
                      <TableCell>{consultation.patientCode}</TableCell>
                      <TableCell>{renderPriorityBadge(consultation.triageColor)}</TableCell>
                      <TableCell>{consultation.serviceName ?? "Sem serviço definido"}</TableCell>
                      <TableCell>{consultation.areaName ?? "Sem área definida"}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{dateLabel}</div>
                          <div className="text-sm text-muted-foreground">{timeLabel}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatWaitingTime(consultation.waitingTimeMinutes)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusClasses[consultation.status]}>
                          {statusLabels[consultation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {consultation.status === "WAITING_DOCTOR" && canStartAttendance && (
                            <Button
                              size="sm"
                              onClick={() => handleStartAttendance(consultation.id)}
                              disabled={startingId === consultation.id}
                            >
                              {startingId === consultation.id ? "Iniciando..." : "Iniciar"}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ver prontuário"
                            onClick={() => navigate(`/medical-records?visitId=${consultation.id}`)}
                          >
                            <FileText className="h-4 w-4" />
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
              Nenhum atendimento da fila médica corresponde aos filtros atuais.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

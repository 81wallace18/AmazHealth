import { useEffect, useState } from "react";
import { Plus, Search, Eye, TestTube, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLaboratory } from "@/hooks/useLaboratory";
import { useCapabilities } from "@/auth/useCapabilities";
import { patientService } from "@/services/patientService";
import staffService from "@/services/staffService";
import type { Patient } from "@/types/patient";
import type { Staff } from "@/services/staffService";
import { useToast } from "@/hooks/use-toast";

const statusColors = {
  SOLICITADO: "bg-amber-500/10 text-amber-700 border-amber-200",
  COLETADO: "bg-blue-500/10 text-blue-700 border-blue-200",
  LAUDADO: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  CANCELADO: "bg-red-500/10 text-red-700 border-red-200"
};

const statusLabels = {
  SOLICITADO: "Solicitado",
  COLETADO: "Coletado",
  LAUDADO: "Laudado",
  CANCELADO: "Cancelado"
};

export default function Laboratory() {
  const { orders, loading, error, reload, createTestOrder } = useLaboratory();
  const capabilities = useCapabilities();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [doctorOptions, setDoctorOptions] = useState<Staff[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [testCode, setTestCode] = useState("");
  const [testName, setTestName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Laboratório | Gestão de Exames";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Gestão de exames laboratoriais: pedidos, coletas e resultados');
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await staffService.findActiveDoctors();
        setDoctorOptions(data);
      } catch (err: any) {
        toast({
          title: "Não foi possível carregar médicos",
          description: err?.message || "Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    };
    void loadDoctors();
  }, [toast]);

  const handleSearchPatients = async () => {
    const query = patientQuery.trim();
    if (!query) {
      setPatientResults([]);
      return;
    }

    setPatientsLoading(true);
    try {
      const response = await patientService.search({ query, page: 0, size: 10 });
      setPatientResults(response.content);
    } catch (err: any) {
      toast({
        title: "Erro ao buscar pacientes",
        description: err?.message || "Não foi possível buscar pacientes.",
        variant: "destructive"
      });
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedPatientId || !testCode || !testName) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o paciente e preencha código e nome do exame.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await createTestOrder({
        patientId: selectedPatientId,
        requestedById: selectedDoctorId || undefined,
        testCode,
        testName,
        notes: notes || undefined
      });

      toast({
        title: "Exame solicitado",
        description: "O pedido foi criado com sucesso."
      });

      setIsFormOpen(false);
      setPatientQuery("");
      setPatientResults([]);
      setSelectedPatientId("");
      setSelectedDoctorId("");
      setTestCode("");
      setTestName("");
      setNotes("");
      await reload();
    } catch (err: any) {
      toast({
        title: "Erro ao solicitar exame",
        description: err?.message || "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.testCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.requestedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    requested: orders.filter((o) => o.status === "SOLICITADO").length,
    collected: orders.filter((o) => o.status === "COLETADO").length,
    reported: orders.filter((o) => o.status === "LAUDADO").length,
    cancelled: orders.filter((o) => o.status === "CANCELADO").length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Laboratório</h1>
          <p className="text-muted-foreground">Gestão de exames e resultados laboratoriais</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={!capabilities.canRequestExams}
              title={!capabilities.canRequestExams ? "Você não tem permissão para solicitar exames" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Exame
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Solicitar exame</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar paciente *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome, CPF, CNS ou código do paciente"
                    value={patientQuery}
                    onChange={(event) => setPatientQuery(event.target.value)}
                  />
                  <Button variant="outline" onClick={handleSearchPatients} disabled={patientsLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientResults.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} • {patient.patientCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Médico solicitante</label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorOptions.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.firstName} {doctor.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código do exame *</label>
                  <Input value={testCode} onChange={(event) => setTestCode(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do exame *</label>
                  <Input value={testName} onChange={(event) => setTestName(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Informações clínicas relevantes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOrder} disabled={submitting}>
                {submitting ? "Salvando..." : "Solicitar exame"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Exames</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">requisições ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitados</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.requested}</div>
            <p className="text-xs text-muted-foreground">aguardando coleta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coletados</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.collected}</div>
            <p className="text-xs text-muted-foreground">em processamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laudados</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.reported}</div>
            <p className="text-xs text-muted-foreground">resultados prontos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">não realizados</p>
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
                  placeholder="Buscar por paciente, exame ou solicitante..."
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
                <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                <SelectItem value="COLETADO">Coletado</SelectItem>
                <SelectItem value="LAUDADO">Laudado</SelectItem>
                <SelectItem value="CANCELADO">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exames Laboratoriais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Carregando exames...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Nenhum exame encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Exame</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Data Pedido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.testCode}</TableCell>
                      <TableCell>{order.testName}</TableCell>
                      <TableCell>{order.patientName}</TableCell>
                      <TableCell>{order.requestedByName || "—"}</TableCell>
                      <TableCell>
                        {order.requestedAt ? new Date(order.requestedAt).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[order.status as keyof typeof statusColors]}
                        >
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" title="Visualizar">
                          <Eye className="h-4 w-4" />
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
    </div>
  );
}

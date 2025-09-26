import { useState, useEffect } from "react";
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

export default function MedicalRecords() {
  const { records, loading, createRecord } = useMedicalRecords();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    document.title = "Prontuários Médicos | Gestão de Prontuários";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Gestão de prontuários médicos: registros, consultas e histórico médico');
  }, []);

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prontuários Médicos</h1>
          <p className="text-muted-foreground">Gestão completa de registros médicos dos pacientes</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Novo Prontuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* MedicalRecordForm component would go here */}
            <div className="p-6 text-center">
              <p>Formulário de prontuário em desenvolvimento</p>
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

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Prontuários</TabsTrigger>
          <TabsTrigger value="analytics">Relatórios</TabsTrigger>
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
                              {formatDate(record.record_date)}
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
      </Tabs>
    </div>
  );
}
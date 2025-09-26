import { useState } from "react";
import { CreditCard, Plus, Search, DollarSign, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillsManagement } from "@/hooks/useBillsManagement";

const statusColors = {
  "paid": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "pending": "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  "overdue": "bg-red-500/10 text-red-700 border-red-200",
  "cancelled": "bg-gray-500/10 text-gray-700 border-gray-200",
  "partial": "bg-blue-500/10 text-blue-700 border-blue-200"
};

const statusIcons = {
  "paid": CheckCircle,
  "pending": Clock,
  "overdue": AlertCircle,
  "cancelled": FileText,
  "partial": Clock
};

const statusLabels = {
  "paid": "Pago",
  "pending": "Pendente",
  "overdue": "Vencido",
  "cancelled": "Cancelado",
  "partial": "Parcial"
};

export default function Billing() {
  const { bills, loading, updateBillStatus } = useBillsManagement();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBills = bills.filter(bill => {
    const patientName = `${bill.patients?.first_name} ${bill.patients?.last_name}`;
    
    const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.patients?.patient_code?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bills.length,
    totalReceita: bills.filter(b => b.status === "paid").reduce((sum, b) => sum + b.total_amount, 0),
    pendentes: bills.filter(b => b.status === "pending").length,
    vencidos: bills.filter(b => b.status === "overdue").length,
    pagos: bills.filter(b => b.status === "paid").length,
    receitaPendente: bills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.total_amount, 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('pt-BR');
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-foreground">Faturamento</h1>
          <p className="text-muted-foreground">Gestão financeira e cobrança de serviços</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Fatura
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Faturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">faturas emitidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats.totalReceita)}</div>
            <p className="text-xs text-muted-foreground">recebido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.pagos}</div>
            <p className="text-xs text-muted-foreground">faturas quitadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.vencidos}</div>
            <p className="text-xs text-muted-foreground">em atraso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.receitaPendente)}</div>
            <p className="text-xs text-muted-foreground">valor pendente</p>
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
                  placeholder="Buscar por paciente ou número da fatura..."
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
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Código Paciente</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Valor Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => {
                  const StatusIcon = statusIcons[bill.status];
                  const patientName = `${bill.patients?.first_name} ${bill.patients?.last_name}`;
                  
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-sm">
                        {bill.bill_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{patientName}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {bill.patients?.id?.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{bill.patients?.patient_code}</TableCell>
                      <TableCell>{formatDate(bill.bill_date)}</TableCell>
                      <TableCell>{formatDate(bill.due_date || '')}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(bill.total_amount)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {bill.discount_amount > 0 ? `-${formatCurrency(bill.discount_amount)}` : "-"}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">
                        {formatCurrency(bill.total_amount - bill.discount_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusColors[bill.status]}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[bill.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="Ver detalhes">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Marcar como pago"
                            onClick={() => {
                              if (bill.status === 'pending') {
                                updateBillStatus(bill.id, 'paid', 'Dinheiro');
                              }
                            }}
                            disabled={bill.status === 'paid'}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredBills.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma fatura encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Plus, Search, DollarSign, FileText, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useBillsManagement } from "@/hooks/useBillsManagement";
import { useCapabilities } from "@/auth/useCapabilities";
import { patientService } from "@/services/patientService";
import type { Bill, BillStatus } from "@/types/billing";
import type { Patient } from "@/types/patient";

const statusColors: Record<BillStatus, string> = {
  PAID: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  PENDING: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  OVERDUE: "bg-red-500/10 text-red-700 border-red-200",
  CANCELLED: "bg-gray-500/10 text-gray-700 border-gray-200",
  PARTIAL: "bg-blue-500/10 text-blue-700 border-blue-200"
};

const statusIcons: Record<BillStatus, typeof CheckCircle> = {
  PAID: CheckCircle,
  PENDING: Clock,
  OVERDUE: AlertCircle,
  CANCELLED: FileText,
  PARTIAL: Clock
};

const statusLabels: Record<BillStatus, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
  PARTIAL: "Parcial"
};

const parseAmount = (value: string) => {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function Billing() {
  const { bills, loading, updateBillStatus, createBill } = useBillsManagement();
  const capabilities = useCapabilities();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BillStatus>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    patientId: "",
    billDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    subtotal: "",
    taxAmount: "",
    discountAmount: "",
    totalAmount: "",
    paymentMethod: "",
    notes: ""
  });

  useEffect(() => {
    if (!isCreateOpen) return;
    if (patients.length > 0) return;
    setLoadingPatients(true);
    patientService.list(0, 50)
      .then((page) => setPatients(page.content ?? []))
      .finally(() => setLoadingPatients(false));
  }, [isCreateOpen, patients.length]);

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const patientName = bill.patientName ?? "";
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalReceita = bills
      .filter(b => b.status === "PAID")
      .reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);
    const receitaPendente = bills
      .filter(b => b.status === "PENDING")
      .reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0);

    return {
      total: bills.length,
      totalReceita,
      pendentes: bills.filter(b => b.status === "PENDING").length,
      vencidos: bills.filter(b => b.status === "OVERDUE").length,
      pagos: bills.filter(b => b.status === "PAID").length,
      receitaPendente
    };
  }, [bills]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const resetForm = () => {
    setFormError(null);
    setFormState({
      patientId: "",
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      subtotal: "",
      taxAmount: "",
      discountAmount: "",
      totalAmount: "",
      paymentMethod: "",
      notes: ""
    });
  };

  const handleCreate = async () => {
    if (!formState.patientId || !formState.billDate) {
      setFormError("Paciente e data da fatura são obrigatórios.");
      return;
    }

    const subtotal = parseAmount(formState.subtotal);
    const taxAmount = parseAmount(formState.taxAmount);
    const discountAmount = parseAmount(formState.discountAmount);
    const totalAmountInput = parseAmount(formState.totalAmount);
    const calculatedTotal = (subtotal ?? 0) + (taxAmount ?? 0) - (discountAmount ?? 0);
    const totalAmount = totalAmountInput ?? (calculatedTotal > 0 ? calculatedTotal : null);

    await createBill({
      patientId: formState.patientId,
      billDate: formState.billDate,
      dueDate: formState.dueDate || null,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: formState.paymentMethod || null,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Faturamento</h1>
          <p className="text-muted-foreground">Gestão financeira e cobrança de serviços</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-primary/90"
              disabled={!capabilities.canManageBilling}
              title={!capabilities.canManageBilling ? "Você não tem permissão para gerenciar faturamento" : ""}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Fatura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Fatura</DialogTitle>
              <DialogDescription>Preencha os dados básicos para criar a cobrança.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Paciente</label>
                <Select
                  value={formState.patientId}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPatients ? "Carregando..." : "Selecione o paciente"} />
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
                <label className="text-sm font-medium">Data da Fatura</label>
                <Input
                  type="date"
                  value={formState.billDate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, billDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vencimento</label>
                <Input
                  type="date"
                  value={formState.dueDate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtotal</label>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formState.subtotal}
                  onChange={(event) => setFormState((prev) => ({ ...prev, subtotal: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Impostos</label>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formState.taxAmount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, taxAmount: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descontos</label>
                <Input
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formState.discountAmount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, discountAmount: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total</label>
                <Input
                  inputMode="decimal"
                  placeholder="Calculado automaticamente"
                  value={formState.totalAmount}
                  onChange={(event) => setFormState((prev) => ({ ...prev, totalAmount: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Método de Pagamento</label>
                <Input
                  placeholder="Dinheiro, Cartão, PIX..."
                  value={formState.paymentMethod}
                  onChange={(event) => setFormState((prev) => ({ ...prev, paymentMethod: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  rows={3}
                  placeholder="Detalhes adicionais sobre a cobrança"
                  value={formState.notes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
            </div>
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!capabilities.canManageBilling}>Criar Fatura</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | BillStatus)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
                {filteredBills.map((bill: Bill) => {
                  const StatusIcon = statusIcons[bill.status];
                  const total = Number(bill.totalAmount ?? 0);
                  const discount = Number(bill.discountAmount ?? 0);

                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono text-sm">
                        {bill.billNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{bill.patientName ?? "Paciente não informado"}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {bill.patientId?.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(bill.billDate)}</TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {discount > 0 ? `-${formatCurrency(discount)}` : "-"}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">
                        {formatCurrency(total - discount)}
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
                              if (bill.status === 'PENDING') {
                                updateBillStatus(bill.id, 'PAID', 'Dinheiro', total);
                              }
                            }}
                            disabled={bill.status === 'PAID' || !capabilities.canManageBilling}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Cancelar fatura"
                            onClick={() => {
                              updateBillStatus(bill.id, 'CANCELLED', undefined, undefined, 'Cancelada via tela de faturamento');
                            }}
                            disabled={
                              bill.status === 'PAID' ||
                              bill.status === 'CANCELLED' ||
                              !capabilities.canManageBilling
                            }
                          >
                            <XCircle className="h-4 w-4" />
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

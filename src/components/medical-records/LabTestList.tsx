import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import labTestService from '@/services/labTestService';
import type { LabTestOrder, LabTestStatus } from '@/types/labTest';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Loader2, FlaskConical } from 'lucide-react';

const statusLabels: Record<LabTestStatus, string> = {
  SOLICITADO: 'Solicitado',
  COLETADO: 'Coletado',
  LAUDADO: 'Laudado',
  CANCELADO: 'Cancelado',
};

const statusStyles: Record<LabTestStatus, string> = {
  SOLICITADO: 'bg-blue-100 text-blue-800',
  COLETADO: 'bg-amber-100 text-amber-900',
  LAUDADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-700',
};

type StatusFilter = 'ALL' | LabTestStatus;

interface LabTestListProps {
  patientId: string;
  visitId?: string;
  version?: number;
}

export function LabTestList({ patientId, visitId, version = 0 }: LabTestListProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabTestOrder | null>(null);
  const [statusValue, setStatusValue] = useState<LabTestStatus>('SOLICITADO');
  const [resultValue, setResultValue] = useState('');
  const [notesValue, setNotesValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const queryKey = visitId
    ? ['lab-tests', 'visit', visitId, version]
    : ['lab-tests', 'patient', patientId, version];

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      if (visitId) {
        return labTestService.findByVisit(visitId);
      }
      const response = await labTestService.findByPatient(patientId);
      return response.content;
    },
    enabled: Boolean(patientId),
  });

  useEffect(() => {
    if (selectedOrder) {
      setStatusValue(selectedOrder.status);
      setResultValue(selectedOrder.result || '');
      setNotesValue(selectedOrder.notes || '');
    }
  }, [selectedOrder]);

  const filteredOrders = useMemo(() => {
    if (!data) return [];
    if (statusFilter === 'ALL') return data;
    return data.filter((order) => order.status === statusFilter);
  }, [data, statusFilter]);

  const openStatusDialog = (order: LabTestOrder) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);

    try {
      await labTestService.updateStatus(selectedOrder.id, {
        status: statusValue,
        result: resultValue?.trim() || undefined,
        notes: notesValue?.trim() || undefined,
      });
      toast.success('Status do exame atualizado.');
      setStatusDialogOpen(false);
      await refetch();
      await queryClient.invalidateQueries({ queryKey });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Não foi possível atualizar o exame.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!patientId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
          Erro ao carregar exames laboratoriais.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Exames laboratoriais
            </CardTitle>
            <CardDescription>
              Histórico de exames solicitados e resultados.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os status</SelectItem>
                {Object.entries(statusLabels).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <FlaskConical className="h-10 w-10" />
              Nenhum exame encontrado para este paciente.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exame</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Solicitado em</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.testName}</div>
                      <div className="text-sm text-muted-foreground">Código: {order.testCode}</div>
                      {order.requestedByName && (
                        <div className="text-xs text-muted-foreground">
                          Solicitado por {order.requestedByName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.requestedAt
                        ? format(new Date(order.requestedAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="max-w-sm">
                      {order.result ? (
                        <p className="line-clamp-2 text-sm text-foreground">{order.result}</p>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sem resultado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openStatusDialog(order)}>
                        Atualizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar status do exame</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusValue}
                onValueChange={(value) => setStatusValue(value as LabTestStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <SelectItem key={status} value={status}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Resultado</label>
              <Textarea
                placeholder="Informe o resultado do exame (opcional)"
                rows={4}
                value={resultValue}
                onChange={(event) => setResultValue(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                placeholder="Observações adicionais (opcional)"
                value={notesValue}
                onChange={(event) => setNotesValue(event.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStatusDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateStatus} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


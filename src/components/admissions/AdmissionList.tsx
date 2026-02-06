import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BedDouble,
  CheckCircle,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Siren,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

import { admissionService } from '@/services/admissionService';
import type { Admission, AdmissionStatus, Bed, DischargeRequest } from '@/types/admission';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const statusFilters: { value: 'ALL' | AdmissionStatus; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'AWAITING_BED', label: 'Aguardando leito' },
  { value: 'BED_ASSIGNED', label: 'Leito atribuído' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'DISCHARGED', label: 'Altas' },
  { value: 'TRANSFERRED', label: 'Transferidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

const dischargeSchema = z.object({
  dischargeDisposition: z.string().min(1, 'Informe o desfecho da alta'),
  dischargeInstructions: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpInstructions: z.string().optional(),
});

export function AdmissionList() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]['value']>('ALL');
  const [search, setSearch] = useState('');
  const [detailsAdmission, setDetailsAdmission] = useState<Admission | null>(null);
  const [allocationAdmission, setAllocationAdmission] = useState<Admission | null>(null);
  const [dischargeAdmission, setDischargeAdmission] = useState<Admission | null>(null);

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const attendanceIdToOpen = searchParams.get('attendanceId');

  const admissionsQuery = useQuery({
    queryKey: ['admissions', { page, statusFilter }],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (statusFilter === 'ALL') {
        return admissionService.findAll({ page, size: 20 });
      }
      const content = await admissionService.findByStatus(statusFilter);
      return {
        content,
        totalElements: content.length,
        totalPages: 1,
        number: 0,
        size: content.length || 1,
      };
    },
  });

  useEffect(() => {
    if (!attendanceIdToOpen) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const admission = await admissionService.findByAttendanceId(attendanceIdToOpen);
        if (cancelled) return;
        setDetailsAdmission(admission);
      } catch (error) {
        if (cancelled) return;
        console.error('Erro ao buscar internação pelo atendimento:', error);
        toast.error('Não foi possível localizar a internação vinculada a este atendimento.');
      } finally {
        if (!cancelled) {
          const next = new URLSearchParams(searchParams);
          next.delete('attendanceId');
          setSearchParams(next, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attendanceIdToOpen, searchParams, setSearchParams]);

  const admissions = useMemo(() => {
    const list = admissionsQuery.data?.content ?? [];
    if (!search.trim()) {
      return list;
    }
    const term = search.toLowerCase();
    return list.filter(
      (item) =>
        item.patientName?.toLowerCase().includes(term) ||
        item.admissionNumber?.toLowerCase().includes(term) ||
        item.attendingPhysicianName?.toLowerCase().includes(term)
    );
  }, [admissionsQuery.data, search]);

  const invalidateAdmissions = () => {
    queryClient.invalidateQueries({ queryKey: ['admissions'] });
    queryClient.invalidateQueries({ queryKey: ['bed-board'] });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">Internações</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as internações e execute ações rápidas.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => admissionsQuery.refetch()} disabled={admissionsQuery.isFetching}>
          <RefreshCw className={`h-4 w-4 ${admissionsQuery.isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Buscar por paciente, código ou médico"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'ALL' | AdmissionStatus)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Página {Math.max((admissionsQuery.data?.number ?? 0) + 1, 1)} de{' '}
            {admissionsQuery.data?.totalPages ?? 1}
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Leito</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissionsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Carregando internações...
                  </TableCell>
                </TableRow>
              )}
              {!admissionsQuery.isLoading && admissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma internação encontrada.
                  </TableCell>
                </TableRow>
              )}
              {admissions.map((admission) => (
                <TableRow key={admission.id}>
                  <TableCell className="font-mono text-xs">{admission.admissionNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{admission.patientName}</div>
                    <div className="text-xs text-muted-foreground">{admission.patientCpf}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{admission.attendingPhysicianName}</div>
                    <div className="text-xs text-muted-foreground">{admission.attendingPhysicianId}</div>
                  </TableCell>
                  <TableCell>
                    {admission.bedIdentifier ? (
                      <div>
                        <div className="font-medium">{admission.bedIdentifier}</div>
                        <div className="text-xs text-muted-foreground">{admission.wardName}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Sem leito</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(admission.admissionDate), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={admission.admissionStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setDetailsAdmission(admission);
                          }}
                        >
                          Ver detalhes
                        </DropdownMenuItem>
                        {(admission.admissionStatus === 'AWAITING_BED' ||
                          admission.admissionStatus === 'PENDING_TRANSFER') && (
                          <DropdownMenuItem
                            onClick={() => {
                              setAllocationAdmission(admission);
                            }}
                          >
                            <BedDouble className="h-4 w-4 mr-2" />
                            Alocar leito
                          </DropdownMenuItem>
                        )}
                        {admission.admissionStatus === 'BED_ASSIGNED' ||
                        admission.admissionStatus === 'ACTIVE' ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setDischargeAdmission(admission);
                            }}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Registrar alta
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 0 || statusFilter !== 'ALL'}
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={
              statusFilter !== 'ALL' ||
              !admissionsQuery.data ||
              admissionsQuery.data.number + 1 >= (admissionsQuery.data.totalPages ?? 1)
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Próxima
          </Button>
        </div>
      </CardContent>

      <AdmissionDetailsDialog
        admission={detailsAdmission}
        onOpenChange={(open) => !open && setDetailsAdmission(null)}
      />

      <AllocateBedDialog
        admission={allocationAdmission}
        onOpenChange={(open) => !open && setAllocationAdmission(null)}
        onSuccess={() => {
          setAllocationAdmission(null);
          invalidateAdmissions();
        }}
      />

      <DischargeDialog
        admission={dischargeAdmission}
        onOpenChange={(open) => !open && setDischargeAdmission(null)}
        onSuccess={() => {
          setDischargeAdmission(null);
          invalidateAdmissions();
        }}
      />
    </Card>
  );
}

function StatusBadge({ status }: { status: AdmissionStatus }) {
  const variants: Record<AdmissionStatus, 'default' | 'outline' | 'secondary' | 'destructive'> = {
    AWAITING_BED: 'outline',
    BED_ASSIGNED: 'default',
    ACTIVE: 'default',
    DISCHARGED: 'secondary',
    TRANSFERRED: 'secondary',
    CANCELLED: 'destructive',
    PENDING_TRANSFER: 'outline',
  };

  const labels: Record<AdmissionStatus, string> = {
    AWAITING_BED: 'Aguardando leito',
    BED_ASSIGNED: 'Leito atribuído',
    ACTIVE: 'Ativa',
    DISCHARGED: 'Alta',
    TRANSFERRED: 'Transferida',
    CANCELLED: 'Cancelada',
    PENDING_TRANSFER: 'Transferência pendente',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

interface DetailsDialogProps {
  admission: Admission | null;
  onOpenChange: (open: boolean) => void;
}

function AdmissionDetailsDialog({ admission, onOpenChange }: DetailsDialogProps) {
  return (
    <Dialog open={!!admission} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da internação</DialogTitle>
          <DialogDescription>Informações completas do paciente e da internação.</DialogDescription>
        </DialogHeader>
        {admission && (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div>
                <Label>Código</Label>
                <p className="font-mono text-sm">{admission.admissionNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Paciente</Label>
                  <p className="font-semibold">{admission.patientName}</p>
                  <p className="text-sm text-muted-foreground">{admission.patientCpf}</p>
                </div>
                <div>
                  <Label>Médico responsável</Label>
                  <p className="font-semibold">{admission.attendingPhysicianName}</p>
                </div>
              </div>
              <div>
                <Label>Motivo da internação</Label>
                <p>{admission.admissionReason}</p>
              </div>
              {admission.diagnosisOnAdmission && (
                <div>
                  <Label>Diagnóstico inicial</Label>
                  <p>{admission.diagnosisOnAdmission}</p>
                </div>
              )}
              {admission.clinicalSummary && (
                <div>
                  <Label>Resumo clínico</Label>
                  <p>{admission.clinicalSummary}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de entrada</Label>
                  <p>{format(new Date(admission.admissionDate), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                {admission.actualDischargeDate && (
                  <div>
                    <Label>Data de alta</Label>
                    <p>{format(new Date(admission.actualDischargeDate), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                )}
              </div>
              {admission.bedIdentifier ? (
                <div>
                  <Label>Leito</Label>
                  <p>
                    {admission.bedIdentifier} — {admission.wardName}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <Siren className="h-4 w-4" />
                  Aguardando alocação de leito
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AllocateBedDialogProps {
  admission: Admission | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function AllocateBedDialog({ admission, onOpenChange, onSuccess }: AllocateBedDialogProps) {
  const [selectedBed, setSelectedBed] = useState<string>('');
  const bedsQuery = useQuery({
    queryKey: ['bed-board', 'available', 'allocation'],
    enabled: !!admission,
    queryFn: async () => {
      const wards = await admissionService.getBedBoard();
      return wards.flatMap((ward) => ward.beds.filter((bed) => bed.available));
    },
  });

  const handleAllocate = async () => {
    if (!admission || !selectedBed) return;
    try {
      await admissionService.allocateBed({
        admissionId: admission.id,
        bedId: selectedBed,
        reason: 'Alocação manual via painel de internações',
      });
      toast.success('Leito alocado com sucesso.');
      setSelectedBed('');
      onSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Não foi possível alocar o leito.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={!!admission} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alocar leito</DialogTitle>
          <DialogDescription>
            Selecione um leito disponível para o paciente {admission?.patientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Leito disponível</Label>
            <Select
              value={selectedBed}
              onValueChange={setSelectedBed}
              disabled={bedsQuery.isLoading || (bedsQuery.data?.length ?? 0) === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={bedsQuery.isLoading ? 'Carregando...' : 'Selecione o leito'} />
              </SelectTrigger>
              <SelectContent>
                {bedsQuery.data?.map((bed: Bed) => (
                  <SelectItem key={bed.id} value={bed.id}>
                    {bed.fullBedIdentifier || bed.bedNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAllocate} disabled={!selectedBed} className="w-full">
            {bedsQuery.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar alocação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DischargeDialogProps {
  admission: Admission | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function DischargeDialog({ admission, onOpenChange, onSuccess }: DischargeDialogProps) {
  const form = useForm<DischargeRequest>({
    resolver: zodResolver(dischargeSchema),
    defaultValues: {
      dischargeDisposition: '',
      dischargeInstructions: '',
      followUpRequired: false,
      followUpInstructions: '',
    },
  });

  const handleSubmit = async (values: DischargeRequest) => {
    if (!admission) return;
    try {
      await admissionService.discharge(admission.id, values);
      toast.success('Alta registrada com sucesso.');
      onSuccess();
      form.reset();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Não foi possível registrar a alta.';
      toast.error(message);
    }
  };

  return (
    <Dialog open={!!admission} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar alta</DialogTitle>
          <DialogDescription>
            Conclua a internação do paciente {admission?.patientName} informando as orientações finais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dischargeDisposition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desfecho *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Alta médica, transferência, óbito" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dischargeInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orientações / Resumo</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Instruções para o paciente ou família" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="followUpRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Necessita acompanhamento?</FormLabel>
                    <p className="text-sm text-muted-foreground">Define se deve agendar retorno/visita.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('followUpRequired') && (
              <FormField
                control={form.control}
                name="followUpInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções de acompanhamento</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Ex.: Retorno em 7 dias com cardiologia" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirmar alta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, Stethoscope } from 'lucide-react';
import prescriptionService from '@/services/prescriptionService';
import type { Prescription, PrescriptionStatus } from '@/types/prescription';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type StatusFilter = 'ALL' | PrescriptionStatus;

const statusLabels: Record<PrescriptionStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  DISPENSED: 'Dispensada',
  REJECTED: 'Recusada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

const statusStyles: Record<PrescriptionStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  DISPENSED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-amber-100 text-amber-900',
};

interface PrescriptionListProps {
  patientId: string;
  version?: number;
  onError?: (message: string) => void;
}

export function PrescriptionList({ patientId, version = 0, onError }: PrescriptionListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['prescriptions', 'patient', patientId, version],
    queryFn: async () => {
      const response = await prescriptionService.findByPatient(patientId);
      return response;
    },
    enabled: Boolean(patientId),
    staleTime: 30_000,
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Falha ao carregar prescrições.';
      toast.error(message);
      onError?.(message);
    },
  });

  const prescriptions = data?.content ?? [];

  const filteredPrescriptions = useMemo(() => {
    if (statusFilter === 'ALL') return prescriptions;
    return prescriptions.filter((prescription) => prescription.status === statusFilter);
  }, [prescriptions, statusFilter]);

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

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Stethoscope className="h-10 w-10" />
          Nenhuma prescrição encontrada para este paciente.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Prescrições médicas</CardTitle>
          <CardDescription>Histórico de prescrições e itens associados.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {(Object.keys(statusLabels) as PrescriptionStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPrescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            Nenhuma prescrição encontrada com o filtro selecionado.
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <AccordionItem key={prescription.id} value={prescription.id}>
                <AccordionTrigger className="flex-col items-start gap-2 text-left sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <Badge className={statusStyles[prescription.status]}>
                      {statusLabels[prescription.status]}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold">
                        Prescrição {prescription.prescriptionCode || prescription.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(prescription.prescriptionDate), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}{' '}
                        · Dr(a). {prescription.doctorName}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="rounded-lg border p-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {prescription.attendanceNumber && (
                      <p>
                        Atendimento: <strong>{prescription.attendanceNumber}</strong>
                      </p>
                    )}
                    {prescription.notes && (
                      <p>
                        Notas: <strong>{prescription.notes}</strong>
                      </p>
                    )}
                  </div>

                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicamento</TableHead>
                        <TableHead>Dosagem / Frequência</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Qtd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescription.items.map((item) => (
                        <TableRow key={item.id ?? item.medicineId}>
                          <TableCell>
                            <div className="font-medium">{item.medicineName}</div>
                            {item.medicineDescription && (
                              <p className="text-xs text-muted-foreground">{item.medicineDescription}</p>
                            )}
                            <p className="text-xs text-muted-foreground capitalize">
                              Tipo:{' '}
                              {medicationTypes[item.medicationType] ||
                                item.medicationType.toLowerCase()}
                            </p>
                          </TableCell>
                          <TableCell>
                            {item.dosage} · {item.frequency}
                          </TableCell>
                          <TableCell>{item.duration}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

const medicationTypes: Record<string, string> = {
  COMMON: 'Comum',
  ANTIBIOTIC: 'Antibiótico',
  CONTROLLED: 'Controlado',
  BLOOD_COMPONENT: 'Hemocomponente',
};

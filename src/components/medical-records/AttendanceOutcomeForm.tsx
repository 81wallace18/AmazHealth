import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import attendanceService from '@/services/attendanceService';
import transferService from '@/services/transferService';
import notificationService from '@/services/notificationService';
import { medicalRecordService } from '@/services/medicalRecordService';
import staffService, { type Staff } from '@/services/staffService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { TransferDocumentForm } from './TransferDocumentForm';

const outcomeOptions = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'INTERNACAO', label: 'Internação' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'OBITO', label: 'Óbito' },
  { value: 'EVASAO', label: 'Evasão' },
] as const;

const formSchema = z
  .object({
    outcome: z.enum(['ALTA', 'INTERNACAO', 'TRANSFERENCIA', 'OBITO', 'EVASAO']),
    notes: z.string().min(1, 'Observações clínicas são obrigatórias'),
    physicianId: z.string().optional(),
    admissionReason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.outcome === 'INTERNACAO') {
      if (!data.physicianId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione o médico responsável pela internação',
          path: ['physicianId'],
        });
      }
      if (!data.admissionReason || !data.admissionReason.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o motivo da internação',
          path: ['admissionReason'],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface AttendanceOutcomeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
  patientId?: string;
  patientName?: string;
  attendanceNumber?: string;
  notificationRequired?: boolean;
  onSuccess?: () => void;
}

export function AttendanceOutcomeForm({
  open,
  onOpenChange,
  attendanceId,
  patientName,
  attendanceNumber,
  notificationRequired = false,
  onSuccess,
}: AttendanceOutcomeFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outcome: 'ALTA',
      notes: '',
      physicianId: undefined,
      admissionReason: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const response = await staffService.findActiveDoctors();
        setDoctors(response);
      } catch (error) {
        console.error('Erro ao buscar médicos ativos:', error);
        toast.error('Não foi possível carregar a lista de médicos.');
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [open]);

  const handleSubmit = async (values: FormValues) => {
    // Pre-flight: verificar se existe evolução clínica
    try {
      const records = await medicalRecordService.findByVisit(attendanceId);
      const hasEvolution = records.some((r) => r.recordType === 'EVOLUTION');
      if (!hasEvolution) {
        toast.error('Registre uma evolução clínica antes de finalizar o atendimento.', { duration: 8000 });
        return;
      }
    } catch {
      toast.error('Erro ao verificar registros médicos.', { duration: 8000 });
      return;
    }

    // Pre-flight: se notificação requerida, verificar se está completa
    if (notificationRequired) {
      try {
        const notifications = await notificationService.findByVisit(attendanceId);
        const hasCompleted = notifications.some(
          (n) => n.status === 'COMPLETED' || n.status === 'SENT'
        );
        if (!hasCompleted) {
          toast.error('Complete a notificação compulsória pendente antes de finalizar.', { duration: 8000 });
          return;
        }
      } catch {
        toast.error('Erro ao verificar notificações compulsórias.', { duration: 8000 });
        return;
      }
    }

    // Pre-flight: se transferência, verificar se documento existe
    if (values.outcome === 'TRANSFERENCIA') {
      try {
        const docs = await transferService.findByVisit(attendanceId);
        if (docs.length === 0) {
          toast.error('Preencha o documento de transferência antes de finalizar.', { duration: 8000 });
          setShowTransferForm(true);
          return;
        }
      } catch {
        toast.error('Erro ao verificar documento de transferência.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await attendanceService.finalize(attendanceId, {
        outcome: values.outcome,
        notes: values.notes.trim(),
        physicianId: values.outcome === 'INTERNACAO' ? values.physicianId : undefined,
        admissionReason:
          values.outcome === 'INTERNACAO'
            ? values.admissionReason?.trim() || undefined
            : undefined,
      });

      toast.success('Atendimento finalizado com sucesso.');
      onSuccess?.();
      onOpenChange(false);
      if (values.outcome === 'INTERNACAO') {
        navigate(`/admissions?attendanceId=${attendanceId}`);
      }
      form.reset({ outcome: 'ALTA', notes: '' });
    } catch (error: any) {
      console.error('Erro ao finalizar atendimento:', error);
      const message =
        error?.response?.data?.message || 'Não foi possível finalizar o atendimento.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TransferDocumentForm
        open={showTransferForm}
        onOpenChange={setShowTransferForm}
        attendanceId={attendanceId}
        patientName={patientName}
        onSuccess={() => {
          toast.success('Documento de transferência criado. Agora finalize o atendimento.');
        }}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar atendimento</DialogTitle>
            {patientName && (
              <DialogDescription>
                Paciente: {patientName}
                {attendanceNumber ? ` · Atendimento ${attendanceNumber}` : ''}
              </DialogDescription>
            )}
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desfecho</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o desfecho" />
                      </SelectTrigger>
                      <SelectContent>
                        {outcomeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações clínicas (obrigatório)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('outcome') === 'INTERNACAO' && (
                <>
                  <FormField
                    control={form.control}
                    name="physicianId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Médico responsável</FormLabel>
                        <Select
                          disabled={loadingDoctors}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.firstName} {doctor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {!loadingDoctors && doctors.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Nenhum médico ativo encontrado. Cadastre um profissional com papel{' '}
                            <strong>DOCTOR</strong> em <strong>Equipe Clínica</strong> antes de registrar internações.
                          </p>
                        )}
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="admissionReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo da internação</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Internação para investigação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Finalizando...' : 'Finalizar atendimento'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

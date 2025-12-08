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
import staffService, { type Staff } from '@/services/staffService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { AdmissionForm } from '@/components/admissions/AdmissionForm';

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
    notes: z.string().optional(),
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
  onSuccess?: () => void;
}

export function AttendanceOutcomeForm({
  open,
  onOpenChange,
  attendanceId,
  patientId,
  patientName,
  attendanceNumber,
  onSuccess,
}: AttendanceOutcomeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [pendingReason, setPendingReason] = useState<string | undefined>();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outcome: 'ALTA',
      notes: '',
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
    setIsSubmitting(true);
    try {
      await attendanceService.finalize(attendanceId, {
        outcome: values.outcome,
        notes: values.notes?.trim() || undefined,
        physicianId: values.outcome === 'INTERNACAO' ? values.physicianId : undefined,
        admissionReason:
          values.outcome === 'INTERNACAO'
            ? values.admissionReason?.trim() || undefined
            : undefined,
      });

      toast.success('Atendimento finalizado com sucesso.');
      onSuccess?.();
      onOpenChange(false);
      if (values.outcome === 'INTERNACAO' && patientId) {
        setPendingReason(values.admissionReason?.trim() || undefined);
        setShowAdmissionForm(true);
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
                        placeholder="Observações adicionais (opcional)"
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

      {patientId && (
        <AdmissionForm
          open={showAdmissionForm}
          onOpenChange={setShowAdmissionForm}
          defaultPatientId={patientId}
          defaultAttendanceId={attendanceId}
          defaultReason={pendingReason}
          onSuccess={() => {
            setShowAdmissionForm(false);
            toast.success('Internação criada com sucesso.');
          }}
        />
      )}
    </>
  );
}

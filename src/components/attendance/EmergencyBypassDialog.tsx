import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Patient } from '@/types/patient';
import { staffService } from '@/services/staffService';
import type { Staff } from '@/services/staffService';
import attendanceService from '@/services/attendanceService';
import { toast } from 'sonner';

const bypassSchema = z.object({
  chiefComplaint: z.string().min(3, 'Queixa principal é obrigatória'),
  bypassJustification: z
    .string()
    .min(10, 'Justificativa deve ter no mínimo 10 caracteres'),
  doctorId: z.string().optional(),
});

type BypassFormData = z.infer<typeof bypassSchema>;

interface EmergencyBypassDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmergencyBypassDialog({
  patient,
  open,
  onOpenChange,
  onSuccess,
}: EmergencyBypassDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const form = useForm<BypassFormData>({
    resolver: zodResolver(bypassSchema),
    defaultValues: {
      chiefComplaint: '',
      bypassJustification: '',
      doctorId: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const data = await staffService.findActiveDoctors();
        setDoctors(data);
      } catch {
        console.error('Erro ao carregar médicos');
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, [open]);

  const handleSubmit = async (data: BypassFormData) => {
    if (!patient) return;

    setIsSubmitting(true);
    try {
      await attendanceService.createEmergencyBypass({
        patientId: patient.id,
        doctorId: data.doctorId || undefined,
        chiefComplaint: data.chiefComplaint,
        bypassJustification: data.bypassJustification,
        visitType: 'URGENCIA',
      });

      toast.success('Bypass de emergência criado. Paciente em atendimento imediato.');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Erro ao criar bypass de emergência.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Bypass de Emergência
          </DialogTitle>
          <DialogDescription>
            Paciente crítico entra direto em atendimento. Triagem será realizada
            retrospectivamente.
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Paciente</p>
                <p className="font-semibold">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Código</p>
                <p className="font-mono font-semibold">{patient.patientCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Queixa principal *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: PCR, politrauma, dispneia grave..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bypassJustification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa do bypass *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a razão clínica para bypass do fluxo normal (mín. 10 caracteres)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Médico responsável (opcional)
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingDoctors ? 'Carregando...' : 'Selecione (opcional)'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr(a). {doctor.firstName} {doctor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                O paciente entrará direto em atendimento (IN_PROGRESS). A triagem
                Manchester deverá ser registrada retrospectivamente.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Criando...' : 'Criar Bypass de Emergência'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

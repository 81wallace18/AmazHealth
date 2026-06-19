import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import notificationService from '@/services/notificationService';
import { toast } from 'sonner';
import type { NotificationType } from '@/types/notification';

const notificationTypeOptions: { value: NotificationType; label: string }[] = [
  { value: 'ACIDENTE_TRABALHO', label: 'Acidente de trabalho' },
  { value: 'MATERIAL_PERFUROCORTANTE', label: 'Material perfurocortante' },
  { value: 'MORDEDURA_ANIMAL', label: 'Mordedura de animal' },
  { value: 'INTOXICACAO', label: 'Intoxicação' },
  { value: 'VIOLENCIA', label: 'Violência' },
  { value: 'AGRAVO_NOTIFICACAO_OBRIGATORIA', label: 'Agravo de notificação obrigatória' },
  { value: 'OUTRO', label: 'Outro' },
];

const formSchema = z.object({
  notificationType: z.enum([
    'ACIDENTE_TRABALHO',
    'MATERIAL_PERFUROCORTANTE',
    'MORDEDURA_ANIMAL',
    'INTOXICACAO',
    'VIOLENCIA',
    'AGRAVO_NOTIFICACAO_OBRIGATORIA',
    'OUTRO',
  ]),
  description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
  clinicalFindings: z.string().optional(),
  diseaseCode: z.string().optional(),
  diseaseDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CompulsoryNotificationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
  patientName?: string;
  onSuccess?: () => void;
}

export function CompulsoryNotificationForm({
  open,
  onOpenChange,
  attendanceId,
  patientName,
  onSuccess,
}: CompulsoryNotificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notificationType: 'OUTRO',
      description: '',
      clinicalFindings: '',
      diseaseCode: '',
      diseaseDescription: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await notificationService.create({
        visitId: attendanceId,
        notificationType: values.notificationType,
        description: values.description,
        clinicalFindings: values.clinicalFindings || undefined,
        diseaseCode: values.diseaseCode || undefined,
        diseaseDescription: values.diseaseDescription || undefined,
      });

      toast.success('Notificação compulsória criada com sucesso.');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Erro ao criar notificação.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notificação Compulsória</DialogTitle>
          {patientName && (
            <DialogDescription>Paciente: {patientName}</DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notificationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de notificação *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {notificationTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o agravo/evento notificável (mín. 20 caracteres)"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinicalFindings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achados clínicos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Achados clínicos relevantes"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="diseaseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código CID</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: W54" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diseaseDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da doença/agravo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Mordedura por cão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Criar Notificação'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

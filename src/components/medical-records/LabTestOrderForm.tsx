import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import labTestService from '@/services/labTestService';
import type { LabTestOrderRequest } from '@/types/labTest';

const formSchema = z.object({
  testCode: z.string().min(2, 'Informe o código do exame'),
  testName: z.string().min(3, 'Informe o nome do exame'),
  notes: z
    .string()
    .max(2000, 'Máximo de 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface LabTestOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName?: string;
  visitId?: string;
  onSuccess?: () => void;
}

export function LabTestOrderForm({
  open,
  onOpenChange,
  patientId,
  patientName,
  visitId,
  onSuccess,
}: LabTestOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testCode: '',
      testName: '',
      notes: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!patientId) {
      toast.error('Selecione um paciente para solicitar exame.');
      return;
    }

    setIsSubmitting(true);
    const payload: LabTestOrderRequest = {
      patientId,
      visitId,
      testCode: values.testCode.trim(),
      testName: values.testName.trim(),
      notes: values.notes?.trim() || undefined,
    };

    try {
      await labTestService.createOrder(payload);
      toast.success('Exame solicitado com sucesso.');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Não foi possível solicitar o exame.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset();
        }
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar exame laboratorial</DialogTitle>
          {patientName && (
            <DialogDescription>Paciente: {patientName}</DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="testCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do exame</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: HMG, GLU, PCR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="testName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do exame</FormLabel>
                  <FormControl>
                    <Input placeholder="Hemograma completo, Glicemia, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações clínicas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais para o laboratório (opcional)"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Solicitar exame'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


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
import transferService from '@/services/transferService';
import { toast } from 'sonner';

const transportOptions = [
  { value: 'AMBULANCIA', label: 'Ambulância' },
  { value: 'VEICULO_PROPRIO', label: 'Veículo próprio' },
  { value: 'TRANSPORTE_MUNICIPAL', label: 'Transporte municipal' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

const formSchema = z.object({
  clinicalSummary: z.string().min(10, 'Resumo clínico deve ter no mínimo 10 caracteres'),
  diagnosis: z.string().min(3, 'Diagnóstico é obrigatório'),
  diagnosisCode: z.string().optional(),
  proceduresPerformed: z.string().optional(),
  medicationsGiven: z.string().optional(),
  destinationName: z.string().min(3, 'Nome do destino é obrigatório'),
  destinationAddress: z.string().optional(),
  destinationPhone: z.string().optional(),
  transportType: z.enum(['AMBULANCIA', 'VEICULO_PROPRIO', 'TRANSPORTE_MUNICIPAL', 'OUTRO']).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransferDocumentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: string;
  patientName?: string;
  onSuccess?: () => void;
}

export function TransferDocumentForm({
  open,
  onOpenChange,
  attendanceId,
  patientName,
  onSuccess,
}: TransferDocumentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clinicalSummary: '',
      diagnosis: '',
      diagnosisCode: '',
      proceduresPerformed: '',
      medicationsGiven: '',
      destinationName: '',
      destinationAddress: '',
      destinationPhone: '',
    },
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await transferService.create({
        visitId: attendanceId,
        clinicalSummary: values.clinicalSummary,
        diagnosis: values.diagnosis,
        diagnosisCode: values.diagnosisCode || undefined,
        proceduresPerformed: values.proceduresPerformed || undefined,
        medicationsGiven: values.medicationsGiven || undefined,
        destinationName: values.destinationName,
        destinationAddress: values.destinationAddress || undefined,
        destinationPhone: values.destinationPhone || undefined,
        transportType: values.transportType,
      });

      toast.success('Documento de transferência criado com sucesso.');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Erro ao criar documento de transferência.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Documento de Transferência</DialogTitle>
          {patientName && (
            <DialogDescription>Paciente: {patientName}</DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clinicalSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo clínico *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Resumo do quadro clínico, evolução e conduta"
                      rows={3}
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
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico *</FormLabel>
                    <FormControl>
                      <Input placeholder="Diagnóstico principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diagnosisCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código CID</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: J18.9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="proceduresPerformed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimentos realizados</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Procedimentos durante o atendimento" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medicationsGiven"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicações administradas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Medicações administradas durante o atendimento" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">Dados do destino</h4>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="destinationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da unidade de destino *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Hospital Regional de Manaus" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço da unidade de destino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="destinationPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(92) 0000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de transporte</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {transportOptions.map((opt) => (
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
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Documento de Transferência'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

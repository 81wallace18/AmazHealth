import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import prescriptionService from '@/services/prescriptionService';
import type { MedicationType, Prescription } from '@/types/prescription';
import type { Staff } from '@/services/staffService';
import staffService from '@/services/staffService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  ControlledDrugForm,
  type ControlledDrugFormData,
} from './ControlledDrugForm';
import { BloodComponentForm, type BloodComponentFormData } from './BloodComponentForm';

const medicationTypes: { value: MedicationType; label: string }[] = [
  { value: 'COMMON', label: 'Medicamento comum' },
  { value: 'ANTIBIOTIC', label: 'Antibiótico' },
  { value: 'CONTROLLED', label: 'Controlado' },
  { value: 'BLOOD_COMPONENT', label: 'Hemocomponente' },
];

const prescriptionStatuses = ['DRAFT', 'ACTIVE'] as const;

const itemSchema = z.object({
  // ID é gerado automaticamente; o campo existe apenas para visualização
  medicineId: z.string().optional().or(z.literal('')),
  medicineName: z.string().min(2, 'Nome do medicamento é obrigatório'),
  medicineDescription: z.string().optional(),
  medicationType: z.enum(medicationTypes.map((m) => m.value) as [MedicationType, ...MedicationType[]]),
  dosage: z.string().min(1, 'Informe a dosagem'),
  frequency: z.string().min(1, 'Informe a frequência'),
  duration: z.string().min(1, 'Informe a duração'),
  quantity: z.coerce.number().min(1, 'Quantidade deve ser positiva'),
  route: z.string().optional(),
  instructions: z.string().optional(),
  immediateUse: z.boolean().optional(),
  specialControlJustification: z.string().optional(),
});

const formSchema = z.object({
  doctorId: z.string().min(1, 'Selecione o médico responsável'),
  status: z.enum(prescriptionStatuses).default('ACTIVE'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
});

type FormValues = z.infer<typeof formSchema>;

interface PrescriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName?: string;
  visitId?: string;
  attendanceId?: string;
  defaultDoctorId?: string;
  onSuccess?: (prescription: Prescription) => void;
}

export function PrescriptionForm({
  open,
  onOpenChange,
  patientId,
  patientName,
  visitId,
  attendanceId,
  defaultDoctorId,
  onSuccess,
}: PrescriptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [controlledFormData, setControlledFormData] = useState<ControlledDrugFormData | null>(null);
  const [bloodComponentFormData, setBloodComponentFormData] = useState<BloodComponentFormData | null>(
    null
  );

  const generateUuid = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return '00000000-0000-0000-0000-000000000000';
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'ACTIVE',
      items: [
        {
          medicineId: generateUuid(),
          medicineName: '',
          medicationType: 'COMMON',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: 1,
          immediateUse: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');

  const hasSpecialControlItems = useMemo(
    () =>
      watchedItems.some(
        (item) => item.medicationType === 'ANTIBIOTIC' || item.medicationType === 'CONTROLLED'
      ),
    [watchedItems]
  );

  const hasBloodComponentItems = useMemo(
    () => watchedItems.some((item) => item.medicationType === 'BLOOD_COMPONENT'),
    [watchedItems]
  );

  useEffect(() => {
    if (!hasSpecialControlItems) {
      setControlledFormData(null);
    }
  }, [hasSpecialControlItems]);

  useEffect(() => {
    if (!hasBloodComponentItems) {
      setBloodComponentFormData(null);
    }
  }, [hasBloodComponentItems]);

  useEffect(() => {
    if (!open) return;
    const loadDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const response = await staffService.findActiveDoctors();
        setDoctors(response);
        if (!form.getValues('doctorId')) {
          const defaultId = defaultDoctorId || response[0]?.id;
          if (defaultId) {
            form.setValue('doctorId', defaultId);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar médicos ativos', error);
        toast.error('Não foi possível carregar a lista de médicos.');
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [open, defaultDoctorId, form]);

  const handleClose = () => {
    onOpenChange(false);
    form.reset({
      status: 'ACTIVE',
      doctorId: form.getValues('doctorId'),
      items: [
        {
          medicineId: '',
          medicineName: '',
          medicationType: 'COMMON',
          dosage: '',
          frequency: '',
          duration: '',
          quantity: 1,
          immediateUse: false,
        },
      ],
    });
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (hasSpecialControlItems) {
        if (
          !controlledFormData ||
          !controlledFormData.clinicalJustification.trim() ||
          !controlledFormData.treatmentDuration.trim() ||
          !controlledFormData.posology.trim()
        ) {
          toast.error('Preencha a ficha de controle especial para antibióticos/controlados.');
          setIsSubmitting(false);
          return;
        }
      }

      if (hasBloodComponentItems) {
        if (
          !bloodComponentFormData ||
          !bloodComponentFormData.componentType ||
          !bloodComponentFormData.volume ||
          !bloodComponentFormData.clinicalIndication.trim()
        ) {
          toast.error('Preencha a ficha de hemocomponentes.');
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        patientId,
        doctorId: values.doctorId,
        visitId,
        attendanceId,
        status: values.status,
        notes: values.notes?.trim() || undefined,
        items: values.items.map((item) => ({
          medicineId:
            item.medicineId && item.medicineId.length === 36
              ? item.medicineId
              : generateUuid(),
          medicineName: item.medicineName,
          medicineDescription: item.medicineDescription?.trim() || undefined,
          medicationType: item.medicationType,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          route: item.route?.trim() || undefined,
          instructions: item.instructions?.trim() || undefined,
          immediateUse: !!item.immediateUse,
          requiresSpecialControl:
            item.medicationType === 'ANTIBIOTIC' || item.medicationType === 'CONTROLLED',
          specialControlJustification: item.specialControlJustification?.trim() || undefined,
        })),
        specialControlForm:
          hasSpecialControlItems && controlledFormData
            ? JSON.stringify(controlledFormData)
            : undefined,
        bloodComponentForm:
          hasBloodComponentItems && bloodComponentFormData
            ? JSON.stringify(bloodComponentFormData)
            : undefined,
      };

      const response = await prescriptionService.create(payload);
      toast.success('Prescrição criada com sucesso.');
      onSuccess?.(response);
      handleClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Não foi possível salvar a prescrição.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDoctorName = useMemo(() => {
    const doctor = doctors.find((doc) => doc.id === form.watch('doctorId'));
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : '';
  }, [doctors, form.watch('doctorId')]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nova prescrição</DialogTitle>
          {patientName && (
            <DialogDescription>
              Paciente: {patientName}
              {selectedDoctorName ? ` · Médico: ${selectedDoctorName}` : ''}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médico responsável</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingDoctors}
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Ativa</SelectItem>
                          <SelectItem value="DRAFT">Rascunho</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas gerais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instruções adicionais para a prescrição (opcional)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold">Itens da prescrição</h4>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        medicineId: generateUuid(),
                        medicineName: '',
                        medicationType: 'COMMON',
                        dosage: '',
                        frequency: '',
                        duration: '',
                        quantity: 1,
                        immediateUse: false,
                      })
                    }
                  >
                    Adicionar item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Medicamento {index + 1}</Label>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          Remover
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.medicineId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID do medicamento (gerado automaticamente)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.medicineName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome comercial</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do medicamento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.medicineDescription`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição / princípio ativo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Dipirona 500mg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.medicationType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {medicationTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
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
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                value={field.value}
                                onChange={(event) => field.onChange(Number(event.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.dosage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dosagem</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 500mg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.frequency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 8/8h" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.duration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duração</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 7 dias" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.route`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Via de administração</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: VO, EV, IM..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.instructions`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instruções ao paciente</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Tomar após as refeições" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.immediateUse`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>Uso imediato</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Marque caso o medicamento deva ser administrado ainda na unidade.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {(form.watch(`items.${index}.medicationType`) === 'ANTIBIOTIC' ||
                      form.watch(`items.${index}.medicationType`) === 'CONTROLLED') && (
                      <>
                        <Separator />
                        <FormField
                          control={form.control}
                          name={`items.${index}.specialControlJustification`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Justificativa clínica (obrigatória para ATB/controlados)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva a justificativa clínica para o uso do antibiótico/controlado"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                ))}

                {hasSpecialControlItems && (
                  <ControlledDrugForm
                    value={controlledFormData}
                    onChange={setControlledFormData}
                  />
                )}

                {hasBloodComponentItems && (
                  <BloodComponentForm
                    value={bloodComponentFormData}
                    onChange={setBloodComponentFormData}
                  />
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || isLoadingDoctors}>
                  {isSubmitting ? 'Salvando...' : 'Salvar prescrição'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

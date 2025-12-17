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
import pharmacyService from '@/services/pharmacyService';
import type { MedicationType, Prescription } from '@/types/prescription';
import type { Medicine } from '@/types/pharmacy';
import type { Staff } from '@/services/staffService';
import staffService from '@/services/staffService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  medicineId: z.string().uuid('Selecione um medicamento'),
  medicineName: z.string().min(2, 'Medicamento é obrigatório'),
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

interface MedicineComboboxProps {
  value?: string;
  selectedLabel?: string;
  disabled?: boolean;
  onSelect: (medicine: Medicine) => void;
}

function MedicineCombobox({ value, selectedLabel, disabled, onSelect }: MedicineComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await pharmacyService.searchMedicines(trimmed, 0, 20);
        setResults(response.content ?? []);
      } catch (error) {
        console.error('Erro ao buscar medicamentos:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [open, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', !value && 'text-muted-foreground')}
        >
          {selectedLabel || 'Selecione um medicamento'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome, código, genérico..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? 'Buscando...' : 'Nenhum medicamento encontrado.'}</CommandEmpty>
            <CommandGroup heading="Resultados">
              {results.map((medicine) => {
                const label = `${medicine.medicineName}${medicine.strength ? ` — ${medicine.strength}` : ''}`;
                return (
                  <CommandItem
                    key={medicine.id}
                    value={medicine.id}
                    onSelect={() => {
                      onSelect(medicine);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === medicine.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">
                        {medicine.medicineCode}
                        {medicine.genericName ? ` · ${medicine.genericName}` : ''}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'ACTIVE',
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
          medicineId: item.medicineId,
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
                        medicineId: '',
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
                            <FormLabel>Medicamento</FormLabel>
                            <FormControl>
                              <MedicineCombobox
                                value={field.value}
                                selectedLabel={form.getValues(`items.${index}.medicineName`)}
                                onSelect={(medicine) => {
                                  form.setValue(`items.${index}.medicineId`, medicine.id, { shouldValidate: true });
                                  form.setValue(`items.${index}.medicineName`, medicine.medicineName, { shouldValidate: true });
                                  if (!form.getValues(`items.${index}.medicineDescription`)) {
                                    const desc = [medicine.genericName, medicine.strength].filter(Boolean).join(' ');
                                    if (desc) {
                                      form.setValue(`items.${index}.medicineDescription`, desc);
                                    }
                                  }
                                }}
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
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Selecione um medicamento acima" {...field} readOnly />
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

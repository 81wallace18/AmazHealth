import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { admissionService } from '@/services/admissionService';
import { patientService } from '@/services/patientService';
import staffService from '@/services/staffService';
import type { Admission, Bed, AdmissionRequest, AdmissionType as AdmissionTypeEnum } from '@/types/admission';
import type { Patient } from '@/types/patient';
import type { Staff } from '@/services/staffService';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const admissionSchema = z.object({
  patientId: z.string().uuid({ message: 'Selecione o paciente' }),
  attendingPhysicianId: z.string().uuid({ message: 'Selecione o médico responsável' }),
  admissionType: z.string().min(1, 'Informe o tipo de internação'),
  admissionReason: z.string().min(1, 'Informe o motivo da internação'),
  admissionDate: z.date({ required_error: 'Informe a data da internação' }),
  expectedDischargeDate: z.date().optional().nullable(),
  bedId: z.string().uuid().optional().nullable(),
  priorityLevel: z
    .coerce.number()
    .min(1, 'Prioridade mínima 1')
    .max(5, 'Prioridade máxima 5')
    .optional()
    .nullable(),
  diagnosisOnAdmission: z.string().optional(),
  clinicalSummary: z.string().optional(),
  specialInstructions: z.string().optional(),
  isolationRequired: z.boolean().optional(),
  isolationType: z.string().optional(),
  specialEquipmentNeeded: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  mobilityAssistance: z.boolean().optional(),
  bedRequirements: z.string().optional(),
});

type FormValues = z.infer<typeof admissionSchema>;

const admissionTypes: { value: AdmissionTypeEnum; label: string }[] = [
  { value: 'EMERGENCY', label: 'Emergência' },
  { value: 'URGENT', label: 'Urgência' },
  { value: 'ELECTIVE', label: 'Eletiva' },
  { value: 'TRANSFER', label: 'Transferência' },
  { value: 'OBSERVATION', label: 'Observação' },
  { value: 'SURGERY', label: 'Cirúrgica' },
  { value: 'DELIVERY', label: 'Parto' },
  { value: 'ICU', label: 'UTI' },
  { value: 'PEDIATRIC', label: 'Pediátrica' },
  { value: 'PSYCHIATRIC', label: 'Psiquiátrica' },
  { value: 'REHABILITATION', label: 'Reabilitação' },
  { value: 'PALLIATIVE', label: 'Cuidados paliativos' },
];

interface AdmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPatientId?: string;
  defaultAttendanceId?: string;
  defaultReason?: string;
  onSuccess?: (admission: Admission) => void;
}

export function AdmissionForm({
  open,
  onOpenChange,
  defaultPatientId,
  defaultAttendanceId,
  defaultReason,
  onSuccess,
}: AdmissionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      admissionDate: new Date(),
      priorityLevel: 3,
      isolationRequired: false,
      mobilityAssistance: false,
      admissionReason: defaultReason ?? '',
    },
  });

  const patientsQuery = useQuery({
    queryKey: ['patients', 'admissions-form'],
    queryFn: async () => {
      const response = await patientService.list(0, 50);
      return response.content;
    },
    staleTime: 5 * 60 * 1000,
  });

  const doctorsQuery = useQuery({
    queryKey: ['staff', 'doctors', 'admissions-form'],
    queryFn: () => staffService.findActiveDoctors(),
    staleTime: 5 * 60 * 1000,
  });

  const bedBoardQuery = useQuery({
    queryKey: ['bed-board', 'available'],
    queryFn: async () => {
      const wards = await admissionService.getBedBoard();
      return wards.flatMap((ward) =>
        ward.beds.filter((bed) => bed.available).map((bed) => ({ ...bed, wardName: ward.wardName }))
      );
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        patientId: defaultPatientId ?? '',
        attendingPhysicianId: '',
        admissionType: 'EMERGENCY',
        admissionReason: defaultReason ?? '',
        admissionDate: new Date(),
        expectedDischargeDate: undefined,
        bedId: undefined,
        priorityLevel: 3,
        diagnosisOnAdmission: '',
        clinicalSummary: '',
        specialInstructions: '',
        isolationRequired: false,
        isolationType: '',
        specialEquipmentNeeded: '',
        dietaryRestrictions: '',
        mobilityAssistance: false,
        bedRequirements: '',
      });
    }
  }, [open, defaultPatientId, defaultReason, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      const payload: AdmissionRequest = {
        patientId: values.patientId,
        attendingPhysicianId: values.attendingPhysicianId,
        admissionType: values.admissionType as AdmissionTypeEnum,
        admissionReason: values.admissionReason.trim(),
        admissionDate: values.admissionDate?.toISOString(),
        expectedDischargeDate: values.expectedDischargeDate?.toISOString(),
        bedId: values.bedId || undefined,
        priorityLevel: values.priorityLevel ?? undefined,
        diagnosisOnAdmission: values.diagnosisOnAdmission?.trim() || undefined,
        clinicalSummary: values.clinicalSummary?.trim() || undefined,
        specialInstructions: values.specialInstructions?.trim() || undefined,
        isolationRequired: values.isolationRequired,
        isolationType: values.isolationType?.trim() || undefined,
        specialEquipmentNeeded: values.specialEquipmentNeeded?.trim() || undefined,
        dietaryRestrictions: values.dietaryRestrictions?.trim() || undefined,
        mobilityAssistance: values.mobilityAssistance,
        bedRequirements: values.bedRequirements?.trim() || undefined,
        attendanceId: defaultAttendanceId,
      };

      const admission = await admissionService.create(payload);
      toast.success('Internação registrada com sucesso.');
      onSuccess?.(admission);
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Não foi possível criar a internação.';
      toast.error(message);
    }
  };

  const patients = patientsQuery.data ?? [];
  const doctors = (doctorsQuery.data as Staff[]) ?? [];
  const beds = (bedBoardQuery.data as Bed[]) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nova Internação</DialogTitle>
          <DialogDescription>
            Registre uma internação para o paciente selecionado. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente *</FormLabel>
                      <Select
                        disabled={!!defaultPatientId || patientsQuery.isLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={patientsQuery.isLoading ? 'Carregando...' : 'Selecione'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map((patient: Patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.firstName} {patient.lastName} · {patient.patientCode}
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
                  name="attendingPhysicianId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médico Responsável *</FormLabel>
                      <Select
                        disabled={doctorsQuery.isLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={doctorsQuery.isLoading ? 'Carregando...' : 'Selecione'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.firstName} {doctor.lastName}
                              {doctor.specialization ? ` — ${doctor.specialization}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="admissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Internação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {admissionTypes.map((type) => (
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
                  name="admissionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data da Internação *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Selecione</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leito (opcional)</FormLabel>
                      <Select
                        disabled={bedBoardQuery.isLoading || beds.length === 0}
                        value={field.value ?? ''}
                        onValueChange={(value) => field.onChange(value || undefined)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={bedBoardQuery.isLoading ? 'Carregando...' : 'Selecione'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {beds.map((bed) => (
                            <SelectItem key={bed.id} value={bed.id}>
                              {bed.fullBedIdentifier || bed.bedNumber}
                              <Badge variant="outline" className="ml-2">
                                {bed.wardName}
                              </Badge>
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
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade (1-5)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="admissionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Internação *</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Descreva o motivo da internação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="diagnosisOnAdmission"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diagnóstico Inicial</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Diagnóstico inicial" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clinicalSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumo Clínico</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Resumo clínico" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções Especiais</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Ex.: isolamento, precauções" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="isolationRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Precisa isolamento?</FormLabel>
                        <p className="text-sm text-muted-foreground">Define se o paciente necessita isolamento.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobilityAssistance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Assistência de mobilidade</FormLabel>
                        <p className="text-sm text-muted-foreground">Paciente precisa de auxílio para locomoção.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isolationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de isolamento</FormLabel>
                      <FormControl>
                        <Input placeholder="Respiratório, contato..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialEquipmentNeeded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipamentos necessários</FormLabel>
                      <FormControl>
                        <Input placeholder="Ventilador, monitor, etc." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dietaryRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrição alimentar</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: dieta branda" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requisitos de leito</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: isolamento, janela, etc." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Registrar Internação
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Loader2 } from "lucide-react";
import { usePatients } from "@/hooks/usePatients";
import { useStaff } from "@/hooks/useStaff";

interface AppointmentFormData {
  patient_id: string;
  doctor_id: string;
  type: string;
  reason: string;
  scheduled_date: string;
  duration_minutes: number;
  notes?: string;
  status: string;
}

interface AppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  loading?: boolean;
}

const appointmentTypes = [
  "Consulta",
  "Retorno",
  "Exame",
  "Procedimento",
  "Urgência",
  "Emergência"
];

const durations = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2 horas" }
];

export function AppointmentForm({ onSubmit, loading = false }: AppointmentFormProps) {
  const { patients } = usePatients();
  const { staff } = useStaff();
  
  const doctors = staff.filter(member => member.role === "Médico");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AppointmentFormData>({
    defaultValues: {
      duration_minutes: 30,
      status: "scheduled"
    }
  });

  const onFormSubmit = async (data: AppointmentFormData) => {
    await onSubmit(data);
  };

  // Format datetime-local input value
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Set default date to now + 1 hour
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1);
    setValue("scheduled_date", formatDateTimeLocal(defaultDate));
  }, [setValue]);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Novo Agendamento
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient_id">Paciente *</Label>
                <Select onValueChange={(value) => setValue("patient_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.patient_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patient_id && (
                  <p className="text-sm text-destructive">Paciente é obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor_id">Médico *</Label>
                <Select onValueChange={(value) => setValue("doctor_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                        {doctor.specialization && ` - ${doctor.specialization}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.doctor_id && (
                  <p className="text-sm text-destructive">Médico é obrigatório</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Consulta *</Label>
                <Select onValueChange={(value) => setValue("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">Tipo é obrigatório</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duração *</Label>
                <Select onValueChange={(value) => setValue("duration_minutes", parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.duration_minutes && (
                  <p className="text-sm text-destructive">Duração é obrigatória</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Data e Hora *</Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                {...register("scheduled_date", { required: "Data e hora são obrigatórias" })}
              />
              {errors.scheduled_date && (
                <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Consulta *</Label>
              <Input
                id="reason"
                {...register("reason", { required: "Motivo é obrigatório" })}
                placeholder="Ex: Dor de cabeça, consulta de rotina, etc."
              />
              {errors.reason && (
                <p className="text-sm text-destructive">{errors.reason.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Observações adicionais sobre o agendamento..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-32"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Consulta
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
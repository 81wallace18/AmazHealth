import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, FileText, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/types/patient";
import { staffService } from "@/services/staffService";
import type { Staff } from "@/services/staffService";
import { useToast } from "@/hooks/use-toast";

const newAttendanceSchema = z.object({
  visitType: z.enum(["URGENCIA", "AMBULATORIAL"], {
    required_error: "Tipo de atendimento é obrigatório",
  }),
  doctorId: z.string().optional(),
  chiefComplaint: z.string().min(3, "Queixa principal é obrigatória"),
});

type NewAttendanceFormData = z.infer<typeof newAttendanceSchema>;

interface NewAttendanceDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewAttendanceFormData) => Promise<void>;
  loading?: boolean;
}

export function NewAttendanceDialog({
  patient,
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: NewAttendanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const { toast } = useToast();

  const form = useForm<NewAttendanceFormData>({
    resolver: zodResolver(newAttendanceSchema),
    defaultValues: {
      visitType: "URGENCIA",
      doctorId: "",
      chiefComplaint: "",
    },
  });

  const visitType = form.watch("visitType");

  useEffect(() => {
    if (!open) return;
    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const data = await staffService.findActiveDoctors();
        setDoctors(data);
      } catch (error) {
        console.error("Erro ao carregar médicos:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, [open]);

  const handleSubmit = async (data: NewAttendanceFormData) => {
    if (!patient) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        doctorId: data.doctorId || undefined,
      });
      toast({
        title: "Atendimento criado",
        description: "Paciente enviado para triagem.",
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating attendance:", error);
      toast({
        title: "Erro ao criar atendimento",
        description: "Não foi possível iniciar o atendimento. Verifique as permissões e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Iniciar Novo Atendimento
          </DialogTitle>
          <DialogDescription>
            Vincule um novo atendimento ao paciente selecionado
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-muted/50">
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
              <div>
                <p className="text-muted-foreground">Data de Nascimento</p>
                <p className="font-semibold">
                  {new Date(patient.dateOfBirth).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">CPF/CNS</p>
                <p className="font-mono">
                  {patient.cpf && patient.cns
                    ? `${patient.cpf} / ${patient.cns}`
                    : patient.cpf || patient.cns || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="visitType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tipo de Atendimento *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="URGENCIA">
                        <div className="flex flex-col">
                          <span className="font-semibold">Urgência/Emergência</span>
                          <span className="text-xs text-muted-foreground">
                            Pronto Atendimento - casos agudos
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="AMBULATORIAL">
                        <div className="flex flex-col">
                          <span className="font-semibold">Ambulatorial</span>
                          <span className="text-xs text-muted-foreground">
                            Consulta agendada ou retorno
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {visitType === "AMBULATORIAL" && (
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Médico responsável
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingDoctors ? "Carregando médicos..." : "Selecione o médico (opcional)"} />
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
            )}

            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Queixa Principal / Motivo *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Dor abdominal há 2 dias, febre..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                Próximos passos:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                <li>Número de atendimento será gerado automaticamente</li>
                <li>Paciente será encaminhado para triagem (Protocolo de Manchester)</li>
                <li>Após triagem, será setorizado para atendimento médico</li>
              </ol>
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
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? "Criando..." : "Iniciar Atendimento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

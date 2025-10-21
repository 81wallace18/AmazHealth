import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, FileText, CreditCard, Building2 } from "lucide-react";
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
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Patient } from "@/types/patient";

// Schema de validação para novo atendimento
const newAttendanceSchema = z.object({
  type: z.enum(["urgencia", "ambulatorial"], {
    required_error: "Tipo de atendimento é obrigatório",
  }),
  paymentType: z.enum(["sus", "convenio", "particular"], {
    required_error: "Forma de pagamento é obrigatória",
  }),
  healthInsuranceId: z.string().optional(),
  healthInsuranceName: z.string().optional(),
  healthInsuranceNumber: z.string().optional(),
  chiefComplaint: z.string().optional(),
});

type NewAttendanceFormData = z.infer<typeof newAttendanceSchema>;

interface NewAttendanceDialogProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewAttendanceFormData) => Promise<void>;
  loading?: boolean;
}

/**
 * Modal de criação de novo atendimento (Story Map: "Vincular atendimento")
 * Completa o fluxo: Buscar/cadastrar paciente → Emitir identificação → Vincular atendimento
 */
export function NewAttendanceDialog({
  patient,
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: NewAttendanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NewAttendanceFormData>({
    resolver: zodResolver(newAttendanceSchema),
    defaultValues: {
      type: "urgencia",
      paymentType: "sus",
      chiefComplaint: "",
    },
  });

  const paymentType = form.watch("paymentType");

  const handleSubmit = async (data: NewAttendanceFormData) => {
    if (!patient) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating attendance:", error);
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

        {/* Informações do Paciente */}
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
                <p className="font-mono">{patient.cpf || patient.cns || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Tipo de Atendimento */}
            <FormField
              control={form.control}
              name="type"
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
                      <SelectItem value="urgencia">
                        <div className="flex flex-col">
                          <span className="font-semibold">Urgência/Emergência</span>
                          <span className="text-xs text-muted-foreground">
                            Pronto Atendimento - casos agudos
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ambulatorial">
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

            {/* Forma de Pagamento */}
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Forma de Pagamento *
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sus">
                        <div className="flex flex-col">
                          <span className="font-semibold">SUS</span>
                          <span className="text-xs text-muted-foreground">
                            Sistema Único de Saúde
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="convenio">
                        <div className="flex flex-col">
                          <span className="font-semibold">Convênio</span>
                          <span className="text-xs text-muted-foreground">
                            Plano de saúde particular
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="particular">
                        <div className="flex flex-col">
                          <span className="font-semibold">Particular</span>
                          <span className="text-xs text-muted-foreground">
                            Pagamento direto
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dados do Convênio (condicional) */}
            {paymentType === "convenio" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados do Convênio
                </h4>

                <FormField
                  control={form.control}
                  name="healthInsuranceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Convênio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Unimed, Bradesco Saúde..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="healthInsuranceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Carteirinha</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Número da carteira do plano"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Número identificador do beneficiário no plano
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Queixa Principal */}
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Queixa Principal / Motivo da Consulta
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Dor abdominal há 2 dias, febre..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Breve descrição do motivo que levou o paciente a procurar atendimento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Informação sobre próximos passos */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
                📋 Próximos passos após criar o atendimento:
              </p>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                <li>Número de atendimento será gerado automaticamente</li>
                <li>Etiqueta de identificação poderá ser impressa</li>
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

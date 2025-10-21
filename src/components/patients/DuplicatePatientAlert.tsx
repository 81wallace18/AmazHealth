import { AlertCircle, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/types/patient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DuplicatePatientAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: Patient[];
  onSelectExisting: (patient: Patient) => void;
  onConfirmNew: () => void;
}

/**
 * Modal de alerta de possível duplicidade de paciente (US-A2)
 * Exibido quando encontramos pacientes com dados similares
 */
export function DuplicatePatientAlert({
  open,
  onOpenChange,
  duplicates,
  onSelectExisting,
  onConfirmNew
}: DuplicatePatientAlertProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      deceased: "destructive"
    };

    const labels: Record<string, string> = {
      active: "Ativo",
      inactive: "Inativo",
      deceased: "Falecido"
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle className="text-xl">
              ⚠️ Possível Duplicidade Detectada
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Encontramos <strong>{duplicates.length}</strong> paciente(s) com dados similares.
            Por favor, verifique se não é um cadastro duplicado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4">
          {duplicates.map((patient) => (
            <Card key={patient.id} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        {getStatusBadge(patient.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Código:</span>{" "}
                          <span className="font-mono">{patient.patientCode}</span>
                        </div>

                        <div>
                          <span className="font-medium">Data Nasc:</span>{" "}
                          {formatDate(patient.dateOfBirth)}
                        </div>

                        {patient.cpf && (
                          <div>
                            <span className="font-medium">CPF:</span>{" "}
                            {patient.cpf}
                          </div>
                        )}

                        {patient.cns && (
                          <div>
                            <span className="font-medium">CNS:</span>{" "}
                            {patient.cns}
                          </div>
                        )}

                        {patient.motherName && (
                          <div className="col-span-2">
                            <span className="font-medium">Mãe:</span>{" "}
                            {patient.motherName}
                          </div>
                        )}

                        {patient.phone && (
                          <div>
                            <span className="font-medium">Telefone:</span>{" "}
                            {patient.phone}
                          </div>
                        )}

                        {(patient.city || patient.state) && (
                          <div>
                            <span className="font-medium">Cidade:</span>{" "}
                            {patient.city}, {patient.state}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      onSelectExisting(patient);
                      onOpenChange(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    Usar este cadastro
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-semibold mb-1">Atenção!</p>
              <p>
                Cadastros duplicados podem causar erros graves na identificação do paciente.
                Verifique cuidadosamente antes de prosseguir.
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Cancelar Cadastro
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirmNew();
              onOpenChange(false);
            }}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Cadastrar Mesmo Assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

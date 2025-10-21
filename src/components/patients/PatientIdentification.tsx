import { useState } from "react";
import { Printer, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Patient } from "@/types/patient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientIdentificationProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint?: () => void;
  onReprint?: () => void;
  attendanceNumber?: string;
}

/**
 * Componente de impressão de etiqueta de identificação (US-A3)
 * Gera etiqueta térmica com QR Code para impressão
 */
export function PatientIdentification({
  patient,
  open,
  onOpenChange,
  onPrint,
  onReprint,
  attendanceNumber
}: PatientIdentificationProps) {
  const [showReprintConfirm, setShowReprintConfirm] = useState(false);
  const [hasBeenPrinted, setHasBeenPrinted] = useState(false);

  // Retorna null se não há paciente
  if (!patient) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = () => {
    return format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handlePrint = () => {
    window.print();
    setHasBeenPrinted(true);
    onPrint?.();
  };

  const handleReprint = () => {
    setShowReprintConfirm(true);
  };

  const confirmReprint = () => {
    setShowReprintConfirm(false);
    window.print();
    onReprint?.();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Etiqueta de Identificação
            </DialogTitle>
            <DialogDescription>
              Visualize e imprima a etiqueta de identificação do paciente
            </DialogDescription>
          </DialogHeader>

          {/* Preview da Etiqueta */}
          <div className="my-4">
            <div className="p-4 border-2 border-dashed rounded-lg bg-white text-black">
              <div id="print-area" className="print-label">
                {/* Cabeçalho */}
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold">AMAZHEALTH HIS</h2>
                  <p className="text-xs text-gray-600">Pronto Atendimento</p>
                </div>

                {/* QR Code Real */}
                <div className="flex justify-center mb-3">
                  <QRCodeSVG
                    value={patient.patientCode}
                    size={96}
                    level="M"
                    includeMargin={false}
                    className="border border-gray-300"
                  />
                </div>

                {/* Informações do Paciente */}
                <div className="text-center space-y-1">
                  <p className="text-xl font-bold">{patient.patientCode}</p>
                  <p className="text-base font-semibold">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-sm">
                    DN: {formatDate(patient.dateOfBirth)}
                  </p>

                  {attendanceNumber && (
                    <p className="text-sm font-semibold mt-2">
                      Atendimento: #{attendanceNumber}
                    </p>
                  )}
                </div>

                {/* Rodapé */}
                <div className="text-center mt-4 pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-600">
                    Impresso em: {formatDateTime()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta se já foi impresso */}
          {hasBeenPrinted && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Etiqueta já impressa</p>
                <p>Reimprimir gerará um novo registro na auditoria.</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!hasBeenPrinted ? (
              <Button onClick={handlePrint} className="w-full sm:w-auto">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Etiqueta
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleReprint}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Reimprimir
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto"
                >
                  Fechar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Reimpressão */}
      <AlertDialog open={showReprintConfirm} onOpenChange={setShowReprintConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Reimpressão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação será registrada no log de auditoria do sistema.
              <br />
              <br />
              <strong>Paciente:</strong> {patient.firstName} {patient.lastName}
              <br />
              <strong>Código:</strong> {patient.patientCode}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Motivos comuns para reimpressão:</strong>
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 ml-4 list-disc space-y-1">
              <li>Etiqueta danificada ou ilegível</li>
              <li>Perda da etiqueta original</li>
              <li>Necessidade de nova identificação</li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReprint}>
              Confirmar Reimpressão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

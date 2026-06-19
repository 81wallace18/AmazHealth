import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  entityName?: string;
  requireReason?: boolean;
  confirmText?: string;
  isDeleting?: boolean;
}

/**
 * Dialog de confirmação para delete com auditoria
 *
 * Uso:
 * ```tsx
 * <DeleteConfirmationDialog
 *   open={showDelete}
 *   onOpenChange={setShowDelete}
 *   onConfirm={(reason) => handleDelete(patientId, reason)}
 *   title="Deletar Paciente?"
 *   description="Esta ação não pode ser desfeita. Todos os dados do paciente serão removidos permanentemente."
 *   entityName="Maria Silva"
 *   requireReason
 *   isDeleting={loading}
 * />
 * ```
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  entityName,
  requireReason = true,
  confirmText = "DELETAR",
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const [reason, setReason] = useState("");
  const [confirmationText, setConfirmationText] = useState("");

  const canConfirm = requireReason
    ? reason.trim().length >= 10 && confirmationText === confirmText
    : confirmationText === confirmText;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(reason.trim());
      // Reset state
      setReason("");
      setConfirmationText("");
    }
  };

  const handleCancel = () => {
    setReason("");
    setConfirmationText("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {entityName && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Registro:</p>
              <p className="text-sm text-muted-foreground">{entityName}</p>
            </div>
          )}

          {requireReason && (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Motivo da exclusão *
              </Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da exclusão (mínimo 10 caracteres)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
                disabled={isDeleting}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/10 caracteres mínimos (LGPD - auditoria obrigatória)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Digite "{confirmText}" para confirmar *
            </Label>
            <Input
              id="confirmation"
              type="text"
              placeholder={confirmText}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              disabled={isDeleting}
              className="font-mono"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deletando..." : "Confirmar Exclusão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

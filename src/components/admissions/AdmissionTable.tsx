import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Admission, DischargeRequest } from "@/types/admission";

interface AdmissionTableProps {
  admissions: Admission[];
  onDischarge?: (admissionId: string, dischargeData: DischargeRequest) => void;
}

const statusLabels: Record<Admission["admissionStatus"], { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  AWAITING_BED: { label: "Aguardando leito", variant: "outline" },
  BED_ASSIGNED: { label: "Leito atribuido", variant: "default" },
  ACTIVE: { label: "Ativa", variant: "default" },
  DISCHARGED: { label: "Alta", variant: "secondary" },
  TRANSFERRED: { label: "Transferida", variant: "secondary" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  PENDING_TRANSFER: { label: "Transferencia pendente", variant: "outline" },
};

export function AdmissionTable({ admissions, onDischarge }: AdmissionTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Codigo</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Medico</TableHead>
            <TableHead>Leito</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admissions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhuma internacao encontrada.
              </TableCell>
            </TableRow>
          )}
          {admissions.map((admission) => {
            const statusInfo = statusLabels[admission.admissionStatus];
            const canDischarge =
              onDischarge && (admission.admissionStatus === "BED_ASSIGNED" || admission.admissionStatus === "ACTIVE");

            return (
              <TableRow key={admission.id}>
                <TableCell className="font-mono text-xs">{admission.admissionNumber}</TableCell>
                <TableCell>
                  <div className="font-medium">{admission.patientName}</div>
                  <div className="text-xs text-muted-foreground">{admission.patientCpf}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{admission.attendingPhysicianName}</div>
                </TableCell>
                <TableCell>
                  {admission.bedIdentifier ? (
                    <div>
                      <div className="font-medium">{admission.bedIdentifier}</div>
                      <div className="text-xs text-muted-foreground">{admission.wardName}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem leito</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(admission.admissionDate), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {canDischarge ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onDischarge(admission.id, {
                          dischargeDisposition: "Alta",
                        })
                      }
                    >
                      Registrar alta
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

import { useState } from "react";
import { format } from "date-fns";
import { Eye, FileText, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DischargeForm } from "./DischargeForm";

interface AdmissionTableProps {
  admissions: any[];
  onDischarge: (admissionId: string, dischargeData: any) => Promise<void>;
}

export function AdmissionTable({ admissions, onDischarge }: AdmissionTableProps) {
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [showDischargeForm, setShowDischargeForm] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      admitted: "default",
      discharged: "secondary",
      transferred: "outline",
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status === 'admitted' && 'Internado'}
        {status === 'discharged' && 'Alta'}
        {status === 'transferred' && 'Transferido'}
      </Badge>
    );
  };

  const handleDischarge = async (dischargeData: any) => {
    if (selectedAdmission) {
      await onDischarge(selectedAdmission.id, dischargeData);
      setShowDischargeForm(false);
      setSelectedAdmission(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Médico</TableHead>
            <TableHead>Leito</TableHead>
            <TableHead>Data Internação</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admissions.map((admission) => (
            <TableRow key={admission.id}>
              <TableCell className="font-mono text-sm">
                {admission.admission_code}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {admission.patient?.first_name} {admission.patient?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {admission.patient?.patient_code}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    Dr. {admission.doctor?.first_name} {admission.doctor?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {admission.doctor?.specialization}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {admission.bed ? (
                  <div>
                    <div className="font-medium">Leito {admission.bed.bed_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {admission.bed.ward?.name}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sem leito</span>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(admission.admission_date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                {getStatusBadge(admission.status)}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Internação</DialogTitle>
                        <DialogDescription>
                          Código: {admission.admission_code}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">Paciente</h4>
                            <p>{admission.patient?.first_name} {admission.patient?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{admission.patient?.patient_code}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Médico</h4>
                            <p>Dr. {admission.doctor?.first_name} {admission.doctor?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{admission.doctor?.specialization}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium">Motivo da Internação</h4>
                          <p>{admission.reason_for_admission}</p>
                        </div>
                        {admission.diagnosis && (
                          <div>
                            <h4 className="font-medium">Diagnóstico</h4>
                            <p>{admission.diagnosis}</p>
                          </div>
                        )}
                        {admission.treatment_plan && (
                          <div>
                            <h4 className="font-medium">Plano de Tratamento</h4>
                            <p>{admission.treatment_plan}</p>
                          </div>
                        )}
                        {admission.notes && (
                          <div>
                            <h4 className="font-medium">Observações</h4>
                            <p>{admission.notes}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {admission.status === 'admitted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAdmission(admission);
                        setShowDischargeForm(true);
                      }}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showDischargeForm && (
        <DischargeForm
          admission={selectedAdmission}
          onSubmit={handleDischarge}
          onCancel={() => {
            setShowDischargeForm(false);
            setSelectedAdmission(null);
          }}
        />
      )}
    </>
  );
}
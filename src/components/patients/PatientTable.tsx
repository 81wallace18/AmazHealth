import { memo } from "react";
import { Phone, Mail, Eye, Pencil, Trash2, Printer, UserPlus, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Patient } from "@/types/patient";
import { statusColors, statusLabels, genderLabels, getInitials, calculateAge } from "./patientUtils";

interface PatientTableProps {
  patients: Patient[];
  onView?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
  onPrintLabel?: (patient: Patient) => void;
  onStartAttendance?: (patient: Patient) => void;
  onEmergencyBypass?: (patient: Patient) => void;
}

export const PatientTable = memo(function PatientTable({ patients, onView, onEdit, onDelete, onPrintLabel, onStartAttendance, onEmergencyBypass }: PatientTableProps) {
  const renderPatientActions = (patient: Patient, compact = false) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {patient.hasActiveAttendance && (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Atendimento ativo
        </Badge>
      )}
      {!patient.hasActiveAttendance && onStartAttendance && (
        <Button
          variant="default"
          size="sm"
          aria-label="Enviar para triagem"
          onClick={() => onStartAttendance(patient)}
          className="bg-primary hover:bg-primary/90"
        >
          <UserPlus className="h-3.5 w-3.5 md:mr-1" />
          <span className={compact ? "sr-only md:not-sr-only" : ""}>Triagem</span>
        </Button>
      )}
      {!patient.hasActiveAttendance && onEmergencyBypass && (
        <Button
          variant="outline"
          size="sm"
          aria-label="Atendimento de emergência"
          onClick={() => onEmergencyBypass(patient)}
          className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          <AlertTriangle className="h-3.5 w-3.5 md:mr-1" />
          <span className={compact ? "sr-only md:not-sr-only" : ""}>Emergência</span>
        </Button>
      )}
      <Button variant="ghost" size="sm" aria-label="Ver detalhes" onClick={() => onView?.(patient)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" aria-label="Editar" onClick={() => onEdit?.(patient)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Imprimir etiqueta"
        onClick={() => onPrintLabel?.(patient)}
        className="text-primary hover:text-primary/80"
      >
        <Printer className="h-4 w-4" />
      </Button>
      {onDelete && (
        <Button variant="ghost" size="sm" aria-label="Excluir" onClick={() => onDelete(patient)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Lista de Pacientes</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="space-y-3 md:hidden">
          {patients.map((patient) => {
            const fullName = `${patient.firstName} ${patient.lastName}`;
            const age = calculateAge(patient.dateOfBirth);
            return (
              <article key={patient.id} className="rounded-md border bg-card p-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" />
                    <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{fullName}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{patient.patientCode}</div>
                  </div>
                  <Badge variant="outline" className={statusColors[patient.status as keyof typeof statusColors]}>
                    {statusLabels[patient.status as keyof typeof statusLabels]}
                  </Badge>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Idade</dt>
                    <dd>{age} anos</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Genero</dt>
                    <dd>{genderLabels[patient.gender as keyof typeof genderLabels]}</dd>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <dt className="text-xs text-muted-foreground">Contato</dt>
                    <dd className="truncate">{patient.phone || patient.email || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Tipo sanguineo</dt>
                    <dd>{patient.bloodType || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Ultima visita</dt>
                    <dd>{patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('pt-BR') : '-'}</dd>
                  </div>
                </dl>

                <div className="mt-3 border-t pt-3">
                  {renderPatientActions(patient, true)}
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden min-w-0 md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="hidden xl:table-cell">Email</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead className="hidden lg:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo Sanguíneo</TableHead>
                <TableHead className="hidden xl:table-cell">Última Visita</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const fullName = `${patient.firstName} ${patient.lastName}`;
                const age = calculateAge(patient.dateOfBirth);
                return (
                  <TableRow key={patient.id}>
                    <TableCell className="min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{fullName}</div>
                          <div className="text-sm text-muted-foreground">{genderLabels[patient.gender as keyof typeof genderLabels]}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{patient.patientCode}</TableCell>
                    <TableCell className="hidden max-w-[220px] truncate xl:table-cell">{patient.email || '-'}</TableCell>
                    <TableCell>{age} anos</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {patient.phone || '-'}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {patient.email || '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {patient.bloodType ? (
                        <Badge variant="outline" className="font-mono">
                          {patient.bloodType}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={statusColors[patient.status as keyof typeof statusColors]}
                      >
                        {statusLabels[patient.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[260px]">
                      {renderPatientActions(patient, true)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

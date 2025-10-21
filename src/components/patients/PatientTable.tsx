import { Phone, Mail, Eye, Pencil, Trash2, Printer, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Patient } from "@/hooks/usePatients";
import { statusColors, statusLabels, genderLabels, getInitials, calculateAge } from "./patientUtils";

interface PatientTableProps {
  patients: Patient[];
  onView?: (patient: Patient) => void;
  onEdit?: (patient: Patient) => void;
  onDelete?: (patient: Patient) => void;
  onPrintLabel?: (patient: Patient) => void;
  onStartAttendance?: (patient: Patient) => void;
}

export function PatientTable({ patients, onView, onEdit, onDelete, onPrintLabel, onStartAttendance }: PatientTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Pacientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Tipo Sanguíneo</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const fullName = `${patient.first_name} ${patient.last_name}`;
                const age = calculateAge(patient.date_of_birth);
                return (
                  <TableRow key={patient.id}>
                    <TableCell>
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
                    <TableCell className="font-mono text-sm">{patient.patient_code}</TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>{age} anos</TableCell>
                    <TableCell>
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
                    <TableCell>
                      {patient.blood_type ? (
                        <Badge variant="outline" className="font-mono">
                          {patient.blood_type}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{new Date(patient.updated_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={statusColors[patient.status as keyof typeof statusColors]}
                      >
                        {statusLabels[patient.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="default"
                          size="sm"
                          aria-label="Iniciar atendimento"
                          onClick={() => onStartAttendance?.(patient)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Atender
                        </Button>
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
                        <Button variant="ghost" size="sm" aria-label="Excluir" onClick={() => onDelete?.(patient)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
}
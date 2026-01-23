import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReceptionPatientListItem } from "@/types/reception";

interface ReceptionPatientTableProps {
  patients: ReceptionPatientListItem[];
  onEdit: (patient: ReceptionPatientListItem) => void;
}

export function ReceptionPatientTable({ patients, onEdit }: ReceptionPatientTableProps) {
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
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Atendimento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.patientId ?? `${patient.patientCode}-${patient.dateOfBirth}`}>
                  <TableCell className="font-medium">{patient.patientName}</TableCell>
                  <TableCell className="font-mono text-sm">{patient.patientCode}</TableCell>
                  <TableCell>
                    {patient.dateOfBirth
                      ? new Date(patient.dateOfBirth).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {patient.inAttendance ? "Em atendimento" : "Sem atendimento"}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onEdit(patient)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

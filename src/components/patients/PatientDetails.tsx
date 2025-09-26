import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient } from "@/hooks/usePatients";
import { genderLabels, statusLabels } from "./patientUtils";

interface PatientDetailsProps {
  patient: Patient;
}

export function PatientDetails({ patient }: PatientDetailsProps) {
  const fullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Paciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{fullName}</div>
            <div className="text-sm text-muted-foreground">{genderLabels[patient.gender as keyof typeof genderLabels]}</div>
          </div>
          <Badge variant="outline">{statusLabels[patient.status as keyof typeof statusLabels]}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Código</div>
            <div className="font-medium font-mono">{patient.patient_code}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Data de Nascimento</div>
            <div className="font-medium">{new Date(patient.date_of_birth).toLocaleDateString('pt-BR')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Telefone</div>
            <div className="font-medium">{patient.phone || '-'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{patient.email || '-'}</div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <div className="text-sm text-muted-foreground">Endereço</div>
            <div className="font-medium">{patient.address || '-'}{patient.city ? `, ${patient.city}` : ''}{patient.state ? ` - ${patient.state}` : ''}{patient.zip_code ? `, CEP: ${patient.zip_code}` : ''}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Contato de Emergência</div>
            <div className="font-medium">{patient.emergency_contact_name || '-'} {patient.emergency_contact_phone ? `(${patient.emergency_contact_phone})` : ''}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Tipo Sanguíneo</div>
            <div className="font-medium">{patient.blood_type || '-'}</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Alergias</div>
          <div className="font-medium whitespace-pre-wrap">{patient.allergies || '-'}</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Histórico Médico</div>
          <div className="font-medium whitespace-pre-wrap">{patient.medical_history || '-'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Criado em</div>
            <div className="font-medium">{new Date(patient.created_at).toLocaleString('pt-BR')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Atualizado em</div>
            <div className="font-medium">{new Date(patient.updated_at).toLocaleString('pt-BR')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

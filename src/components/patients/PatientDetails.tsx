import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Patient, RaceColorLabels, MaritalStatusLabels, EducationLevelLabels, RaceColor, MaritalStatus, EducationLevel } from "@/types/patient";
import { genderLabels, statusLabels } from "./patientUtils";

interface PatientDetailsProps {
  patient: Patient;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value || '-'}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

export function PatientDetails({ patient }: PatientDetailsProps) {
  const fullName = `${patient.firstName} ${patient.lastName}`;

  const addressParts = [
    patient.address,
    patient.addressNumber ? `nº ${patient.addressNumber}` : null,
    patient.addressComplement,
  ].filter(Boolean).join(', ');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes do Paciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{fullName}</div>
            <div className="text-sm text-muted-foreground">{genderLabels[patient.gender as keyof typeof genderLabels]}</div>
          </div>
          <Badge variant="outline">{statusLabels[patient.status as keyof typeof statusLabels]}</Badge>
        </div>

        {/* Documentos */}
        <Section title="Documentos">
          <Field label="Código" value={patient.patientCode} />
          <Field label="CPF" value={patient.cpf} />
          <Field label="CNS" value={patient.cns} />
          <Field label="RG" value={patient.rg} />
        </Section>

        {/* Dados Pessoais */}
        <Section title="Dados Pessoais">
          <Field label="Data de Nascimento" value={new Date(patient.dateOfBirth).toLocaleDateString('pt-BR')} />
          <Field label="Tipo Sanguíneo" value={patient.bloodType} />
          <Field label="Raça/Cor" value={patient.raceColor ? RaceColorLabels[patient.raceColor as RaceColor] : undefined} />
          <Field label="Estado Civil" value={patient.maritalStatus ? MaritalStatusLabels[patient.maritalStatus as MaritalStatus] : undefined} />
          <Field label="Escolaridade" value={patient.educationLevel ? EducationLevelLabels[patient.educationLevel as EducationLevel] : undefined} />
        </Section>

        {/* Naturalidade */}
        <Section title="Naturalidade">
          <Field label="Cidade" value={patient.birthCity} />
          <Field label="Estado" value={patient.birthState} />
          <Field label="País" value={patient.birthCountry} />
        </Section>

        {/* Família */}
        <Section title="Família">
          <Field label="Nome da Mãe" value={patient.motherName} />
          <Field label="Nome do Pai" value={patient.fatherName} />
        </Section>

        {/* Contato */}
        <Section title="Contato">
          <Field label="Telefone" value={patient.phone} />
          <Field label="Email" value={patient.email} />
        </Section>

        {/* Endereço */}
        <Section title="Endereço">
          <div className="md:col-span-2 lg:col-span-3 space-y-1">
            <div className="text-sm text-muted-foreground">Logradouro</div>
            <div className="font-medium">{addressParts || '-'}</div>
          </div>
          <Field label="Bairro" value={patient.neighborhood} />
          <Field label="Cidade" value={patient.city} />
          <Field label="Estado" value={patient.state} />
          <Field label="CEP" value={patient.zipCode} />
        </Section>

        {/* Dados Socioeconômicos */}
        <Section title="Dados Socioeconômicos">
          <Field label="Profissão" value={patient.occupation} />
        </Section>

        {/* Dados Clínicos */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Dados Clínicos</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Alergias</div>
              <div className="font-medium whitespace-pre-wrap">{patient.allergies || '-'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Histórico Médico</div>
              <div className="font-medium whitespace-pre-wrap">{patient.medicalHistory || '-'}</div>
            </div>
          </div>
        </div>

        {/* Controle */}
        <Section title="Controle">
          <Field label="Criado em" value={new Date(patient.createdAt).toLocaleString('pt-BR')} />
          <Field label="Atualizado em" value={new Date(patient.updatedAt).toLocaleString('pt-BR')} />
        </Section>
      </CardContent>
    </Card>
  );
}

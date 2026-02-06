/**
 * Tipos para o prontuário eletrônico (Medical Records)
 * Épico C: US-C1, US-C2, US-C3, US-C4
 */

export type RecordType =
  | 'TRIAGE'
  | 'ANAMNESIS'
  | 'EVOLUTION'
  | 'DISCHARGE_SUMMARY'
  | 'PROCEDURE'
  | 'OTHER';

export interface MedicalRecordRequest {
  visitId: string;
  recordType: RecordType;

  // SOAP - Campos estruturados (opcionais)
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  diagnosis?: string;
  treatment?: string;
  primaryDiagnosisCode?: string;
  primaryDiagnosisDescription?: string;
  primaryDiagnosisSystem?: 'ICD10' | 'ICD11';
  secondaryDiagnosisCodes?: string[];

  // Campo obrigatório
  notes: string;

  // Anexos
  attachments?: string[];
}

export interface MedicalRecordResponse {
  id: string;
  patientId: string;
  patientName: string;
  visitId: string | null;
  doctorId: string;
  doctorName: string;
  doctorRegistration: string;
  recordType: RecordType;

  // SOAP
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: string;
  diagnosis?: string;
  treatment?: string;
  primaryDiagnosisCode?: string;
  primaryDiagnosisDescription?: string;
  primaryDiagnosisSystem?: 'ICD10' | 'ICD11';
  secondaryDiagnosisCodes?: string[];

  notes: string;
  attachments?: string[];
  vitalSigns?: Record<string, unknown>;
  triagePayload?: Record<string, unknown>;

  // Metadados
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;

  // Flags de edição
  editable: boolean;
  editTimeRemaining: number | null; // minutos
}

export interface MedicalRecordSearchParams {
  patientId?: string;
  visitId?: string;
  page?: number;
  size?: number;
}

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  TRIAGE: 'Triagem',
  ANAMNESIS: 'Anamnese',
  EVOLUTION: 'Evolução',
  DISCHARGE_SUMMARY: 'Resumo de Alta',
  PROCEDURE: 'Procedimento',
  OTHER: 'Outro',
};

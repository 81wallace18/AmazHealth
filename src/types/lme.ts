export type LmeRequestStatus =
  | 'DRAFT'
  | 'FINALIZED'
  | 'PRINTED'
  | 'UNDER_REVIEW'
  | 'PENDING_DOCUMENTS'
  | 'AUTHORIZED'
  | 'DENIED'
  | 'CANCELLED'
  | 'REPLACED';

export type LmeFillerType = 'PATIENT' | 'MOTHER' | 'LEGAL_RESPONSIBLE' | 'DOCTOR' | 'OTHER';

export interface LmeMedicationRequestItem {
  medicineId: string;
  month1Quantity?: number;
  month2Quantity?: number;
  month3Quantity?: number;
  month4Quantity?: number;
  month5Quantity?: number;
  month6Quantity?: number;
}

export interface LmeRequestSaveRequest {
  patientId: string;
  doctorId?: string;
  visitId?: string;
  attendanceId?: string;
  prescriptionId?: string;
  requestDate?: string;
  weightKg?: number;
  heightCm?: number;
  anthropometrySource?: string;
  cid10Code?: string;
  diagnosis?: string;
  anamnesis?: string;
  previousTreatment?: boolean;
  previousTreatmentDescription?: string;
  incapable?: boolean;
  legalResponsibleName?: string;
  legalResponsibleCpf?: string;
  fillerType?: LmeFillerType;
  fillerName?: string;
  fillerCpf?: string;
  indigenousEthnicity?: string;
  pcdtChecklist?: string;
  medications: LmeMedicationRequestItem[];
}

export interface LmeMedicationResponse {
  id: string;
  medicineId: string;
  officialMedicineReferenceId?: string;
  lineNumber: number;
  medicineName: string;
  medicineCode: string;
  catmatCode?: string;
  presentation?: string;
  dosageForm?: string;
  concentration?: string;
  month1Quantity: number;
  month2Quantity: number;
  month3Quantity: number;
  month4Quantity: number;
  month5Quantity: number;
  month6Quantity: number;
}

export interface LmeRequestResponse {
  id: string;
  patientId: string;
  doctorId: string;
  visitId?: string;
  attendanceId?: string;
  prescriptionId?: string;
  replacesId?: string;
  replacedById?: string;
  status: LmeRequestStatus;
  cnesCode?: string;
  establishmentName?: string;
  patientName?: string;
  patientCpf?: string;
  patientCns?: string;
  patientMotherName?: string;
  patientRaceColor?: string;
  indigenousEthnicity?: string;
  doctorName?: string;
  doctorCns?: string;
  requestDate?: string;
  weightKg?: number;
  heightCm?: number;
  cid10Code?: string;
  diagnosis?: string;
  anamnesis?: string;
  previousTreatment?: boolean;
  incapable?: boolean;
  legalResponsibleName?: string;
  fillerType?: LmeFillerType;
  fillerName?: string;
  pcdtChecklist?: string;
  finalizedAt?: string;
  printedAt?: string;
  cancelledAt?: string;
  reviewStartedAt?: string;
  technicalReviewNotes?: string;
  pendingReason?: string;
  decisionNotes?: string;
  authorizedAt?: string;
  deniedAt?: string;
  denialReason?: string;
  apacNumber?: string;
  apacValidFrom?: string;
  apacValidTo?: string;
  createdAt?: string;
  medications: LmeMedicationResponse[];
}

export interface LmeAuthorizationEventResponse {
  id: string;
  lmeRequestId: string;
  eventType: 'REVIEW_STARTED' | 'PENDING_DOCUMENTS' | 'AUTHORIZED' | 'DENIED' | 'APAC_UPDATED';
  notes?: string;
  apacNumber?: string;
  apacValidFrom?: string;
  apacValidTo?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface LmeSearchParams {
  patientId?: string;
  doctorId?: string;
  status?: LmeRequestStatus;
  medicineId?: string;
  printed?: boolean;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

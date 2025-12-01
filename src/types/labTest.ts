export type LabTestStatus = 'SOLICITADO' | 'COLETADO' | 'LAUDADO' | 'CANCELADO';

export interface LabTestOrder {
  id: string;
  patientId: string;
  patientName: string;
  visitId?: string;
  visitCode?: string;
  requestedById?: string;
  requestedByName?: string;
  testCode: string;
  testName: string;
  status: LabTestStatus;
  requestedAt: string;
  collectedAt?: string;
  resultedAt?: string;
  result?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabTestOrderRequest {
  patientId: string;
  visitId?: string;
  requestedById?: string;
  testCode: string;
  testName: string;
  notes?: string;
}

export interface LabTestStatusUpdateRequest {
  status: LabTestStatus;
  result?: string;
  notes?: string;
}


export type LabTestStatus = 'SOLICITADO' | 'COLETADO' | 'LAUDADO' | 'CANCELADO';

export type LabTestIntegrationStatus =
  | 'NOT_SENT'
  | 'PENDING'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'RESULT_RECEIVED'
  | 'FAILED';

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
  integrationStatus: LabTestIntegrationStatus;
  integrationProvider?: string;
  externalOrderId?: string;
  externalResultUrl?: string;
  lastSyncedAt?: string;
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

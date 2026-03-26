export type TransportType = 'AMBULANCIA' | 'VEICULO_PROPRIO' | 'TRANSPORTE_MUNICIPAL' | 'OUTRO';

export interface TransferDocumentRequest {
  visitId: string;
  clinicalSummary: string;
  diagnosis: string;
  diagnosisCode?: string;
  proceduresPerformed?: string;
  medicationsGiven?: string;
  exitVitalSigns?: Record<string, unknown>;
  destinationName: string;
  destinationAddress?: string;
  destinationPhone?: string;
  transportType?: TransportType;
  departureTime?: string;
}

export interface TransferDocumentResponse {
  id: string;
  visitId: string;
  patientId: string;
  exitVitalSigns?: Record<string, unknown>;
  clinicalSummary: string;
  proceduresPerformed?: string;
  medicationsGiven?: string;
  diagnosis: string;
  diagnosisCode?: string;
  destinationName: string;
  destinationAddress?: string;
  destinationPhone?: string;
  transportType?: TransportType;
  departureTime?: string;
  deliveryConfirmed: boolean;
  confirmedByName?: string;
  confirmedAt?: string;
  createdByStaffId: string;
  createdAt: string;
}

export interface TransferConfirmRequest {
  confirmedByName: string;
}

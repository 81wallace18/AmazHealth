export type PrescriptionStatus = 'DRAFT' | 'ACTIVE' | 'DISPENSED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export type MedicationType = 'COMMON' | 'ANTIBIOTIC' | 'CONTROLLED' | 'BLOOD_COMPONENT';

export interface PrescriptionItem {
  id?: string;
  medicineId: string;
  medicineName: string;
  medicineDescription?: string;
  medicationType: MedicationType;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route?: string;
  instructions?: string;
  immediateUse?: boolean;
  requiresSpecialControl?: boolean;
  specialControlJustification?: string;
  batchNumber?: string;
  expirationDate?: string;
  dispensedQuantity?: number;
  dispensedAt?: string;
  dispensedBy?: string;
  dispensationStatus?: string;
  dispensationObservations?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  visitId?: string;
  visitCode?: string;
  attendanceId?: string;
  attendanceNumber?: string;
  prescriptionCode: string;
  prescriptionDate: string;
  status: PrescriptionStatus;
  notes?: string;
  hasAntibiotic: boolean;
  hasControlled: boolean;
  hasBloodComponent: boolean;
  specialControlForm?: string;
  bloodComponentForm?: string;
  specialControlFilledAt?: string;
  specialControlFilledBy?: string;
  validatedByPharmacy?: boolean;
  pharmacyValidationAt?: string;
  pharmacyValidationBy?: string;
  pharmacyObservations?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItemInput {
  medicineId: string;
  medicineName: string;
  medicineDescription?: string;
  medicationType: MedicationType;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route?: string;
  instructions?: string;
  immediateUse?: boolean;
  requiresSpecialControl?: boolean;
  specialControlJustification?: string;
}

export interface PrescriptionRequest {
  patientId: string;
  doctorId: string;
  visitId?: string;
  attendanceId?: string;
  status?: PrescriptionStatus;
  notes?: string;
  items: PrescriptionItemInput[];
  specialControlForm?: string;
  bloodComponentForm?: string;
}

export interface PharmaItemValidationPayload {
  itemId: string;
  medicineId: string;
  quantity: number;
  batchNumber: string;
  expirationDate: string;
  dispensationStatus?: string;
  observations?: string;
  prescriptionId: string;
  notes?: string;
}

export interface PharmacyValidationPayload {
  approved: boolean;
  observations?: string;
  notes?: string;
  items: PharmaItemValidationPayload[];
}

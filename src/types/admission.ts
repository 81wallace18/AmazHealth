export type AdmissionStatus =
  | 'AWAITING_BED'
  | 'BED_ASSIGNED'
  | 'ACTIVE'
  | 'DISCHARGED'
  | 'TRANSFERRED'
  | 'CANCELLED'
  | 'PENDING_TRANSFER';

export const admissionStatusLabels: Record<AdmissionStatus, string> = {
  AWAITING_BED: 'Aguardando leito',
  BED_ASSIGNED: 'Leito atribuído',
  ACTIVE: 'Ativa',
  DISCHARGED: 'Alta',
  TRANSFERRED: 'Transferida',
  CANCELLED: 'Cancelada',
  PENDING_TRANSFER: 'Transferência pendente',
};

export type AdmissionType =
  | 'EMERGENCY'
  | 'URGENT'
  | 'ELECTIVE'
  | 'TRANSFER'
  | 'OBSERVATION'
  | 'SURGERY'
  | 'DELIVERY'
  | 'ICU'
  | 'PEDIATRIC'
  | 'PSYCHIATRIC'
  | 'REHABILITATION'
  | 'PALLIATIVE';

export interface Admission {
  id: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  patientCpf?: string;
  opdVisitId?: string;
  attendanceId?: string;
  attendanceNumber?: string;
  assignedBedId?: string;
  bedIdentifier?: string;
  wardId?: string;
  wardName?: string;
  attendingPhysicianId: string;
  attendingPhysicianName: string;
  requestedById?: string;
  requestedByName?: string;
  admissionType: AdmissionType;
  admissionTypeDescription?: string;
  admissionStatus: AdmissionStatus;
  admissionStatusDescription?: string;
  admissionDate: string;
  expectedDischargeDate?: string;
  actualDischargeDate?: string;
  admissionReason: string;
  diagnosisOnAdmission?: string;
  clinicalSummary?: string;
  specialInstructions?: string;
  priorityLevel?: number;
  insuranceType?: string;
  insuranceNumber?: string;
  guarantorName?: string;
  guarantorContact?: string;
  allergies?: string;
  isolationRequired?: boolean;
  isolationType?: string;
  specialEquipmentNeeded?: string;
  dietaryRestrictions?: string;
  mobilityAssistance?: boolean;
  bedRequirements?: string;
  dischargeDisposition?: string;
  dischargeInstructions?: string;
  followUpRequired?: boolean;
  followUpInstructions?: string;
  isActive: boolean;
  needsBed: boolean;
  lengthOfStay?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionRequest {
  patientId: string;
  attendingPhysicianId: string;
  admissionType: AdmissionType;
  admissionReason: string;
  admissionStatus?: AdmissionStatus;
  admissionDate?: string;
  expectedDischargeDate?: string;
  opdVisitId?: string;
  attendanceId?: string;
  bedId?: string;
  requestedById?: string;
  diagnosisOnAdmission?: string;
  clinicalSummary?: string;
  specialInstructions?: string;
  priorityLevel?: number;
  insuranceType?: string;
  insuranceNumber?: string;
  guarantorName?: string;
  guarantorContact?: string;
  allergies?: string;
  isolationRequired?: boolean;
  isolationType?: string;
  specialEquipmentNeeded?: string;
  dietaryRestrictions?: string;
  mobilityAssistance?: boolean;
  bedRequirements?: string;
}

export type AdmissionUpdateRequest = Partial<Omit<AdmissionRequest, 'patientId'>>;

export interface DischargeRequest {
  dischargeDisposition: string;
  dischargeInstructions?: string;
  followUpRequired?: boolean;
  followUpInstructions?: string;
}

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'BLOCKED' | 'CLEANING';

export interface Bed {
  id: string;
  wardId?: string;
  wardName?: string;
  wardCode?: string;
  bedNumber: string;
  bedType?: string;
  status: BedStatus;
  statusDescription?: string;
  fullBedIdentifier?: string;
  canBeAllocated: boolean;
  isAvailable: boolean;
  isOccupied: boolean;
  currentPatientId?: string;
  patientName?: string;
  currentAdmissionId?: string;
  admissionNumber?: string;
  priorityLevel?: number;
  nearWindow?: boolean;
  oxygenSupport?: boolean;
  suctionSupport?: boolean;
  monitorSupport?: boolean;
  isIsolation?: boolean;
  specialNeeds?: string;
  lastCleanedAt?: string;
  maintenanceNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  allocatedAt?: string;
  releasedAt?: string;
}

export interface WardBoard {
  wardId: string;
  wardCode: string;
  wardName: string;
  wardType?: string;
  wardTypeDescription?: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  reservedBeds: number;
  cleaningBeds: number;
  occupancyRate: number;
  isFull: boolean;
  isActive: boolean;
  beds: Bed[];
}

export interface BedBoardSummary {
  totalWards: number;
  totalBeds: number;
  totalOccupied: number;
  totalAvailable: number;
  totalMaintenance: number;
  totalReserved: number;
  totalCleaning: number;
  overallOccupancyRate: number;
  fullWards: number;
  activeWards: number;
}

export interface BedAllocationPayload {
  admissionId: string;
  bedId: string;
  reason?: string;
  notes?: string;
  overrideAvailability?: boolean;
}

export interface BedTransferPayload {
  admissionId: string;
  toBedId: string;
  reason?: string;
  notes?: string;
  overrideAvailability?: boolean;
}

export interface AdmissionFilters {
  status?: AdmissionStatus;
  physicianId?: string;
  wardId?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

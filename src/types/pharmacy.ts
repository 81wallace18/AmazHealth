export interface Medicine {
  id: string;
  medicineCode: string;
  catmatCode?: string;
  officialMedicineReferenceId?: string;
  officialMedicineReferenceName?: string;
  medicineName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  category?: string;
  unitPrice?: number;
  reorderLevel?: number;
  isActive?: boolean;
  status?: string;
  lmeEligible?: boolean;
  requiresPrescription?: boolean;
  isControlled?: boolean;
  maxDispenseQuantity?: number;
  minDispenseQuantity?: number;
  barcode?: string;
  requiresSusSanitation?: boolean;
  totalStockQuantity?: number;
  needsReorder?: boolean;
  description?: string;
  therapeuticClass?: string;
}

export interface MedicineRequest {
  medicineCode: string;
  catmatCode?: string;
  officialMedicineReferenceId?: string;
  medicineName: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  manufacturer?: string;
  category?: string;
  unitPrice?: number;
  reorderLevel?: number;
  isActive?: boolean;
  status?: string;
  lmeEligible?: boolean;
  description?: string;
  sideEffects?: string;
  contraindications?: string;
  storageConditions?: string;
  therapeuticClass?: string;
  atcCode?: string;
  requiresPrescription?: boolean;
  isControlled?: boolean;
  maxDispenseQuantity?: number;
  minDispenseQuantity?: number;
  barcode?: string;
}

export interface MedicineStock {
  id: string;
  medicineId: string;
  medicineName: string;
  medicineCode: string;
  catmatCode?: string;
  batchNumber: string;
  quantityInStock: number;
  expiryDate?: string;
  status?: string;
  storageLocation?: string;
  supplier?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  requiresRefrigeration?: boolean;
  isExpired?: boolean;
  isNearExpiry?: boolean;
  daysToExpiry?: number;
  isBelowMinimum?: boolean;
}

export interface MedicineStockRequest {
  medicineId: string;
  batchNumber: string;
  quantityInStock: number;
  expiryDate: string;
  supplier?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  salePrice?: number;
  storageLocation?: string;
  storageConditions?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  barcode?: string;
}

export interface InventoryAlert {
  type: 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY' | string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | string;
  message: string;
  medicineId: string;
  medicineName: string;
  medicineCode?: string;
  batchNumber?: string;
  currentQuantity?: number;
  expiryDate?: string;
  daysToExpiry?: number;
}

export interface OfficialMedicineReference {
  id: string;
  catmatCode: string;
  officialName: string;
  presentation?: string;
  dosageForm?: string;
  concentration?: string;
  sourceName: string;
  sourceUrl?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfficialMedicineImportResult {
  batchId: string;
  status: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  rejectedCount: number;
  rejectionSummary?: string;
  sourceName: string;
  sourceUrl?: string;
  fileName: string;
  fileHash: string;
  importedAt?: string;
}

export interface PharmacyStatistics {
  totalMedicines: number;
  availableStock: number;
  lowStock: number;
  outOfStock: number;
  expired: number;
  nearExpiry: number;
}

export interface ConsumptionPoint {
  date: string;
  quantity: number;
}

export interface RecentPrescriptionSummary {
  id: string;
  code: string;
  patientName: string;
  doctorName?: string;
  status: string;
  createdAt: string;
}

export interface PharmacyDashboardData {
  stockByStatus: Record<string, number>;
  stockByCategory: Record<string, number>;
  medicinesNeedingReorder: number;
  inventoryAlerts: number;
  alertsBySeverity: Record<string, number>;
  totalMedicines: number;
  consumptionTrend: ConsumptionPoint[];
  recentPrescriptions: RecentPrescriptionSummary[];
}

export interface DispenseRequestItem {
  itemId: string;
  medicineId: string;
  quantity: number;
  batchNumber: string;
  expirationDate: string;
  dispensationStatus?: string;
  observations?: string;
  notes?: string;
  prescriptionId: string;
}

export type HorusQueueStatus =
  | 'APT'
  | 'PENDING_REVIEW'
  | 'BLOCKED'
  | 'SENT'
  | 'FAILED'
  | 'RECONCILED';

export type HorusReviewDecision = 'APPROVE' | 'BLOCK' | 'DEFER';

export interface HorusSnapshotSummary {
  id: string;
  runId: string;
  snapshotAt: string;
  totalRows: number;
  totalQuantity: number;
  createdAt: string;
}

export type HorusExternalMedicineMappingStatus = 'PENDING' | 'MATCHED' | 'REVIEW' | 'IGNORED';

export interface HorusExternalMedicineMapping {
  id: string;
  externalProductName: string;
  externalProgramName: string;
  externalUnitName: string;
  medicineId?: string | null;
  medicineName?: string | null;
  mappingStatus: HorusExternalMedicineMappingStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HorusStockDivergence {
  rowId: string;
  runId: string;
  snapshotId: string;
  rowNumber: number;
  productName?: string | null;
  programName?: string | null;
  unitName?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  quantity?: number | null;
  blocked?: boolean | null;
  mappingStatus: HorusExternalMedicineMappingStatus;
  mappedMedicineId?: string | null;
  mappedMedicineName?: string | null;
  divergenceTypes: string[];
  reasons: string[];
}

export interface HorusSyncArtifact {
  id: string;
  runId: string;
  artifactType: string;
  originalFilename?: string | null;
  mimeType?: string | null;
  sha256?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
}

export interface HorusDashboardSummary {
  lastSyncAt?: string | null;
  lastSyncStatus: string;
  totalRuns: number;
  totalSnapshotRows: number;
  totalSnapshotQuantity: number;
  pendingMappings: number;
  requestsReceived: number;
  requestsConflicted: number;
  queueByStatus: Record<string, number>;
  alertsByType: Record<string, number>;
}

export interface HorusQueueItem {
  id: string;
  clinicRequestId: string;
  queueStatus: HorusQueueStatus;
  patientName: string;
  patientIdentifier?: string | null;
  prescriberName?: string | null;
  requestedAt: string;
  externalItemCode?: string | null;
  requestedItemName: string;
  requestedQuantity: number;
  mappedMedicineId?: string | null;
  mappedMedicineName?: string | null;
  sourceSnapshotId?: string | null;
  sourceRunId?: string | null;
  candidateBatchNumber?: string | null;
  candidateExpiryDate?: string | null;
  availableQuantity?: number | null;
  blockedReason?: string | null;
  decisionReasons?: string[] | null;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HorusAuditEvent {
  id: string;
  entityId?: string | null;
  action: string;
  entity: string;
  createdAt: string;
  userId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface HorusQueueReviewRequest {
  decision: HorusReviewDecision;
  notes?: string;
}

export type PharmacyReplenishmentRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED_LOCAL'
  | 'EXTERNAL_PENDING'
  | 'EXTERNAL_SUBMITTED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'FAILED_EXTERNAL';

export interface PharmacyReplenishmentItemRequest {
  medicineId: string;
  requestedQuantity: number;
}

export interface PharmacyReplenishmentCreateRequest {
  authorStaffId: string;
  operatorStaffId?: string | null;
  status?: PharmacyReplenishmentRequestStatus;
  destination: string;
  note?: string | null;
  items: PharmacyReplenishmentItemRequest[];
}

export interface PharmacyReplenishmentResponse {
  id: string;
  organizationId: string;
  authorStaffId: string;
  operatorStaffId?: string | null;
  status: PharmacyReplenishmentRequestStatus;
  note?: string | null;
  cancellationReason?: string | null;
  destination?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items: Array<Record<string, unknown>>;
}

export type PharmacyExternalTaskStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'CONFIRMED'
  | 'FAILED'
  | 'MANUAL_REVIEW'
  | 'TECHNICAL_ERROR'
  | 'DISCARDED';

export interface PharmacyExternalTaskResponse {
  id: string;
  organizationId: string;
  localReferenceType: string;
  localReferenceId: string;
  provider: string;
  status: PharmacyExternalTaskStatus;
  statusReason?: string | null;
  externalReference?: string | null;
  externalStatus?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PharmacyExternalTaskActionRequest {
  provider: string;
  operatorStaffId: string;
  confirmedAt?: string | null;
  evidenceType?: string | null;
  externalReference?: string | null;
  note?: string | null;
  reason?: string | null;
}

export type PharmacyReceivingStatus =
  | 'PENDING_CONFERENCE'
  | 'PARTIALLY_CONFIRMED'
  | 'CONFIRMED'
  | 'DIVERGENT'
  | 'CANCELLED';

export interface PharmacyReceivingItemRequest {
  requestItemId: string;
  medicineId: string;
  approvedQuantity?: number | null;
  receivedQuantity?: number | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  supplier?: string | null;
  divergenceReason?: string | null;
}

export interface PharmacyReceivingCreateRequest {
  requestId: string;
  items: PharmacyReceivingItemRequest[];
}

export interface PharmacyReceivingConfirmationRequest {
  operatorStaffId: string;
  callerRole?: string | null;
  callerCapability?: string | null;
  authorized?: boolean | null;
}

export interface PharmacyReceivingResponse {
  id: string;
  organizationId: string;
  requestId: string;
  requestItemId?: string | null;
  status: PharmacyReceivingStatus;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
  items: Array<Record<string, unknown>>;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type PharmacyExternalDispenseStatus =
  | 'LOCAL_RECORDED'
  | 'EXTERNAL_PENDING'
  | 'EXTERNAL_CONFIRMED'
  | 'EXTERNAL_FAILED'
  | 'EXTERNAL_MANUAL';

export interface ExternalDispenseSyncResponse {
  id: string;
  organizationId: string;
  localReferenceType: string;
  localReferenceId: string;
  provider: string;
  status: PharmacyExternalDispenseStatus;
  statusContract?: string;
  externalReference?: string | null;
  attemptCount?: number | null;
  lastAttemptAt?: string | null;
  confirmedAt?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PharmacyExternalDispenseQueueResult {
  items: ExternalDispenseSyncResponse[];
  statusCounts: Record<string, number>;
}

export interface PharmacyExternalDispenseQueueActionRequest {
  operatorStaffId: string;
  succeeded?: boolean | null;
  externalReference?: string | null;
  reason?: string | null;
}

export type PharmacyCorrectionType =
  | 'LOSS'
  | 'EXPIRY'
  | 'STOCK_COUNT_ADJUSTMENT'
  | 'ENTRY_ERROR'
  | 'DISPENSE_ERROR'
  | 'BATCH_CORRECTION'
  | 'TRANSFER_CORRECTION';

export type PharmacyCorrectionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPLIED' | 'REJECTED' | 'CANCELLED';

export interface PharmacyStockCorrectionRequest {
  stockId: string;
  type: PharmacyCorrectionType;
  correctedQuantity: number;
  reason: string;
  evidenceId?: string | null;
  sensitive?: boolean | null;
}

export interface PharmacyStockCorrectionResponse {
  correctionId: string;
  organizationId: string;
  stockId: string;
  type: PharmacyCorrectionType;
  status: PharmacyCorrectionStatus;
  previousQuantity: number;
  correctedQuantity: number;
  quantityDelta: number;
  reason: string;
  sensitive: boolean;
  evidenceId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PharmacyCorrectionResponse {
  id: string;
  organizationId: string;
  localReferenceType: string;
  localReferenceId: string;
  type: PharmacyCorrectionType;
  status: PharmacyCorrectionStatus;
  authorId: string;
  reason: string;
  evidenceId?: string | null;
  sensitive: boolean;
  createsExternalCorrectionTask: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PharmacyParityReportResponse {
  reportId: string;
  dataOrigin: 'LOCAL' | 'HORUS_IMPORTED' | 'MIXED';
  reconciliationStatus: 'LOCAL_ONLY' | 'PENDING' | 'PARTIAL' | 'RECONCILED' | 'DIVERGENT';
  fidelity: 'INFORMATIONAL' | 'VISUAL_REFERENCE_ONLY';
  displayName: string;
  localSources: string[];
  filters: Array<{ key: string; label: string; required: boolean }>;
  knownGap: string;
  summary: Record<string, unknown>;
  rows: Array<Record<string, unknown>>;
}

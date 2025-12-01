export interface Medicine {
  id: string;
  medicineCode: string;
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
  requiresPrescription?: boolean;
  isControlled?: boolean;
  maxDispenseQuantity?: number;
  minDispenseQuantity?: number;
  barcode?: string;
  totalStockQuantity?: number;
  needsReorder?: boolean;
  description?: string;
  therapeuticClass?: string;
}

export interface MedicineRequest {
  medicineCode: string;
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

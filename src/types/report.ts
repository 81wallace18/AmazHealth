export interface TriageReport {
  statusCounts: Record<string, number>;
  colorCounts: Record<string, number>;
}

export interface AttendanceReport {
  statusCounts: Record<string, number>;
}

export interface PharmacyReport {
  lowStockCount: number;
  expiredCount: number;
  nearExpiryCount: number;
}

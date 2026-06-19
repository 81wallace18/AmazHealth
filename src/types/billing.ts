export type BillStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';

export interface Bill {
  id: string;
  organizationId: string;
  patientId: string;
  patientName?: string | null;
  billNumber: string;
  billDate: string;
  dueDate?: string | null;
  subtotal?: number | null;
  taxAmount?: number | null;
  discountAmount?: number | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  status: BillStatus;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillRequest {
  patientId: string;
  billDate: string;
  dueDate?: string | null;
  subtotal?: number | null;
  taxAmount?: number | null;
  discountAmount?: number | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export interface BillStatusUpdateRequest {
  status: BillStatus;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

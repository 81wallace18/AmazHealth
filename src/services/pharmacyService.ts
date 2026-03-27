import api from '@/lib/api';
import type {
  Medicine,
  MedicineRequest,
  MedicineStock,
  MedicineStockRequest,
  InventoryAlert,
  PharmacyStatistics,
  PharmacyDashboardData,
  DispenseRequestItem,
  HorusAuditEvent,
  HorusDashboardSummary,
  HorusQueueItem,
  HorusQueueReviewRequest,
  HorusQueueStatus,
  HorusSnapshotSummary
} from '@/types/pharmacy';
import type { Prescription, PrescriptionStatus } from '@/types/prescription';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const BASE_URL = '/pharmacy';
const DASHBOARD_URL = '/pharmacy/dashboard';

export const pharmacyService = {
  // ===== Medicamentos =====
  async getMedicines(params?: { page?: number; size?: number }): Promise<PaginatedResponse<Medicine>> {
    const response = await api.get<PaginatedResponse<Medicine>>(`${BASE_URL}/medicines`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 20 }
    });
    return response.data;
  },

  async getMedicineById(id: string): Promise<Medicine> {
    const response = await api.get<Medicine>(`${BASE_URL}/medicines/${id}`);
    return response.data;
  },

  async searchMedicines(q: string, page = 0, size = 20): Promise<PaginatedResponse<Medicine>> {
    const response = await api.get<PaginatedResponse<Medicine>>(`${BASE_URL}/medicines/search`, {
      params: { q, page, size }
    });
    return response.data;
  },

  async createMedicine(body: MedicineRequest): Promise<Medicine> {
    const response = await api.post<Medicine>(`${BASE_URL}/medicines`, body);
    return response.data;
  },

  async updateMedicine(id: string, body: MedicineRequest): Promise<Medicine> {
    const response = await api.put<Medicine>(`${BASE_URL}/medicines/${id}`, body);
    return response.data;
  },

  // ===== Estoque =====
  async getStock(params?: { page?: number; size?: number }): Promise<PaginatedResponse<MedicineStock>> {
    const response = await api.get<PaginatedResponse<MedicineStock>>(`${BASE_URL}/stock`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 20 }
    });
    return response.data;
  },

  async getStockByMedicine(medicineId: string, params?: { page?: number; size?: number }): Promise<PaginatedResponse<MedicineStock>> {
    const response = await api.get<PaginatedResponse<MedicineStock>>(`${BASE_URL}/stock/medicine/${medicineId}`, {
      params: { page: params?.page ?? 0, size: params?.size ?? 20 }
    });
    return response.data;
  },

  async getExpiredStock(): Promise<MedicineStock[]> {
    const response = await api.get<MedicineStock[]>(`${BASE_URL}/stock/expired`);
    return response.data;
  },

  async getNearExpiryStock(days = 30): Promise<MedicineStock[]> {
    const response = await api.get<MedicineStock[]>(`${BASE_URL}/stock/near-expiry`, { params: { days } });
    return response.data;
  },

  async getLowStock(): Promise<MedicineStock[]> {
    const response = await api.get<MedicineStock[]>(`${BASE_URL}/stock/low`);
    return response.data;
  },

  async addToStock(body: MedicineStockRequest): Promise<MedicineStock> {
    const response = await api.post<MedicineStock>(`${BASE_URL}/stock`, body);
    return response.data;
  },

  // ===== Dispensação =====
  async dispenseMedicine(body: { medicineId: string; quantity: number; batchNumber: string; dispensationReason: string; prescriptionId?: string }): Promise<any> {
    const response = await api.post(`${BASE_URL}/dispense`, body);
    return response.data;
  },

  async dispensePrescriptionItems(items: DispenseRequestItem[]): Promise<any> {
    const response = await api.post(`${BASE_URL}/dispense-prescription`, items);
    return response.data;
  },

  // ===== Prescrições =====
  async getPendingPrescriptions(params?: { page?: number; size?: number; status?: PrescriptionStatus }): Promise<PaginatedResponse<Prescription>> {
    const response = await api.get<PaginatedResponse<Prescription>>(`${BASE_URL}/prescriptions/pending`, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        status: params?.status
      }
    });
    return response.data;
  },

  // ===== Alertas & Estatísticas =====
  async getAlerts(): Promise<InventoryAlert[]> {
    const response = await api.get<InventoryAlert[]>(`${BASE_URL}/alerts`);
    return response.data;
  },

  async getStatistics(): Promise<PharmacyStatistics> {
    const response = await api.get<PharmacyStatistics>(`${BASE_URL}/statistics`);
    return response.data;
  },

  async getDashboardData(): Promise<PharmacyDashboardData> {
    const response = await api.get<PharmacyDashboardData>(`${DASHBOARD_URL}`);
    return response.data;
  },

  async getDashboardAlerts(): Promise<InventoryAlert[]> {
    const response = await api.get<InventoryAlert[]>(`${DASHBOARD_URL}/alerts`);
    return response.data;
  },

  // ===== HÓRUS Operacional =====
  async getHorusDashboard(): Promise<HorusDashboardSummary> {
    const response = await api.get<HorusDashboardSummary>('/horus/dashboard');
    return response.data;
  },

  async getHorusLatestSnapshot(): Promise<HorusSnapshotSummary | null> {
    const response = await api.get<HorusSnapshotSummary | null>('/horus/snapshots/latest');
    return response.data;
  },

  async getHorusQueue(params?: { page?: number; size?: number; status?: HorusQueueStatus }): Promise<PaginatedResponse<HorusQueueItem>> {
    const response = await api.get<PaginatedResponse<HorusQueueItem>>('/horus/queue', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        status: params?.status
      }
    });
    return response.data;
  },

  async reviewHorusQueueItem(queueItemId: string, body: HorusQueueReviewRequest): Promise<HorusQueueItem> {
    const response = await api.post<HorusQueueItem>(`/horus/queue/${queueItemId}/review`, body);
    return response.data;
  },

  async getHorusAudit(params?: { page?: number; size?: number }): Promise<PaginatedResponse<HorusAuditEvent>> {
    const response = await api.get<PaginatedResponse<HorusAuditEvent>>('/horus/audit', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20
      }
    });
    return response.data;
  }
};

export default pharmacyService;

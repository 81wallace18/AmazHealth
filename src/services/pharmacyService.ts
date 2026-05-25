import api from '@/lib/api';
import type {
  Medicine,
  MedicineRequest,
  MedicineStock,
  MedicineStockRequest,
  OfficialMedicineImportResult,
  OfficialMedicineReference,
  InventoryAlert,
  PharmacyStatistics,
  PharmacyDashboardData,
  DispenseRequestItem,
  HorusAuditEvent,
  HorusDashboardSummary,
  HorusExternalMedicineMappingDecision,
  HorusExternalMedicineMapping,
  HorusExternalMedicineMappingStatus,
  HorusMappingApproveRequest,
  HorusMappingReasonRequest,
  HorusOperationalDivergence,
  HorusOperationalDivergenceDecisionRequest,
  HorusOperationalDivergenceStatus,
  HorusQueueItem,
  HorusQueueReviewRequest,
  HorusQueueStatus,
  HorusSnapshotSummary,
  HorusStockDivergence,
  HorusSyncArtifact,
  PharmacyCorrectionResponse,
  PharmacyCorrectionStatus,
  PharmacyCorrectionType,
  PharmacyExternalDispenseQueueActionRequest,
  PharmacyExternalDispenseQueueResult,
  PharmacyExternalDispenseStatus,
  PharmacyExternalTaskActionRequest,
  PharmacyExternalTaskResponse,
  PharmacyExternalTaskStatus,
  PharmacyParityReportResponse,
  PharmacyReceivingConfirmationRequest,
  PharmacyReceivingCreateRequest,
  PharmacyReceivingResponse,
  PharmacyReceivingStatus,
  PharmacyReplenishmentCreateRequest,
  PharmacyReplenishmentItemFulfillmentRequest,
  PharmacyReplenishmentRequestStatus,
  PharmacyReplenishmentResponse,
  PharmacyStockCorrectionRequest,
  PharmacyStockCorrectionResponse
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

  async searchMedicines(q: string, page = 0, size = 20, filters?: { lmeEligible?: boolean; officialLinked?: boolean }): Promise<PaginatedResponse<Medicine>> {
    const response = await api.get<PaginatedResponse<Medicine>>(`${BASE_URL}/medicines/search`, {
      params: { q, page, size, ...filters }
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

  async searchOfficialMedicineReferences(params?: { q?: string; active?: boolean; page?: number; size?: number }): Promise<PaginatedResponse<OfficialMedicineReference>> {
    const response = await api.get<PaginatedResponse<OfficialMedicineReference>>('/official-medicine-references', {
      params
    });
    return response.data;
  },

  async importOfficialMedicineReferences(body: { file: File; sourceName: string; sourceUrl?: string }): Promise<OfficialMedicineImportResult> {
    const formData = new FormData();
    formData.append('file', body.file);
    formData.append('sourceName', body.sourceName);
    if (body.sourceUrl) {
      formData.append('sourceUrl', body.sourceUrl);
    }
    const response = await api.post<OfficialMedicineImportResult>('/official-medicine-references/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async linkMedicineToCatmat(id: string, body: { officialMedicineReferenceId: string; lmeEligible?: boolean }): Promise<Medicine> {
    const response = await api.post<Medicine>(`${BASE_URL}/medicines/${id}/catmat-link`, body);
    return response.data;
  },

  async unlinkMedicineFromCatmat(id: string): Promise<Medicine> {
    const response = await api.delete<Medicine>(`${BASE_URL}/medicines/${id}/catmat-link`);
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

  async getHorusArtifacts(runId: string): Promise<HorusSyncArtifact[]> {
    const response = await api.get<HorusSyncArtifact[]>(`/horus/runs/${runId}/artifacts`);
    return response.data;
  },

  async getHorusMappings(params?: { status?: HorusExternalMedicineMappingStatus }): Promise<HorusExternalMedicineMapping[]> {
    const response = await api.get<HorusExternalMedicineMapping[]>('/horus/mappings', {
      params: { status: params?.status }
    });
    return response.data;
  },

  async approveHorusMapping(mappingId: string, body: HorusMappingApproveRequest): Promise<HorusExternalMedicineMapping> {
    const response = await api.post<HorusExternalMedicineMapping>(`/horus/mappings/${mappingId}/approve`, body);
    return response.data;
  },

  async revertHorusMapping(mappingId: string, body: HorusMappingReasonRequest): Promise<HorusExternalMedicineMapping> {
    const response = await api.post<HorusExternalMedicineMapping>(`/horus/mappings/${mappingId}/revert`, body);
    return response.data;
  },

  async ignoreHorusMapping(mappingId: string, body: HorusMappingReasonRequest): Promise<HorusExternalMedicineMapping> {
    const response = await api.post<HorusExternalMedicineMapping>(`/horus/mappings/${mappingId}/ignore`, body);
    return response.data;
  },

  async markHorusMappingForReview(mappingId: string, body: HorusMappingReasonRequest): Promise<HorusExternalMedicineMapping> {
    const response = await api.post<HorusExternalMedicineMapping>(`/horus/mappings/${mappingId}/review`, body);
    return response.data;
  },

  async getHorusMappingDecisions(mappingId: string): Promise<HorusExternalMedicineMappingDecision[]> {
    const response = await api.get<HorusExternalMedicineMappingDecision[]>(`/horus/mappings/${mappingId}/decisions`);
    return response.data;
  },

  async getHorusDivergences(): Promise<HorusStockDivergence[]> {
    const response = await api.get<HorusStockDivergence[]>('/horus/divergences');
    return response.data;
  },

  async getHorusOperationalDivergences(params?: { status?: HorusOperationalDivergenceStatus }): Promise<HorusOperationalDivergence[]> {
    const response = await api.get<HorusOperationalDivergence[]>('/horus/operational-divergences', {
      params: { status: params?.status }
    });
    return response.data;
  },

  async decideHorusOperationalDivergence(
    divergenceId: string,
    body: HorusOperationalDivergenceDecisionRequest
  ): Promise<HorusOperationalDivergence> {
    const response = await api.post<HorusOperationalDivergence>(`/horus/operational-divergences/${divergenceId}/decision`, body);
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
  },

  // ===== Operação canônica =====
  async getReplenishmentRequests(params?: { status?: PharmacyReplenishmentRequestStatus }): Promise<PharmacyReplenishmentResponse[]> {
    const response = await api.get<PharmacyReplenishmentResponse[]>('/pharmacy/replenishment-requests', {
      params: { status: params?.status }
    });
    return response.data;
  },

  async createReplenishmentRequest(body: PharmacyReplenishmentCreateRequest): Promise<PharmacyReplenishmentResponse> {
    const response = await api.post<PharmacyReplenishmentResponse>('/pharmacy/replenishment-requests', body);
    return response.data;
  },

  async fulfillReplenishmentItem(
    requestId: string,
    itemId: string,
    body: PharmacyReplenishmentItemFulfillmentRequest
  ): Promise<PharmacyReplenishmentResponse> {
    const response = await api.patch<PharmacyReplenishmentResponse>(
      `/pharmacy/replenishment-requests/${requestId}/items/${itemId}/fulfillment`,
      body
    );
    return response.data;
  },

  async getExternalTasks(params?: { provider?: string; status?: PharmacyExternalTaskStatus }): Promise<PharmacyExternalTaskResponse[]> {
    const response = await api.get<PharmacyExternalTaskResponse[]>('/pharmacy/external-tasks', {
      params
    });
    return response.data;
  },

  async confirmExternalTask(id: string, body: PharmacyExternalTaskActionRequest): Promise<PharmacyExternalTaskResponse> {
    const response = await api.patch<PharmacyExternalTaskResponse>(`/pharmacy/external-tasks/${id}/confirm`, body);
    return response.data;
  },

  async discardExternalTask(id: string, body: PharmacyExternalTaskActionRequest): Promise<PharmacyExternalTaskResponse> {
    const response = await api.patch<PharmacyExternalTaskResponse>(`/pharmacy/external-tasks/${id}/discard`, body);
    return response.data;
  },

  async getReceivings(params?: { status?: PharmacyReceivingStatus }): Promise<PharmacyReceivingResponse[]> {
    const response = await api.get<PharmacyReceivingResponse[]>('/pharmacy/receivings', { params });
    return response.data;
  },

  async createReceiving(body: PharmacyReceivingCreateRequest): Promise<PharmacyReceivingResponse> {
    const response = await api.post<PharmacyReceivingResponse>('/pharmacy/receivings', body);
    return response.data;
  },

  async confirmReceiving(id: string, body: PharmacyReceivingConfirmationRequest): Promise<PharmacyReceivingResponse> {
    const response = await api.patch<PharmacyReceivingResponse>(`/pharmacy/receivings/${id}/confirm`, body);
    return response.data;
  },

  async getExternalDispenseQueue(params?: { provider?: string; status?: PharmacyExternalDispenseStatus }): Promise<PharmacyExternalDispenseQueueResult> {
    const response = await api.get<PharmacyExternalDispenseQueueResult>('/pharmacy/external-dispense-queue', { params });
    return response.data;
  },

  async markExternalDispenseManualExecution(id: string, body: PharmacyExternalDispenseQueueActionRequest) {
    const response = await api.patch(`/pharmacy/external-dispense-queue/${id}/manual-execution`, body);
    return response.data;
  },

  async markExternalDispenseManualReview(id: string, body: PharmacyExternalDispenseQueueActionRequest) {
    const response = await api.patch(`/pharmacy/external-dispense-queue/${id}/manual-review`, body);
    return response.data;
  },

  async getCorrections(params?: { type?: PharmacyCorrectionType; status?: PharmacyCorrectionStatus }): Promise<PharmacyCorrectionResponse[]> {
    const response = await api.get<PharmacyCorrectionResponse[]>('/pharmacy/corrections', { params });
    return response.data;
  },

  async createStockCorrection(body: PharmacyStockCorrectionRequest): Promise<PharmacyStockCorrectionResponse> {
    const response = await api.post<PharmacyStockCorrectionResponse>('/pharmacy/corrections/stock', body);
    return response.data;
  },

  async approveCorrection(id: string, approverId: string): Promise<PharmacyStockCorrectionResponse> {
    const response = await api.patch<PharmacyStockCorrectionResponse>(`/pharmacy/corrections/${id}/approve`, { approverId });
    return response.data;
  },

  async rejectCorrection(id: string, approverId: string): Promise<PharmacyStockCorrectionResponse> {
    const response = await api.patch<PharmacyStockCorrectionResponse>(`/pharmacy/corrections/${id}/reject`, { approverId });
    return response.data;
  },

  async getParityReports(): Promise<PharmacyParityReportResponse[]> {
    const response = await api.get<PharmacyParityReportResponse[]>('/pharmacy/reports');
    return response.data;
  },

  async getParityReport(reportId: string): Promise<PharmacyParityReportResponse> {
    const response = await api.get<PharmacyParityReportResponse>(`/pharmacy/reports/${reportId}`);
    return response.data;
  }
};

export default pharmacyService;

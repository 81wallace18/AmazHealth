import api from '@/lib/api';
import type { SusApsReadinessResponse } from '@/types/susApsReadiness';

class SusApsReadinessService {
  private baseUrl = '/sus-aps-readiness';

  async getSummary(): Promise<SusApsReadinessResponse> {
    const response = await api.get<SusApsReadinessResponse>(`${this.baseUrl}/summary`);
    return response.data;
  }

  async getStaffReadiness(staffId: string): Promise<SusApsReadinessResponse> {
    const response = await api.get<SusApsReadinessResponse>(`${this.baseUrl}/staff/${staffId}`);
    return response.data;
  }

  async getPatientReadiness(patientId: string): Promise<SusApsReadinessResponse> {
    const response = await api.get<SusApsReadinessResponse>(`${this.baseUrl}/patients/${patientId}`);
    return response.data;
  }

  async getMedicineReadiness(medicineId: string): Promise<SusApsReadinessResponse> {
    const response = await api.get<SusApsReadinessResponse>(`${this.baseUrl}/medicines/${medicineId}`);
    return response.data;
  }

  async getPrescriptionItemReadiness(prescriptionItemId: string): Promise<SusApsReadinessResponse> {
    const response = await api.get<SusApsReadinessResponse>(`${this.baseUrl}/prescription-items/${prescriptionItemId}`);
    return response.data;
  }
}

export const susApsReadinessService = new SusApsReadinessService();
export default susApsReadinessService;

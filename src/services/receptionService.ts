import api from '@/lib/api';
import type { ReceptionPatientListItem, ReceptionQueueItem } from '@/types/reception';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const receptionService = {
  async listPatients(params: { page?: number; size?: number; query?: string }): Promise<PaginatedResponse<ReceptionPatientListItem>> {
    const queryParams: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    };

    if (params.query) {
      queryParams.q = params.query;
    }

    const response = await api.get<PaginatedResponse<ReceptionPatientListItem>>('/reception/patients', {
      params: queryParams,
    });
    return response.data;
  },

  async listTriageBoard(): Promise<ReceptionQueueItem[]> {
    const response = await api.get<ReceptionQueueItem[]>('/reception/triage-board');
    return response.data;
  },

  async listQueue(): Promise<ReceptionQueueItem[]> {
    const response = await api.get<ReceptionQueueItem[]>('/reception/queue');
    return response.data;
  },
};

export default receptionService;

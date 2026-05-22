import api from '@/lib/api';
import type { LmeRequestResponse, LmeRequestSaveRequest, LmeSearchParams } from '@/types/lme';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const BASE_URL = '/lme-requests';

export const lmeService = {
  async search(params?: LmeSearchParams): Promise<PaginatedResponse<LmeRequestResponse>> {
    const response = await api.get<PaginatedResponse<LmeRequestResponse>>(BASE_URL, {
      params: { page: params?.page ?? 0, size: params?.size ?? 20, ...params }
    });
    return response.data;
  },

  async get(id: string): Promise<LmeRequestResponse> {
    const response = await api.get<LmeRequestResponse>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async create(body: LmeRequestSaveRequest): Promise<LmeRequestResponse> {
    const response = await api.post<LmeRequestResponse>(BASE_URL, body);
    return response.data;
  },

  async update(id: string, body: LmeRequestSaveRequest): Promise<LmeRequestResponse> {
    const response = await api.put<LmeRequestResponse>(`${BASE_URL}/${id}`, body);
    return response.data;
  },

  async finalize(id: string): Promise<LmeRequestResponse> {
    const response = await api.post<LmeRequestResponse>(`${BASE_URL}/${id}/finalize`);
    return response.data;
  },

  async markPrinted(id: string): Promise<LmeRequestResponse> {
    const response = await api.post<LmeRequestResponse>(`${BASE_URL}/${id}/print`);
    return response.data;
  },

  async cancel(id: string, reason: string): Promise<LmeRequestResponse> {
    const response = await api.post<LmeRequestResponse>(`${BASE_URL}/${id}/cancel`, { reason });
    return response.data;
  },

  async replace(id: string, reason: string): Promise<LmeRequestResponse> {
    const response = await api.post<LmeRequestResponse>(`${BASE_URL}/${id}/replace`, { reason });
    return response.data;
  },

  async downloadPdf(id: string): Promise<Blob> {
    const response = await api.get(`${BASE_URL}/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  }
};

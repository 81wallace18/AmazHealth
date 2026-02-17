import api from '@/lib/api';
import type { Bill, BillRequest, BillStatus, BillStatusUpdateRequest } from '@/types/billing';

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const billingService = {
  async findAll(page = 0, size = 20, status?: BillStatus): Promise<PageResponse<Bill>> {
    const response = await api.get<PageResponse<Bill>>('/billing', {
      params: {
        page,
        size,
        status,
      },
    });
    return response.data;
  },

  async create(data: BillRequest): Promise<Bill> {
    const response = await api.post<Bill>('/billing', data);
    return response.data;
  },

  async updateStatus(id: string, request: BillStatusUpdateRequest): Promise<Bill> {
    const response = await api.patch<Bill>(`/billing/${id}/status`, request);
    return response.data;
  },
};

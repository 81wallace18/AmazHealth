import api from '@/lib/api';
import type {
  LabTestOrder,
  LabTestOrderRequest,
  LabTestStatus,
  LabTestStatusUpdateRequest,
} from '@/types/labTest';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const labTestService = {
  async createOrder(request: LabTestOrderRequest): Promise<LabTestOrder> {
    const response = await api.post<LabTestOrder>('/lab-tests/orders', request);
    return response.data;
  },

  async findByPatient(
    patientId: string,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<LabTestOrder>> {
    const response = await api.get<PaginatedResponse<LabTestOrder>>(
      `/lab-tests/orders/patient/${patientId}`,
      {
        params: { page, size },
      }
    );
    return response.data;
  },

  async findByVisit(visitId: string): Promise<LabTestOrder[]> {
    const response = await api.get<LabTestOrder[]>(`/lab-tests/orders/visit/${visitId}`);
    return response.data;
  },

  async list(
    status?: LabTestStatus,
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<LabTestOrder>> {
    const response = await api.get<PaginatedResponse<LabTestOrder>>('/lab-tests/orders', {
      params: {
        status,
        page,
        size,
      },
    });
    return response.data;
  },

  async updateStatus(
    orderId: string,
    payload: LabTestStatusUpdateRequest
  ): Promise<LabTestOrder> {
    const response = await api.put<LabTestOrder>(
      `/lab-tests/orders/${orderId}/status`,
      payload
    );
    return response.data;
  },
};

export default labTestService;


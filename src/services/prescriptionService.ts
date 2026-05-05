import api from '@/lib/api';
import type {
  Prescription,
  PrescriptionRequest,
  PrescriptionStatus,
  PharmacyValidationPayload,
} from '@/types/prescription';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface ListParams {
  status?: PrescriptionStatus;
  search?: string;
  page?: number;
  size?: number;
}

const BASE_URL = '/prescriptions';

export const prescriptionService = {
  async create(request: PrescriptionRequest): Promise<Prescription> {
    const response = await api.post<Prescription>(BASE_URL, request);
    return response.data;
  },

  async update(id: string, request: PrescriptionRequest): Promise<Prescription> {
    const response = await api.put<Prescription>(`${BASE_URL}/${id}`, request);
    return response.data;
  },

  async findById(id: string): Promise<Prescription> {
    const response = await api.get<Prescription>(`${BASE_URL}/${id}`);
    return response.data;
  },

  async findByPatient(
    patientId: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Prescription>> {
    const response = await api.get<PaginatedResponse<Prescription>>(
      `${BASE_URL}/patient/${patientId}`,
      {
        params: { page, size },
      }
    );
    return response.data;
  },

  async list(params?: ListParams): Promise<PaginatedResponse<Prescription>> {
    const response = await api.get<PaginatedResponse<Prescription>>(BASE_URL, {
      params: {
        status: params?.status,
        search: params?.search,
        page: params?.page ?? 0,
        size: params?.size ?? 20,
      },
    });
    return response.data;
  },

  async validateByPharmacy(id: string, payload: PharmacyValidationPayload): Promise<Prescription> {
    const response = await api.post<Prescription>(`${BASE_URL}/${id}/pharmacy-validation`, payload);
    return response.data;
  },

  async cancel(id: string): Promise<Prescription> {
    const response = await api.post<Prescription>(`${BASE_URL}/${id}/cancel`);
    return response.data;
  },
};

export default prescriptionService;

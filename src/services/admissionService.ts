import api from '@/lib/api';
import type {
  Admission,
  AdmissionFilters,
  AdmissionRequest,
  AdmissionUpdateRequest,
  AdmissionStatus,
  Bed,
  BedAllocationPayload,
  BedBoardSummary,
  BedTransferPayload,
  DischargeRequest,
  WardBoard,
} from '@/types/admission';

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class AdmissionService {
  async create(payload: AdmissionRequest): Promise<Admission> {
    const response = await api.post<Admission>('/admissions', payload);
    return response.data;
  }

  async update(admissionId: string, payload: AdmissionUpdateRequest): Promise<Admission> {
    const response = await api.put<Admission>(`/admissions/${admissionId}`, payload);
    return response.data;
  }

  async findById(admissionId: string): Promise<Admission> {
    const response = await api.get<Admission>(`/admissions/${admissionId}`);
    return response.data;
  }

  async findAll(filters?: AdmissionFilters): Promise<PaginatedResponse<Admission>> {
    const params = {
      page: filters?.page ?? 0,
      size: filters?.size ?? 20,
      sortBy: filters?.sortBy ?? 'admissionDate',
      sortDir: filters?.sortDir ?? 'desc',
    };

    const response = await api.get<PaginatedResponse<Admission>>('/admissions', { params });
    return response.data;
  }

  async findByStatus(status: AdmissionStatus): Promise<Admission[]> {
    const response = await api.get<Admission[]>(`/admissions/status/${status}`);
    return response.data;
  }

  async listAwaitingBed(): Promise<Admission[]> {
    const response = await api.get<Admission[]>('/admissions/awaiting-bed');
    return response.data;
  }

  async listCriticalAwaitingBed(): Promise<Admission[]> {
    const response = await api.get<Admission[]>('/admissions/critical-awaiting-bed');
    return response.data;
  }

  async listActive(): Promise<Admission[]> {
    const response = await api.get<Admission[]>('/admissions/active');
    return response.data;
  }

  async listIsolation(): Promise<Admission[]> {
    const response = await api.get<Admission[]>('/admissions/isolation');
    return response.data;
  }

  async discharge(admissionId: string, payload: DischargeRequest): Promise<Admission> {
    const response = await api.post<Admission>(`/admissions/${admissionId}/discharge`, {
      admissionId,
      ...payload,
    });
    return response.data;
  }

  async transfer(admissionId: string): Promise<Admission> {
    const response = await api.post<Admission>(`/admissions/${admissionId}/transfer`);
    return response.data;
  }

  async cancel(admissionId: string, reason: string): Promise<Admission> {
    const response = await api.post<Admission>(`/admissions/${admissionId}/cancel`, null, {
      params: { reason },
    });
    return response.data;
  }

  async getBedBoard(): Promise<WardBoard[]> {
    const response = await api.get<WardBoard[]>('/bed-board');
    return response.data;
  }

  async getWardBedBoard(wardId: string): Promise<WardBoard> {
    const response = await api.get<WardBoard>(`/bed-board/ward/${wardId}`);
    return response.data;
  }

  async getBedBoardSummary(): Promise<BedBoardSummary> {
    const response = await api.get<BedBoardSummary>('/bed-board/summary');
    return response.data;
  }

  async allocateBed(payload: BedAllocationPayload): Promise<Bed> {
    const response = await api.post<Bed>('/beds/allocate', payload);
    return response.data;
  }

  async transferBed(payload: BedTransferPayload): Promise<Bed> {
    const response = await api.post<Bed>('/beds/transfer', payload);
    return response.data;
  }
}

export const admissionService = new AdmissionService();
export default admissionService;

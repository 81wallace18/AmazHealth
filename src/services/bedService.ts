import api from '@/lib/api';

export interface Bed {
  id: string;
  organizationId: string;
  wardId: string;
  wardName?: string;
  bedNumber: string;
  bedType: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'blocked' | 'cleaning';
  currentPatientId?: string;
  currentPatientName?: string;
  currentAdmissionId?: string;
  nearWindow: boolean;
  oxygenSupport: boolean;
  suctionSupport: boolean;
  monitorSupport: boolean;
  isIsolation: boolean;
  specialNeeds?: string;
  lastCleanedAt?: string;
  maintenanceNotes?: string;
  priorityLevel: number;
  allocatedAt?: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBedRequest {
  wardId: string;
  bedNumber: string;
  bedType: string;
  nearWindow?: boolean;
  oxygenSupport?: boolean;
  suctionSupport?: boolean;
  monitorSupport?: boolean;
  isIsolation?: boolean;
  specialNeeds?: string;
  priorityLevel?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const bedService = {
  async list(page = 0, size = 20, sortBy = 'bedNumber', sortDir = 'asc'): Promise<PageResponse<Bed>> {
    const response = await api.get<PageResponse<Bed>>('/beds', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  async listAvailable(): Promise<Bed[]> {
    const response = await api.get<Bed[]>('/beds/available');
    return response.data;
  },

  async listByWard(wardId: string): Promise<Bed[]> {
    const response = await api.get<Bed[]>(`/beds/ward/${wardId}`);
    return response.data;
  },

  async create(data: CreateBedRequest): Promise<Bed> {
    const response = await api.post<Bed>('/beds', data);
    return response.data;
  },

  async markForMaintenance(bedId: string, reason: string): Promise<void> {
    await api.post(`/beds/${bedId}/maintenance`, null, {
      params: { reason },
    });
  },

  async markAsCleaned(bedId: string): Promise<void> {
    await api.post(`/beds/${bedId}/cleaned`);
  },
};

export default bedService;

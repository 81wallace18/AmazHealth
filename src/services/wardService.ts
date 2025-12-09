import api from '@/lib/api';

export interface Ward {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  wardType: 'INFIRMARY' | 'ICU' | 'EMERGENCY_ROOM' | 'PRIVATE_ROOM' | 'SEMI_PRIVATE' | 'PEDIATRIC' | 'MATERNITY' | 'SURGICAL_CENTER' | 'RECOVERY' | 'OBSERVATION';
  floorNumber?: number;
  block?: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  phoneExtension?: string;
  capacityLimit?: number;
  specialEquipment?: string;
  visitingHours?: string;
  responsibleNurse?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateWardRequest {
  code: string;
  name: string;
  description?: string;
  wardType: string;
  floorNumber?: number;
  block?: string;
  phoneExtension?: string;
  capacityLimit?: number;
  specialEquipment?: string;
  visitingHours?: string;
  responsibleNurse?: string;
  notes?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const wardService = {
  async list(page = 0, size = 20, sortBy = 'name', sortDir = 'asc'): Promise<PageResponse<Ward>> {
    const response = await api.get<PageResponse<Ward>>('/wards', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  async listAvailable(): Promise<Ward[]> {
    const response = await api.get<Ward[]>('/wards/available');
    return response.data;
  },

  async create(data: CreateWardRequest): Promise<Ward> {
    const response = await api.post<Ward>('/wards', data);
    return response.data;
  },

  async update(id: string, data: CreateWardRequest): Promise<Ward> {
    const response = await api.put<Ward>(`/wards/${id}`, data);
    return response.data;
  },
};

export default wardService;

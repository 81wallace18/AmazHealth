import api from '@/lib/api';
import type { Sector } from '@/types/sector';

export interface CreateSectorRequest {
  name: string;
  type: string;
  code: string;
  category: 'AREA' | 'SERVICE';
  active?: boolean;
}

export const sectorService = {
  async list(category?: 'AREA' | 'SERVICE'): Promise<Sector[]> {
    const response = await api.get<Sector[]>('/sectors', {
      params: category ? { category } : undefined
    });
    return response.data;
  },

  async create(data: CreateSectorRequest): Promise<Sector> {
    const response = await api.post<Sector>('/sectors', data);
    return response.data;
  },
};

export default sectorService;

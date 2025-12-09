import api from '@/lib/api';
import type { Sector } from '@/types/sector';

export interface CreateSectorRequest {
  name: string;
  type: string;
}

export const sectorService = {
  async list(): Promise<Sector[]> {
    const response = await api.get<Sector[]>('/sectors');
    return response.data;
  },

  async create(data: CreateSectorRequest): Promise<Sector> {
    const response = await api.post<Sector>('/sectors', data);
    return response.data;
  },
};

export default sectorService;

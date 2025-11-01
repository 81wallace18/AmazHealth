import api from '@/lib/api';
import type { Sector } from '@/types/sector';

export const sectorService = {
  async list(): Promise<Sector[]> {
    const response = await api.get<Sector[]>('/sectors');
    return response.data;
  },
};

export default sectorService;

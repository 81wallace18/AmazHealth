import api from '@/lib/api';

export interface Icd10Entry {
  code: string;
  description: string;
}

class Icd10Service {
  async search(query: string): Promise<Icd10Entry[]> {
    if (!query.trim()) return [];
    const response = await api.get<Icd10Entry[]>('/icd10/search', { params: { q: query } });
    return response.data;
  }
}

export const icd10Service = new Icd10Service();
export default icd10Service;

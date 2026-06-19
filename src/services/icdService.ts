import api from '@/lib/api';
import type { IcdSearchResult, IcdSystem } from '@/types/icd';

class IcdService {
  async search(query: string, system: IcdSystem): Promise<IcdSearchResult[]> {
    if (!query.trim()) return [];
    const response = await api.get<IcdSearchResult[]>('/icd/search', {
      params: { q: query, system },
    });
    return response.data;
  }
}

export const icdService = new IcdService();
export default icdService;

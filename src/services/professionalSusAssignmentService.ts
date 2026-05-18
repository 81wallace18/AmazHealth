import api from '@/lib/api';
import type {
  ProfessionalSusAssignment,
  ProfessionalSusAssignmentRequest,
} from '@/types/professionalSusAssignment';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

class ProfessionalSusAssignmentService {
  private baseUrl = '/professional-sus-assignments';

  async findByStaff(staffId: string): Promise<ProfessionalSusAssignment[]> {
    const response = await api.get<ProfessionalSusAssignment[]>(`${this.baseUrl}/by-staff/${staffId}`);
    return response.data;
  }

  async create(data: ProfessionalSusAssignmentRequest): Promise<ProfessionalSusAssignment> {
    const response = await api.post<ProfessionalSusAssignment>(this.baseUrl, data);
    return response.data;
  }

  async update(id: string, data: ProfessionalSusAssignmentRequest): Promise<ProfessionalSusAssignment> {
    const response = await api.put<ProfessionalSusAssignment>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deactivate(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export const professionalSusAssignmentService = new ProfessionalSusAssignmentService();
export default professionalSusAssignmentService;

import api from '@/lib/api';
import type {
  MedicalRecordRequest,
  MedicalRecordResponse,
  MedicalRecordSearchParams,
} from '@/types/medicalRecord';

/**
 * Service para prontuário eletrônico
 * Épico C: US-C1, US-C2, US-C3, US-C4
 */

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const medicalRecordService = {
  /**
   * US-C1 e US-C2: Criar registro no prontuário
   * Permite "folha em branco" (apenas notes obrigatório)
   */
  async create(data: MedicalRecordRequest): Promise<MedicalRecordResponse> {
    const response = await api.post<MedicalRecordResponse>('/medical-records', data);
    return response.data;
  },

  /**
   * US-C4: Atualizar registro
   * Apenas autor pode editar nas primeiras 24h
   */
  async update(id: string, data: MedicalRecordRequest): Promise<MedicalRecordResponse> {
    const response = await api.put<MedicalRecordResponse>(`/medical-records/${id}`, data);
    return response.data;
  },

  /**
   * Buscar registro por ID
   */
  async findById(id: string): Promise<MedicalRecordResponse> {
    const response = await api.get<MedicalRecordResponse>(`/medical-records/${id}`);
    return response.data;
  },

  /**
   * US-C3: Histórico do prontuário de um paciente (paginado)
   */
  async findByPatient(
    patientId: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedResponse<MedicalRecordResponse>> {
    const queryParams = {
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    };

    const response = await api.get<PaginatedResponse<MedicalRecordResponse>>(
      `/medical-records/patient/${patientId}`,
      { params: queryParams }
    );
    return response.data;
  },

  /**
   * Buscar registros de uma visita específica
   */
  async findByVisit(visitId: string): Promise<MedicalRecordResponse[]> {
    const response = await api.get<MedicalRecordResponse[]>(
      `/medical-records/visit/${visitId}`
    );
    return response.data;
  },

  /**
   * Buscar últimos N registros de um paciente
   */
  async findLatest(patientId: string, limit: number = 5): Promise<MedicalRecordResponse[]> {
    const response = await api.get<MedicalRecordResponse[]>(
      `/medical-records/patient/${patientId}/latest`,
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Deletar registro
   * Apenas autor pode deletar nas primeiras 24h
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/medical-records/${id}`);
  },
};

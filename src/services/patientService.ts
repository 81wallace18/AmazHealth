import api from '@/lib/api';
import type {
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientSearchParams
} from '@/types/patient';

/**
 * Service para gerenciamento de pacientes
 * Integrado com backend Spring Boot
 */

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const patientService = {
  /**
   * US-A1: Busca de pacientes
   */
  async search(params: PatientSearchParams): Promise<PaginatedResponse<Patient>> {
    const queryParams: Record<string, unknown> = {
      page: params.page ?? 0,
      size: params.size ?? 20
    };

    if (params.query) {
      queryParams.q = params.query;
    }
    if (params.status) {
      queryParams.status = params.status;
    }

    const response = await api.get<PaginatedResponse<Patient>>('/patients', {
      params: queryParams
    });
    return response.data;
  },

  /**
   * US-A2: Verificar duplicatas
   * Busca pacientes similares por nome e data de nascimento
   */
  async checkDuplicates(
    firstName: string,
    lastName: string,
    dateOfBirth: string
  ): Promise<Patient[]> {
    const response = await api.get<PaginatedResponse<Patient>>('/patients/search/duplicates', {
      params: {
        firstName,
        lastName,
        dateOfBirth
      }
    });
    return response.data.content;
  },

  /**
   * US-A2: Cadastrar novo paciente
   */
  async create(data: PatientCreateRequest): Promise<Patient> {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  },

  /**
   * Buscar paciente por ID
   */
  async getById(id: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  /**
   * Atualizar paciente
   */
  async update(id: string, data: PatientUpdateRequest): Promise<Patient> {
    const response = await api.put<Patient>(`/patients/${id}`, data);
    return response.data;
  },

  /**
   * Listar pacientes (paginado)
   */
  async list(page = 0, size = 20, status?: string): Promise<PaginatedResponse<Patient>> {
    const params: Record<string, unknown> = { page, size };
    if (status) {
      params.status = status;
    }

    const response = await api.get<PaginatedResponse<Patient>>('/patients', { params });
    return response.data;
  },

  /**
   * US-A3: Registrar impressão de identificação (audit trail)
   */
  async printIdentification(patientId: string, attendanceNumber?: string): Promise<void> {
    await api.post(
      `/patients/${patientId}/identification/print`,
      attendanceNumber ? { attendanceNumber } : {}
    );
  },

  /**
   * US-A3: Registrar reimpressão de identificação (audit trail)
   */
  async reprintIdentification(patientId: string, reason?: string): Promise<void> {
    await api.post(
      `/patients/${patientId}/identification/reprint`,
      reason ? { reason } : {}
    );
  },

  /**
   * Buscar por CPF
   */
  async findByCpf(cpf: string): Promise<Patient | null> {
    try {
      const response = await api.get<PaginatedResponse<Patient>>('/patients', {
        params: { q: cpf }
      });
      return response.data.content[0] || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Buscar por CNS
   */
  async findByCns(cns: string): Promise<Patient | null> {
    try {
      const response = await api.get<PaginatedResponse<Patient>>('/patients', {
        params: { q: cns }
      });
      return response.data.content[0] || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Buscar por nome da mãe (útil para identificação)
   */
  async findByMotherName(motherName: string): Promise<PaginatedResponse<Patient>> {
    const response = await api.get<PaginatedResponse<Patient>>('/patients', {
      params: { q: motherName }
    });
    return response.data;
  },

  /**
   * Contar pacientes por status
   */
  async countByStatus(status: string): Promise<number> {
    const response = await api.get<number>(`/patients/count/active`);
    return response.data;
  },

  /**
   * Deletar paciente
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  }
};

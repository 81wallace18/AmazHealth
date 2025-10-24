import api from '@/lib/api';
import type {
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientSearchParams,
  PatientIdentification
} from '@/types/patient';

/**
 * Service para gerenciamento de pacientes
 * Integrado com backend Spring Boot
 */

// Helper para obter organizationId do usuário logado
function getOrganizationId(): string {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      return parsedUser.organizationId;
    } catch (e) {
      console.error('[PatientService] Erro ao obter organizationId do localStorage:', e);
    }
  }

  // Fallback para desenvolvimento (será removido quando JWT estiver totalmente implementado)
  console.warn('[PatientService] Usando organizationId padrão. Usuário não está logado.');
  return '550e8400-e29b-41d4-a716-446655440000';
}

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
    const response = await api.get<PaginatedResponse<Patient>>('/patients', {
      params: {
        organizationId: getOrganizationId(),
        q: params.query,
        status: params.status,
        page: params.page || 0,
        size: params.size || 20
      }
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
    const response = await api.get<Patient[]>('/patients/search/duplicates', {
      params: {
        organizationId: getOrganizationId(),
        firstName,
        lastName,
        dateOfBirth
      }
    });
    return response.data;
  },

  /**
   * US-A2: Cadastrar novo paciente
   */
  async create(data: PatientCreateRequest): Promise<Patient> {
    const response = await api.post<Patient>('/patients', data, {
      params: { organizationId: getOrganizationId() }
    });
    return response.data;
  },

  /**
   * Buscar paciente por ID
   */
  async getById(id: string): Promise<Patient> {
    const response = await api.get<Patient>(`/patients/${id}`, {
      params: { organizationId: getOrganizationId() }
    });
    return response.data;
  },

  /**
   * Atualizar paciente
   */
  async update(id: string, data: PatientUpdateRequest): Promise<Patient> {
    const response = await api.put<Patient>(`/patients/${id}`, data, {
      params: { organizationId: getOrganizationId() }
    });
    return response.data;
  },

  /**
   * Listar pacientes (paginado)
   */
  async list(page = 0, size = 20, status?: string): Promise<PaginatedResponse<Patient>> {
    const response = await api.get<PaginatedResponse<Patient>>('/patients', {
      params: { organizationId: getOrganizationId(), page, size, status }
    });
    return response.data;
  },

  /**
   * US-A3: Obter identificação do paciente
   */
  async getIdentification(patientId: string): Promise<PatientIdentification> {
    const response = await api.get<PatientIdentification>(
      `/patients/${patientId}/identification`,
      {
        params: { organizationId: getOrganizationId() }
      }
    );
    return response.data;
  },

  /**
   * US-A3: Registrar impressão de identificação (audit trail)
   */
  async printIdentification(patientId: string, attendanceId?: string): Promise<void> {
    await api.post(`/patients/${patientId}/identification/print`,
      attendanceId ? { attendanceId } : {},
      {
        params: { organizationId: getOrganizationId() }
      }
    );
  },

  /**
   * US-A3: Registrar reimpressão de identificação (audit trail)
   */
  async reprintIdentification(patientId: string, reason?: string): Promise<void> {
    await api.post(`/patients/${patientId}/identification/reprint`,
      reason ? { reason } : {},
      {
        params: { organizationId: getOrganizationId() }
      }
    );
  },

  /**
   * Buscar por CPF
   */
  async findByCpf(cpf: string): Promise<Patient | null> {
    try {
      const response = await api.get<PaginatedResponse<Patient>>('/patients', {
        params: { organizationId: getOrganizationId(), q: cpf }
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
        params: { organizationId: getOrganizationId(), q: cns }
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
      params: { organizationId: getOrganizationId(), q: motherName }
    });
    return response.data;
  },

  /**
   * Contar pacientes por status
   */
  async countByStatus(status: string): Promise<number> {
    const response = await api.get<{ count: number }>(`/patients/count/active`, {
      params: { organizationId: getOrganizationId() }
    });
    return response.data;
  },

  /**
   * Deletar paciente
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/patients/${id}`, {
      params: { organizationId: getOrganizationId() }
    });
  }
};

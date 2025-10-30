import api from '@/lib/api';

export interface CreateAttendanceDTO {
  patientId: string;
  type: 'urgencia' | 'ambulatorial';
  paymentType: 'sus' | 'convenio' | 'particular';
  healthInsuranceId?: string;
  healthInsuranceName?: string;
  healthInsuranceNumber?: string;
  chiefComplaint?: string;
}

export interface Attendance {
  id: string;
  organizationId: string;
  patientId: string;
  attendanceNumber: string; // PA-2025-001234
  type: 'urgencia' | 'ambulatorial';
  entryDate: string;
  status: 'aguardando_triagem' | 'em_triagem' | 'aguardando_atendimento' | 'em_atendimento' | 'finalizado';
  paymentType: 'sus' | 'convenio' | 'particular';
  healthInsuranceId?: string;
  healthInsuranceName?: string;
  healthInsuranceNumber?: string;
  chiefComplaint?: string;
  outcome?: 'alta' | 'internacao' | 'obito' | 'transferencia' | 'evasao';
  outcomeDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Helper para obter organizationId do usuário logado
 */
function getOrganizationId(): string {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      return parsedUser.organizationId;
    } catch (e) {
      console.error('[AttendanceService] Erro ao obter organizationId do localStorage:', e);
    }
  }

  // Fallback para desenvolvimento (será removido quando JWT estiver totalmente implementado)
  console.warn('[AttendanceService] Usando organizationId padrão. Usuário não está logado.');
  return '550e8400-e29b-41d4-a716-446655440000';
}

class AttendanceService {
  /**
   * Cria um novo atendimento
   * Endpoint: POST /api/v1/attendances
   * ✅ INTEGRADO COM BACKEND - Sprint 0
   */
  async create(data: CreateAttendanceDTO): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendances', data, {
      params: { organizationId: getOrganizationId() }
    });
    return response.data;
  }

  /**
   * Busca atendimento por ID
   * Endpoint: GET /api/attendances/:id
   */
  async findById(id: string): Promise<Attendance> {
    // TODO: Implementar quando backend estiver disponível
    // const response = await api.get<Attendance>(`/attendances/${id}`);
    // return response.data;

    throw new Error('Not implemented');
  }

  /**
   * Lista atendimentos de um paciente
   * Endpoint: GET /api/attendances?patientId=xxx
   */
  async findByPatient(patientId: string): Promise<Attendance[]> {
    // TODO: Implementar quando backend estiver disponível
    // const response = await api.get<Attendance[]>(`/attendances`, {
    //   params: { patientId }
    // });
    // return response.data;

    return [];
  }

  /**
   * Lista atendimentos por status
   * Endpoint: GET /api/attendances?status=xxx
   */
  async findByStatus(status: Attendance['status']): Promise<Attendance[]> {
    // TODO: Implementar quando backend estiver disponível
    // const response = await api.get<Attendance[]>(`/attendances`, {
    //   params: { status }
    // });
    // return response.data;

    return [];
  }

  /**
   * Atualiza status do atendimento
   * Endpoint: PATCH /api/attendances/:id/status
   */
  async updateStatus(id: string, status: Attendance['status']): Promise<Attendance> {
    // TODO: Implementar quando backend estiver disponível
    // const response = await api.patch<Attendance>(`/attendances/${id}/status`, { status });
    // return response.data;

    throw new Error('Not implemented');
  }

  /**
   * Finaliza atendimento com desfecho
   * Endpoint: PATCH /api/attendances/:id/finalize
   */
  async finalize(id: string, outcome: Attendance['outcome']): Promise<Attendance> {
    // TODO: Implementar quando backend estiver disponível
    // const response = await api.patch<Attendance>(`/attendances/${id}/finalize`, { outcome });
    // return response.data;

    throw new Error('Not implemented');
  }
}

export default new AttendanceService();

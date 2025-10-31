import api from '@/lib/api';

export interface CreateAttendanceDTO {
  patientId: string;
  type: 'URGENCIA' | 'AMBULATORIAL';
  paymentType: 'SUS' | 'CONVENIO' | 'PARTICULAR';
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
  type: 'URGENCIA' | 'AMBULATORIAL';
  entryDate: string;
  status: 'AGUARDANDO_TRIAGEM' | 'EM_TRIAGEM' | 'AGUARDANDO_ATENDIMENTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO_EXAMES' | 'FINALIZADO' | 'CANCELADO';
  paymentType: 'SUS' | 'CONVENIO' | 'PARTICULAR';
  healthInsuranceId?: string;
  healthInsuranceName?: string;
  healthInsuranceNumber?: string;
  chiefComplaint?: string;
  outcome?: 'ALTA' | 'INTERNACAO' | 'OBITO' | 'TRANSFERENCIA' | 'EVASAO';
  outcomeDate?: string;
  createdAt: string;
  updatedAt: string;
}

class AttendanceService {
  /**
   * Cria um novo atendimento
   * Endpoint: POST /api/v1/attendances
   * ✅ INTEGRADO COM BACKEND - Sprint 0
   */
  async create(data: CreateAttendanceDTO): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendances', data);
    return response.data;
  }

  /**
   * Busca atendimento por ID
   * Endpoint: GET /api/attendances/:id
   */
  async findById(id: string): Promise<Attendance> {
    const response = await api.get<Attendance>(`/attendances/${id}`);
    return response.data;
  }

  /**
   * Lista atendimentos de um paciente
   * Endpoint: GET /api/attendances?patientId=xxx
   */
  async findByPatient(patientId: string): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>(`/attendances`, {
      params: { patientId }
    });
    return response.data;
  }

  /**
   * Lista atendimentos por status
   * Endpoint: GET /api/attendances?status=xxx
   */
  async findByStatus(status: Attendance['status']): Promise<Attendance[]> {
    const response = await api.get<{ content: Attendance[] }>(`/attendances`, {
      params: { status }
    });
    return response.data.content ?? [];
  }

  /**
   * Atualiza status do atendimento
   * Endpoint: PATCH /api/attendances/:id/status
   */
  async updateStatus(id: string, status: Attendance['status']): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendances/${id}/status`, { status });
    return response.data;
  }

  /**
   * Finaliza atendimento com desfecho
   * Endpoint: PATCH /api/attendances/:id/finalize
   */
  async finalize(id: string, outcome: Attendance['outcome']): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendances/${id}/finalize`, { outcome });
    return response.data;
  }
}

export default new AttendanceService();

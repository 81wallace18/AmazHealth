import api from './api';

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

class AttendanceService {
  /**
   * Cria um novo atendimento
   * Endpoint: POST /api/attendances
   */
  async create(data: CreateAttendanceDTO): Promise<Attendance> {
    // TODO: Integrar com backend quando endpoint estiver disponível
    // const response = await api.post<Attendance>('/attendances', data);
    // return response.data;

    // Mock temporário para desenvolvimento
    console.warn('[AttendanceService] Backend não implementado. Usando mock.');

    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAttendance: Attendance = {
          id: crypto.randomUUID(),
          organizationId: '00000000-0000-0000-0000-000000000000',
          patientId: data.patientId,
          attendanceNumber: `PA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          type: data.type,
          entryDate: new Date().toISOString(),
          status: 'aguardando_triagem',
          paymentType: data.paymentType,
          healthInsuranceId: data.healthInsuranceId,
          healthInsuranceName: data.healthInsuranceName,
          healthInsuranceNumber: data.healthInsuranceNumber,
          chiefComplaint: data.chiefComplaint,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(mockAttendance);
      }, 800);
    });
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

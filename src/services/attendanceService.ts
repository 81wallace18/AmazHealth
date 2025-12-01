import api from '@/lib/api';
import type { PatientIdentification } from '@/types/patient';

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
  visitId?: string; // ID da OpdVisit associada
}

export interface FinalizeAttendancePayload {
  outcome: Attendance['outcome'];
  notes?: string;
  physicianId?: string;
  admissionReason?: string;
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
  async finalize(id: string, payload: FinalizeAttendancePayload): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendances/${id}/finalize`, payload);
    return response.data;
  }

  /**
   * Reimprime etiqueta vinculada ao atendimento
   * Endpoint: POST /api/v1/attendances/:id/reprint-label
   */
  async reprintLabel(id: string, reason?: string): Promise<PatientIdentification> {
    const response = await api.post<PatientIdentification>(
      `/attendances/${id}/reprint-label`,
      reason ? { reason } : {}
    );
    return response.data;
  }

  /**
   * Busca attendance por visitId
   * Como não há endpoint específico, busca todos e filtra localmente
   */
  async findByVisitId(visitId: string): Promise<Attendance | null> {
    try {
      // Busca em todos os status possíveis
      const statuses: Attendance['status'][] = [
        'AGUARDANDO_ATENDIMENTO',
        'EM_ATENDIMENTO',
        'AGUARDANDO_EXAMES',
        'EM_TRIAGEM',
        'AGUARDANDO_TRIAGEM'
      ];

      for (const status of statuses) {
        const attendances = await this.findByStatus(status);
        const found = attendances.find(att => att.visitId === visitId);
        if (found) {
          return found;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar attendance por visitId:', error);
      return null;
    }
  }
}

export default new AttendanceService();

import api from '@/lib/api';
import type { PatientIdentification } from '@/types/patient';

export interface CreateAttendanceDTO {
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  visitType: 'URGENCIA' | 'AMBULATORIAL';
}

export type VisitStatus =
  | 'CREATED'
  | 'TRIAGED'
  | 'WAITING_DOCTOR'
  | 'IN_PROGRESS'
  | 'WAITING_EXAM'
  | 'EXAM_COMPLETED'
  | 'DISCHARGED'
  | 'ADMITTED'
  | 'TRANSFERRED'
  | 'CANCELLED';

export interface Attendance {
  id: string;
  organizationId: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
  visitCode: string;
  visitType: string;
  status: VisitStatus;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceOutcome = 'ALTA' | 'INTERNACAO' | 'OBITO' | 'TRANSFERENCIA' | 'EVASAO';

export interface FinalizeAttendancePayload {
  outcome: AttendanceOutcome;
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
   * Endpoint: GET /api/v1/attendances?patientId=xxx
   */
  async findByPatient(patientId: string): Promise<Attendance[]> {
    const response = await api.get<{ content: Attendance[] }>(`/attendances`, {
      params: { patientId }
    });
    return response.data.content ?? [];
  }

  /**
   * Lista atendimentos por status
   * Endpoint: GET /api/v1/attendances/status/:status
   */
  async findByStatus(status: VisitStatus): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>(`/attendances/status/${status}`);
    return response.data;
  }

  /**
   * Atualiza status do atendimento
   * Endpoint: PATCH /api/attendances/:id/status
   */
  async updateStatus(id: string, status: VisitStatus): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendances/${id}/status`, { newStatus: status });
    return response.data;
  }

  /**
   * Compatibilidade com fluxo legado de finalização.
   * Mapeia desfecho para o status oficial de OpdVisit.
   */
  async finalize(id: string, payload: FinalizeAttendancePayload): Promise<Attendance> {
    const statusByOutcome: Record<NonNullable<FinalizeAttendancePayload['outcome']>, VisitStatus> = {
      ALTA: 'DISCHARGED',
      INTERNACAO: 'ADMITTED',
      TRANSFERENCIA: 'TRANSFERRED',
      EVASAO: 'CANCELLED',
      OBITO: 'CANCELLED',
    };

    if (payload.notes?.trim()) {
      await api.post(`/attendances/${id}/evolution`, { notes: payload.notes.trim() });
    }

    return this.updateStatus(id, statusByOutcome[payload.outcome]);
  }

  /**
   * O backend atual não expõe endpoint de reimpressão por atendimento.
   */
  async reprintLabel(id: string, _reason?: string): Promise<PatientIdentification> {
    const attendance = await this.findById(id);
    const now = new Date().toISOString();
    return {
      patientId: attendance.patientId,
      organizationId: attendance.organizationId,
      patientCode: attendance.visitCode,
      fullName: 'Paciente',
      dateOfBirth: now.substring(0, 10),
      attendanceId: attendance.id,
      attendanceNumber: attendance.visitCode,
      barcode: attendance.visitCode,
      printedAt: now,
    };
  }

  /**
   * No modelo atual, o ID da visita é o próprio ID do atendimento.
   */
  async findByVisitId(visitId: string): Promise<Attendance | null> {
    try {
      return await this.findById(visitId);
    } catch (error) {
      console.error('Erro ao buscar attendance por visitId:', error);
      return null;
    }
  }
}

export default new AttendanceService();

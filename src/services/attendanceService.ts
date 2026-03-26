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
  doctorId?: string | null;
  visitCode: string;
  visitType: 'URGENCIA' | 'AMBULATORIAL' | string;
  visitDate: string;
  status: VisitStatus;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  outcome?: AttendanceOutcome | null;
  outcomeDate?: string | null;
  outcomeNotes?: string | null;
  finalizedBy?: string | null;
  emergencyBypass?: boolean;
  bypassJustification?: string | null;
  notificationRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyBypassPayload {
  patientId: string;
  doctorId?: string;
  chiefComplaint: string;
  bypassJustification: string;
  visitType?: string;
}

export type AttendanceOutcome = 'ALTA' | 'INTERNACAO' | 'OBITO' | 'TRANSFERENCIA' | 'EVASAO';

export interface FinalizeAttendancePayload {
  outcome: AttendanceOutcome;
  notes: string;
  physicianId?: string;
  admissionReason?: string;
}

class AttendanceService {
  private normalizeAttendanceStatus(status: Attendance['status']): VisitStatus {
    switch (status) {
      case 'AWAITING_TRIAGE':
      case 'OPEN':
        return 'CREATED';
      case 'AWAITING_DOCTOR':
        return 'WAITING_DOCTOR';
      case 'IN_ATTENDANCE':
        return 'IN_PROGRESS';
      case 'CLOSED':
        return 'DISCHARGED';
      default:
        return status;
    }
  }

  private normalizeAttendance(attendance: Attendance): Attendance {
    return {
      ...attendance,
      status: this.normalizeAttendanceStatus(attendance.status),
    };
  }

  /**
   * Cria um novo atendimento
   * Endpoint: POST /api/v1/attendances
   * ✅ INTEGRADO COM BACKEND - Sprint 0
   */
  async create(data: CreateAttendanceDTO): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendances', data);
    return this.normalizeAttendance(response.data);
  }

  /**
   * Busca atendimento por ID
   * Endpoint: GET /api/attendances/:id
   */
  async findById(id: string): Promise<Attendance> {
    const response = await api.get<Attendance>(`/attendances/${id}`);
    return this.normalizeAttendance(response.data);
  }

  /**
   * Lista atendimentos de um paciente
   * Endpoint: GET /api/v1/attendances?patientId=xxx
   */
  async findByPatient(patientId: string): Promise<Attendance[]> {
    const response = await api.get<{ content: Attendance[] }>(`/attendances`, {
      params: { patientId, size: 100 }
    });
    return (response.data.content ?? []).map((attendance) => this.normalizeAttendance(attendance));
  }

  /**
   * Lista atendimentos por status
   * Endpoint: GET /api/v1/attendances/status/:status
   */
  async findByStatus(status: Attendance['status']): Promise<Attendance[]> {
    const normalizedStatus = this.normalizeAttendanceStatus(status);
    const response = await api.get<Attendance[]>(`/attendances/status/${normalizedStatus}`);
    return response.data.map((attendance) => this.normalizeAttendance(attendance));
  }

  /**
   * Atualiza status do atendimento
   * Endpoint: PATCH /api/attendances/:id/status
   */
  async updateStatus(id: string, status: Attendance['status']): Promise<Attendance> {
    const normalizedStatus = this.normalizeAttendanceStatus(status);
    const response = await api.patch<Attendance>(`/attendances/${id}/status`, { newStatus: normalizedStatus });
    return this.normalizeAttendance(response.data);
  }

  /**
   * Cria atendimento com bypass de emergência.
   * Paciente entra direto em IN_PROGRESS, triagem é retroativa.
   */
  async createEmergencyBypass(payload: EmergencyBypassPayload): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendances/emergency-bypass', payload);
    return this.normalizeAttendance(response.data);
  }

  /**
   * Finaliza atendimento com desfecho clínico via endpoint atômico.
   * Requer evolução clínica previamente registrada (hard stop no backend).
   */
  async finalize(id: string, payload: FinalizeAttendancePayload): Promise<Attendance> {
    const response = await api.post<Attendance>(`/attendances/${id}/finalize`, payload);
    return this.normalizeAttendance(response.data);
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
      const statuses: Attendance['status'][] = [
        'WAITING_EXAM',
        'WAITING_DOCTOR',
        'IN_PROGRESS',
        'CREATED',
      ];

      for (const status of statuses) {
        const attendances = await this.findByStatus(status);
        const found = attendances.find((att) => att.id === visitId);
        if (found) {
          return found;
        }
      }

      return null;
    }
  }
}

export default new AttendanceService();

import api from '@/lib/api';

export type PecShift = 'MANHA' | 'TARDE' | 'NOITE';

export interface PecCredentialStatus {
  staffId: string;
  username?: string;
  status: string;
  message?: string;
  lastTestedAt?: string;
  configured: boolean;
}

export interface PecShiftClosingItem {
  visitId: string;
  patientId: string;
  patientName: string;
  cpf?: string;
  cns?: string;
  dateOfBirth?: string;
  sex?: string;
  turn: PecShift;
  localAtendimento: string;
  procedures: string[];
  blockers: string[];
  ready: boolean;
}

export interface PecShiftClosingPreview {
  date: string;
  shift: PecShift;
  professionalSusAssignmentId: string;
  professionalName: string;
  cns?: string;
  cbo?: string;
  cnes?: string;
  ine?: string;
  credentialValid: boolean;
  readyCount: number;
  blockedCount: number;
  items: PecShiftClosingItem[];
  consolidatedProcedures: Record<string, number>;
  blockingMessages: string[];
  messages: string[];
}

export interface PecShiftClosingBatch {
  id: string;
  status: string;
  userMessage: string;
  readyCount: number;
  blockedCount: number;
  messages: string[];
  createdAt?: string;
  updatedAt?: string;
}

class PecShiftClosingService {
  private baseUrl = '/esus-aps/pec';

  async credentialStatus(): Promise<PecCredentialStatus> {
    const response = await api.get<PecCredentialStatus>(`${this.baseUrl}/credentials`);
    return response.data;
  }

  async saveCredential(username: string, password: string): Promise<PecCredentialStatus> {
    const response = await api.put<PecCredentialStatus>(`${this.baseUrl}/credentials`, { username, password });
    return response.data;
  }

  async testCredential(): Promise<PecCredentialStatus> {
    const response = await api.post<PecCredentialStatus>(`${this.baseUrl}/credentials/test`);
    return response.data;
  }

  async preview(date: string, shift: PecShift): Promise<PecShiftClosingPreview> {
    const params = new URLSearchParams({ date, shift });
    const response = await api.get<PecShiftClosingPreview>(`${this.baseUrl}/shift-closing/preview?${params}`);
    return response.data;
  }

  async createBatch(date: string, shift: PecShift): Promise<PecShiftClosingBatch> {
    const response = await api.post<PecShiftClosingBatch>(`${this.baseUrl}/shift-closing/batches`, { date, shift });
    return response.data;
  }

  async startBatch(id: string): Promise<PecShiftClosingBatch> {
    const response = await api.post<PecShiftClosingBatch>(`${this.baseUrl}/shift-closing/batches/${id}/start`);
    return response.data;
  }
}

export const pecShiftClosingService = new PecShiftClosingService();
export default pecShiftClosingService;

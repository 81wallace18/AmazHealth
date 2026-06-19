import api from '@/lib/api';

export type PecProcedureGroup = 'CONSOLIDADO' | 'INDIVIDUALIZADO' | 'TESTE_RAPIDO' | 'ADMINISTRACAO_MEDICAMENTO' | 'SIGTAP';

export interface PecProcedureMapping {
  id: string;
  code: string;
  displayName: string;
  procedureGroup: PecProcedureGroup;
  pecLabel?: string;
  sigtapCode?: string;
  requiresPatient: boolean;
  requiresAdministrationConfirmation: boolean;
}

export interface NursingProcedureRecord {
  id: string;
  visitId: string;
  patientId?: string;
  patientName?: string;
  staffId: string;
  procedureMappingId: string;
  procedureCode: string;
  procedureName: string;
  procedureGroup: PecProcedureGroup;
  performedAt: string;
  shift: 'MANHA' | 'TARDE' | 'NOITE';
  localAtendimento: string;
  quantity: number;
  source: string;
  exportStatus: string;
  notes?: string;
}

export interface NursingProcedureRequest {
  visitId: string;
  procedureMappingId: string;
  performedAt?: string;
  shift?: 'MANHA' | 'TARDE' | 'NOITE';
  localAtendimento?: string;
  quantity?: number;
  notes?: string;
}

class NursingProcedureService {
  private baseUrl = '/nursing-procedures';

  async mappings(): Promise<PecProcedureMapping[]> {
    const response = await api.get<PecProcedureMapping[]>(`${this.baseUrl}/mappings`);
    return response.data;
  }

  async byVisit(visitId: string): Promise<NursingProcedureRecord[]> {
    const response = await api.get<NursingProcedureRecord[]>(`${this.baseUrl}/by-visit/${visitId}`);
    return response.data;
  }

  async create(payload: NursingProcedureRequest): Promise<NursingProcedureRecord> {
    const response = await api.post<NursingProcedureRecord>(this.baseUrl, payload);
    return response.data;
  }

  async update(id: string, payload: NursingProcedureRequest): Promise<NursingProcedureRecord> {
    const response = await api.put<NursingProcedureRecord>(`${this.baseUrl}/${id}`, payload);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }
}

export const nursingProcedureService = new NursingProcedureService();
export default nursingProcedureService;

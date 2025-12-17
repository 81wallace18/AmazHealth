/**
 * Triage Service - Épico B
 * Service for Manchester Triage Protocol API integration
 */

import api from '@/lib/api';
import {
  TriageRegisterRequest,
  TriageBoardItem,
  SectorAssignRequest,
  TriageReclassifyRequest,
  TriageSuggestionRequest,
  TriageSuggestionResponse
} from '@/types/triage';

const BASE_URL = '/triage';

/**
 * Triage Service
 * Integrates with 3 backend endpoints:
 * - POST /triage/visits/{id} - Register triage
 * - GET /triage/board - Get triage board
 * - PUT /triage/visits/{id}/sector - Assign sector
 */
export const triageService = {
  /**
   * Register triage for a visit
   * POST /api/v1/triage/visits/{visitId}
   *
   * @param visitId - UUID of the visit
   * @param request - Triage data (vital signs + Manchester color)
   * @returns Updated visit
   */
  async registerTriage(visitId: string, request: TriageRegisterRequest): Promise<void> {
    try {
      await api.post(`${BASE_URL}/visits/${visitId}`, request);
    } catch (error: any) {
      // Parse backend validation errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao registrar triagem');
    }
  },

  /**
   * Get triage board (real-time patient list)
   * GET /api/v1/triage/board
   *
   * @returns List of patients in triage board ordered by priority
   */
  async getTriageBoard(): Promise<TriageBoardItem[]> {
    try {
      const response = await api.get<TriageBoardItem[]>(`${BASE_URL}/board`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao carregar painel de triagem:', error);
      throw new Error('Erro ao carregar painel de triagem');
    }
  },

  /**
   * Assign sector manually to a visit
   * PUT /api/v1/triage/visits/{visitId}/sector
   *
   * @param visitId - UUID of the visit
   * @param request - Sector assignment data
   * @returns Updated visit
   */
  async assignSector(visitId: string, request: SectorAssignRequest): Promise<void> {
    try {
      await api.put(`${BASE_URL}/visits/${visitId}/sector`, request);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao atribuir setor');
    }
  },

  /**
   * Start medical attendance for a visit (locks and sets IN_ATTENDANCE)
   * POST /api/v1/triage/visits/{visitId}/start-attendance
   */
  async startAttendance(visitId: string): Promise<void> {
    try {
      await api.post(`${BASE_URL}/visits/${visitId}/start-attendance`);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao iniciar atendimento');
    }
  },

  /**
   * Reclassify Manchester color for an already triaged visit
   * POST /api/v1/triage/visits/{visitId}/reclassify
   */
  async reclassify(visitId: string, request: TriageReclassifyRequest): Promise<void> {
    try {
      await api.post(`${BASE_URL}/visits/${visitId}/reclassify`, request);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao reclassificar triagem');
    }
  },

  /**
   * Suggest Manchester color automatically
   * POST /api/v1/triage/suggest
   */
  async suggest(request: TriageSuggestionRequest, config?: { signal?: AbortSignal }): Promise<TriageSuggestionResponse> {
    try {
      const response = await api.post<TriageSuggestionResponse>(`${BASE_URL}/suggest`, request, config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao sugerir classificação');
    }
  }
};

export default triageService;

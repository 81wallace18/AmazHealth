import api from '@/lib/api';

export type PecSubmissionStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'READY'
  | 'BLOCKED'
  | 'IN_PROGRESS'
  | 'EXPORTED'
  | 'FAILED_RETRYABLE'
  | 'FAILED'
  | 'MANUAL_REVIEW'
  | 'CANCELLED';

export interface PecSubmissionListItem {
  id: string;
  sourceType: string;
  sourceId: string;
  professionalStaffId: string;
  professionalSusAssignmentId?: string;
  patientId?: string;
  formType?: string;
  status: PecSubmissionStatus;
  reasonCode?: string;
  errorCode?: string;
  errorMessage?: string;
  externalReference?: string;
  operationalEvidence?: string;
  attemptCount?: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  exportedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PecSubmissionTimelineEvent {
  type: string;
  status?: string;
  reasonCode?: string;
  errorCode?: string;
  message?: string;
  actorId?: string;
  occurredAt?: string;
}

export interface PecSubmissionReviewEvent {
  id: string;
  action: string;
  actorUserId: string;
  actorStaffId?: string;
  pecFields?: string;
  comment?: string;
  createdAt?: string;
}

export interface PecSubmissionProfessionalSummary {
  staffId: string;
  name?: string;
  cns?: string;
  cboCode?: string;
}

export interface PecSubmissionSusAssignmentSummary {
  id: string;
  displayName?: string;
  cboCode?: string;
  cnesCode?: string;
  ineCode?: string;
  microAreaCode?: string;
  active: boolean;
}

export interface PecSubmissionCredentialSummary {
  id?: string;
  provider?: string;
  source?: string;
  externalUsername?: string;
  validityStatus?: string;
  lastValidatedAt?: string;
  credentialExpiresAt?: string;
  configured: boolean;
}

export interface PecSubmissionDetail extends PecSubmissionListItem {
  organizationId: string;
  integrationCode: string;
  lediVersion?: string;
  payload?: string;
  originalPecFields?: string;
  pecFields?: string;
  adminSuggestedPecFields?: string;
  adminSuggestionComment?: string;
  adminSuggestionBy?: string;
  adminSuggestionAt?: string;
  professionalFinalPecFields?: string;
  professionalReviewComment?: string;
  professionalReviewBy?: string;
  professionalReviewAt?: string;
  auditContext?: string;
  createdBy?: string;
  updatedBy?: string;
  timeline: PecSubmissionTimelineEvent[];
  reviewEvents: PecSubmissionReviewEvent[];
  professional?: PecSubmissionProfessionalSummary;
  susAssignment?: PecSubmissionSusAssignmentSummary;
  credential?: PecSubmissionCredentialSummary;
}

export interface PecSubmissionListResponse {
  items: PecSubmissionListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  statusCounters: Record<string, number>;
}

export interface PecSubmissionFilters {
  status?: string;
  reasonCode?: string;
  formType?: string;
  professionalStaffId?: string;
  patientId?: string;
  sourceType?: string;
  page?: number;
  size?: number;
}

export interface PecSuggestionRequest {
  pecFields: string;
  comment?: string;
}

export interface PecDecisionRequest {
  comment?: string;
}

export interface PecFinalFieldsRequest {
  pecFields: string;
  comment?: string;
}

export interface PecResponsibleRouteRequest {
  professionalStaffId: string;
  comment?: string;
}

class PecSubmissionService {
  private baseUrl = '/esus-aps/pec/submissions';

  async list(filters: PecSubmissionFilters = {}): Promise<PecSubmissionListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    const response = await api.get<PecSubmissionListResponse>(`${this.baseUrl}${query ? `?${query}` : ''}`);
    return response.data;
  }

  async get(id: string): Promise<PecSubmissionDetail> {
    const response = await api.get<PecSubmissionDetail>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createAdminSuggestion(id: string, request: PecSuggestionRequest): Promise<PecSubmissionDetail> {
    const response = await api.post<PecSubmissionDetail>(`${this.baseUrl}/${id}/suggestions`, request);
    return response.data;
  }

  async acceptSuggestion(id: string, request: PecDecisionRequest = {}): Promise<PecSubmissionDetail> {
    const response = await api.post<PecSubmissionDetail>(`${this.baseUrl}/${id}/suggestions/accept`, request);
    return response.data;
  }

  async rejectSuggestion(id: string, request: PecDecisionRequest): Promise<PecSubmissionDetail> {
    const response = await api.post<PecSubmissionDetail>(`${this.baseUrl}/${id}/suggestions/refuse`, request);
    return response.data;
  }

  async updateFinalFields(id: string, request: PecFinalFieldsRequest): Promise<PecSubmissionDetail> {
    const response = await api.put<PecSubmissionDetail>(`${this.baseUrl}/${id}/final`, request);
    return response.data;
  }

  async routeResponsible(id: string, request: PecResponsibleRouteRequest): Promise<PecSubmissionDetail> {
    const response = await api.post<PecSubmissionDetail>(`${this.baseUrl}/${id}/responsible`, request);
    return response.data;
  }

  async markReady(id: string, request: PecDecisionRequest = {}): Promise<PecSubmissionDetail> {
    const response = await api.post<PecSubmissionDetail>(`${this.baseUrl}/${id}/ready`, request);
    return response.data;
  }
}

export const pecSubmissionService = new PecSubmissionService();
export default pecSubmissionService;

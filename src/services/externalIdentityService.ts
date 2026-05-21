import api from '@/lib/api';
import {
  ExternalCredentialRotationRequest,
  ExternalCredentialRotationResult,
  ExternalCredentialStatusResponse,
  ExternalIdentityApprovalRequest,
  ExternalIdentityLink,
  ExternalIdentityLinkStatus,
  ExternalIdentityPreRegistrationRequest,
  ExternalIdentityProvider,
  ExternalIdentityReviewRequest,
  ExternalIdentityStaffMatchSuggestion,
  ExternalSyncNowRequest,
  ExternalSyncQueueSummary,
} from '@/types/externalIdentity';

const compactParams = (params: Record<string, string | number | null | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.set(key, String(value));
    }
  });
  return search.toString();
};

class ExternalIdentityService {
  private adminBaseUrl = '/admin/external-identities';
  private credentialBaseUrl = '/external-credentials';
  private syncQueueBaseUrl = '/external-sync-queue';

  async list(params: {
    provider?: ExternalIdentityProvider | null;
    status?: ExternalIdentityLinkStatus | null;
  } = {}): Promise<ExternalIdentityLink[]> {
    const query = compactParams(params);
    const response = await api.get<ExternalIdentityLink[]>(
      query ? `${this.adminBaseUrl}?${query}` : this.adminBaseUrl
    );
    return response.data;
  }

  async preRegister(data: ExternalIdentityPreRegistrationRequest): Promise<ExternalIdentityLink> {
    const response = await api.post<ExternalIdentityLink>(`${this.adminBaseUrl}/pre-register`, data);
    return response.data;
  }

  async approve(linkId: string, data: ExternalIdentityApprovalRequest): Promise<ExternalIdentityLink> {
    const response = await api.patch<ExternalIdentityLink>(`${this.adminBaseUrl}/${linkId}/approve`, data);
    return response.data;
  }

  async reject(linkId: string, data: ExternalIdentityReviewRequest): Promise<ExternalIdentityLink> {
    const response = await api.patch<ExternalIdentityLink>(`${this.adminBaseUrl}/${linkId}/reject`, data);
    return response.data;
  }

  async suspend(linkId: string, data: ExternalIdentityReviewRequest): Promise<ExternalIdentityLink> {
    const response = await api.patch<ExternalIdentityLink>(`${this.adminBaseUrl}/${linkId}/suspend`, data);
    return response.data;
  }

  async suggestStaff(params: {
    provider: ExternalIdentityProvider;
    cpf?: string | null;
    cns?: string | null;
  }): Promise<ExternalIdentityStaffMatchSuggestion[]> {
    const query = compactParams(params);
    const response = await api.get<ExternalIdentityStaffMatchSuggestion[]>(
      `${this.adminBaseUrl}/suggest-staff?${query}`
    );
    return response.data;
  }

  async credentialStatus(params: {
    provider: ExternalIdentityProvider;
    staffId?: string | null;
    externalUsername?: string | null;
  }): Promise<ExternalCredentialStatusResponse> {
    const query = compactParams(params);
    const response = await api.get<ExternalCredentialStatusResponse>(`${this.credentialBaseUrl}/status?${query}`);
    return response.data;
  }

  async rotateCredential(data: ExternalCredentialRotationRequest): Promise<ExternalCredentialRotationResult> {
    const response = await api.patch<ExternalCredentialRotationResult>(`${this.credentialBaseUrl}/rotate`, data);
    return response.data;
  }

  async syncNow(data: ExternalSyncNowRequest = {}): Promise<ExternalSyncQueueSummary> {
    const response = await api.post<ExternalSyncQueueSummary>(`${this.syncQueueBaseUrl}/sync-now`, data);
    return response.data;
  }
}

export const externalIdentityService = new ExternalIdentityService();
export default externalIdentityService;

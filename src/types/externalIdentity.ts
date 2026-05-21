export type ExternalIdentityProvider = 'HORUS_LEGACY' | 'ESUS_PEC' | 'ESUS_AF';

export type ExternalAuthenticationStatus =
  | 'AUTHENTICATED'
  | 'CONTINGENCY_AUTHENTICATED'
  | 'PENDING_APPROVAL'
  | 'PASSWORD_EXPIRED';

export type ExternalIdentityLinkStatus =
  | 'PRE_REGISTERED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'REJECTED';

export type ExternalCredentialHealthStatus =
  | 'HEALTHY'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'INVALID'
  | 'NOT_TESTED'
  | 'NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TECHNICAL_FAILURE';

export type ExternalProfessionalCredentialStatus =
  | 'NOT_TESTED'
  | 'VALID'
  | 'EXPIRED'
  | 'INVALID_PASSWORD'
  | 'EXPIRING_SOON'
  | 'PROVIDER_UNAVAILABLE'
  | 'MISSING_CONFIGURATION'
  | 'UNKNOWN_ERROR';

export type ExternalProviderAuthStatus =
  | 'AUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'PASSWORD_EXPIRED'
  | 'PROVIDER_UNAVAILABLE'
  | 'MISSING_CONFIGURATION'
  | 'TECHNICAL_FAILURE';

export interface ExternalIdentityLink {
  id: string;
  organizationId: string;
  userId?: string | null;
  staffId?: string | null;
  provider: ExternalIdentityProvider;
  externalLogin?: string | null;
  externalCpf?: string | null;
  externalCns?: string | null;
  externalReference?: string | null;
  status: ExternalIdentityLinkStatus;
  statusReason?: string | null;
}

export interface ExternalIdentityPreRegistrationRequest {
  organizationId?: string;
  userId?: string | null;
  staffId?: string | null;
  provider: ExternalIdentityProvider;
  externalLogin: string;
  externalCpf?: string | null;
  externalCns?: string | null;
  externalReference?: string | null;
}

export interface ExternalIdentityApprovalRequest {
  organizationId?: string;
  userId?: string | null;
  staffId?: string | null;
  statusReason?: string | null;
}

export interface ExternalIdentityReviewRequest {
  statusReason?: string | null;
}

export interface ExternalIdentityStaffMatchSuggestion {
  staffId: string;
  staffCode?: string | null;
  staffName: string;
  cpf?: string | null;
  cns?: string | null;
  role?: string | null;
  hasActiveSusAssignment: boolean;
  hasExternalCredential: boolean;
}

export interface ExternalCredentialStatusResponse {
  credentialId?: string | null;
  organizationId?: string | null;
  provider: ExternalIdentityProvider;
  staffId?: string | null;
  externalUsername?: string | null;
  healthStatus: ExternalCredentialHealthStatus;
  validityStatus?: ExternalProfessionalCredentialStatus | null;
  lastValidatedAt?: string | null;
  credentialExpiresAt?: string | null;
  message?: string | null;
}

export interface ExternalCredentialRotationRequest {
  provider: ExternalIdentityProvider;
  staffId?: string | null;
  externalUsername?: string | null;
  newPassword: string;
  credentialExpiresAt?: string | null;
}

export interface ExternalCredentialRotationResult extends ExternalCredentialStatusResponse {
  rotated: boolean;
  providerStatus: ExternalProviderAuthStatus;
}

export interface ExternalSyncNowRequest {
  itemId?: string | null;
  provider?: ExternalIdentityProvider | null;
  limit?: number | null;
}

export interface ExternalSyncQueueSummary {
  provider?: string | null;
  requested?: number;
  processed?: number;
  succeeded?: number;
  failed?: number;
  skipped?: number;
  [key: string]: unknown;
}

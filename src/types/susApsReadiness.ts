export type SusApsReadinessSeverity = 'BLOCKING' | 'SANITATION';

export interface SusApsReadinessIssue {
  scope: string;
  entityId: string;
  field: string;
  severity: SusApsReadinessSeverity;
  code: string;
  message: string;
}

export interface SusApsReadinessResponse {
  organizationId: string;
  ready: boolean;
  blockingCount: number;
  sanitationCount: number;
  issues: SusApsReadinessIssue[];
}

export interface SusApsOrganizationInfo {
  organizationId: string;
  organizationName: string;
  cnesCode?: string | null;
  municipalityCode?: string | null;
  municipalityName?: string | null;
  stateCode?: string | null;
}

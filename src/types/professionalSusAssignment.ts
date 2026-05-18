export interface ProfessionalSusAssignment {
  id: string;
  organizationId: string;
  staffId: string;
  staffName?: string | null;
  cnesCode: string;
  cboCode: string;
  ineCode?: string | null;
  microAreaCode?: string | null;
  displayName: string;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalSusAssignmentRequest {
  staffId: string;
  cnesCode: string;
  cboCode: string;
  ineCode?: string;
  microAreaCode?: string;
  displayName: string;
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
}

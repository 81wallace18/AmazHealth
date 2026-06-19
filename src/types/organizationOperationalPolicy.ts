export interface OrganizationOperationalPolicy {
  key: string;
  value: boolean;
}

export interface OrganizationOperationalPolicies {
  allow_private_appointment_outside_schedule: boolean;
}

export interface OrganizationOperationalPolicyRequest {
  value: boolean;
}

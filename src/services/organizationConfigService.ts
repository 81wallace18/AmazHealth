import api from '@/lib/api';
import type {
  OrganizationOperationalPolicies,
  OrganizationOperationalPolicy,
  OrganizationOperationalPolicyRequest,
} from '@/types/organizationOperationalPolicy';

class OrganizationConfigService {
  private readonly baseUrl = '/organization-operational-policies';

  async list(): Promise<OrganizationOperationalPolicies> {
    const response = await api.get<OrganizationOperationalPolicies>(this.baseUrl);
    return response.data;
  }

  async get(policyKey: string): Promise<OrganizationOperationalPolicy> {
    const response = await api.get<OrganizationOperationalPolicy>(`${this.baseUrl}/${policyKey}`);
    return response.data;
  }

  async update(policyKey: string, payload: OrganizationOperationalPolicyRequest): Promise<OrganizationOperationalPolicy> {
    const response = await api.patch<OrganizationOperationalPolicy>(
      `${this.baseUrl}/${policyKey}`,
      payload
    );
    return response.data;
  }
}

export const organizationConfigService = new OrganizationConfigService();

import { useAuth } from '../hooks/useAuth';
import { useOrgConfig } from '../hooks/useOrgConfig';
import { getCapabilitiesForRoles, UserCapabilities, hasCapability, hasAnyCapability } from './capabilities';

/**
 * Hook que resolve as capabilities efetivas do usuário, combinando:
 *
 *   1. Base estática por role (`capabilities.ts`)
 *   2. Overrides por policy operacional da organização (`operational_policies` no JSONB)
 *
 * Exemplo: NURSE_TECHNICIAN tem `canCreateTriage=false` por padrão, mas se a org dele tem
 * a policy `nursing_technician_can_triage=true`, o override aplica e ele consegue triagem.
 *
 * Componentes devem usar SEMPRE este hook para checar permissões — não importar
 * `getCapabilitiesForRoles` direto.
 */
export function useCapabilities(): UserCapabilities & {
  can: (capability: keyof UserCapabilities) => boolean;
  canAny: (capabilities: (keyof UserCapabilities)[]) => boolean;
  hasRole: (role: string) => boolean;
  loading: boolean;
} {
  const { user, loading } = useAuth();
  const { hasPolicy } = useOrgConfig();

  const userRoles = user?.roles ?? [];
  const baseCapabilities = getCapabilitiesForRoles(userRoles);

  // Org-level overrides — só aplicam se o usuário tem o role compatível.
  const isNursingTechnician = userRoles.includes('NURSE_TECHNICIAN');
  const overrides: Partial<UserCapabilities> = {};

  if (isNursingTechnician) {
    if (hasPolicy('nursing_technician_can_triage')) {
      overrides.canCreateTriage = true;
      overrides.canUpdateTriage = true;
    }
    if (hasPolicy('nursing_technician_can_dispense')) {
      overrides.canDispenseMedication = true;
    }
  }

  const capabilities: UserCapabilities = { ...baseCapabilities, ...overrides };

  return {
    ...capabilities,
    can: (capability: keyof UserCapabilities) => hasCapability(capabilities, capability),
    canAny: (capabilitiesToCheck: (keyof UserCapabilities)[]) => hasAnyCapability(capabilities, capabilitiesToCheck),
    hasRole: (role: string) => userRoles.includes(role.toUpperCase()),
    loading,
  };
}

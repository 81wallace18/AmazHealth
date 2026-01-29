import { useAuth } from '../hooks/useAuth';
import { getCapabilitiesForRoles, UserCapabilities, hasCapability, hasAnyCapability } from './capabilities';

/**
 * Hook to get user capabilities based on current role
 * Provides easy access to role-based permissions throughout the app
 */
export function useCapabilities(): UserCapabilities & {
  can: (capability: keyof UserCapabilities) => boolean;
  canAny: (capabilities: (keyof UserCapabilities)[]) => boolean;
  hasRole: (role: string) => boolean;
  loading: boolean;
} {
  const { user, loading } = useAuth();
  
  const userRoles = user?.roles ?? [];
  const capabilities = getCapabilitiesForRoles(userRoles);
  
  return {
    ...capabilities,
    can: (capability: keyof UserCapabilities) => hasCapability(capabilities, capability),
    canAny: (capabilitiesToCheck: (keyof UserCapabilities)[]) => hasAnyCapability(capabilities, capabilitiesToCheck),
    hasRole: (role: string) => userRoles.includes(role.toUpperCase()),
    loading,
  };
}

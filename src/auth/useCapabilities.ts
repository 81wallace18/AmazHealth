import { useAuth } from '../hooks/useAuth';
import { getCapabilitiesForRole, UserCapabilities, hasCapability, hasAnyCapability } from './capabilities';

/**
 * Hook to get user capabilities based on current role
 * Provides easy access to role-based permissions throughout the app
 */
export function useCapabilities(): UserCapabilities & {
  can: (capability: keyof UserCapabilities) => boolean;
  canAny: (capabilities: (keyof UserCapabilities)[]) => boolean;
  hasRole: (role: string) => boolean;
} {
  const { user } = useAuth();
  
  // Default to RECEPTIONIST if no role found
  const userRole = user?.user_metadata?.role || 'RECEPTIONIST';
  const capabilities = getCapabilitiesForRole(userRole as any);
  
  return {
    ...capabilities,
    can: (capability: keyof UserCapabilities) => hasCapability(capabilities, capability),
    canAny: (capabilitiesToCheck: (keyof UserCapabilities)[]) => hasAnyCapability(capabilities, capabilitiesToCheck),
    hasRole: (role: string) => userRole === role,
  };
}
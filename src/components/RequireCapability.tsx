import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCapabilities } from '../auth/useCapabilities';
import { UserCapabilities } from '../auth/capabilities';

interface RequireCapabilityProps {
  children: ReactNode;
  capability?: keyof UserCapabilities;
  capabilities?: (keyof UserCapabilities)[];
  roles?: string[];
  requireAllCapabilities?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Route guard component that protects routes based on user capabilities
 * If user doesn't have required capability, shows fallback or redirects
 */
export function RequireCapability({ 
  children, 
  capability, 
  capabilities, 
  roles,
  requireAllCapabilities = false,
  fallback,
  redirectTo = '/unauthorized'
}: RequireCapabilityProps) {
  const caps = useCapabilities();
  const location = useLocation();

  if (caps.loading) {
    return null;
  }

  // Check capabilities
  const hasCapabilityAccess = capability 
    ? caps.can(capability)
    : capabilities 
    ? requireAllCapabilities
      ? capabilities.every((capabilityName) => caps.can(capabilityName))
      : caps.canAny(capabilities)
    : true;

  // Check roles
  const hasRoleAccess = roles && roles.length > 0
    ? roles.some((role) => caps.hasRole(role))
    : true;

  if (!(hasCapabilityAccess && hasRoleAccess)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

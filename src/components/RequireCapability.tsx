import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCapabilities } from '../auth/useCapabilities';
import { UserCapabilities } from '../auth/capabilities';

interface RequireCapabilityProps {
  children: ReactNode;
  capability?: keyof UserCapabilities;
  capabilities?: (keyof UserCapabilities)[];
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
  fallback,
  redirectTo = '/unauthorized'
}: RequireCapabilityProps) {
  const caps = useCapabilities();
  const location = useLocation();

  // Check if user has required capability/capabilities
  const hasAccess = capability 
    ? caps.can(capability)
    : capabilities 
    ? caps.canAny(capabilities)
    : true;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
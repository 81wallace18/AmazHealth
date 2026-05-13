import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { normalizeRole } from '../auth/rolePriority';
import type { UserRole } from '../auth/capabilities';

interface RequireAccessProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  module?: string;
  integration?: string;
  policy?: string;
  redirectTo?: string;
}

export function RequireAccess({
  children,
  allowedRoles,
  module,
  integration,
  policy,
  redirectTo = '/unauthorized',
}: RequireAccessProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  const userRoles = (user?.roles ?? [])
    .map(normalizeRole)
    .filter((r): r is UserRole => r !== null);

  const hasRole = userRoles.some((role) => allowedRoles.includes(role));
  const enabledModules = user?.enabledModules;
  const integrations = user?.integrations;
  const policies = user?.operationalPolicies;
  const hasModule =
    !module ||
    !Array.isArray(enabledModules) ||
    enabledModules.length === 0 ||
    enabledModules.includes(module);
  const hasRequiredIntegration =
    !integration ||
    (Array.isArray(integrations) && integrations.includes(integration));
  const hasRequiredPolicy =
    !policy ||
    Boolean(policies && typeof policies === 'object' && (policies as Record<string, unknown>)[policy]);

  if (!hasRole || !hasModule || !hasRequiredIntegration || !hasRequiredPolicy) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

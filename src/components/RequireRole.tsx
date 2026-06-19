import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { normalizeRole } from '../auth/rolePriority';
import type { UserRole } from '../auth/capabilities';

interface RequireRoleProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Route guard that restricts access by role.
 * Uses the same allowedRoles pattern as AppSidebar so navigation
 * and route protection stay in sync.
 */
export function RequireRole({
  children,
  allowedRoles,
  redirectTo = '/unauthorized',
}: RequireRoleProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  const userRoles = (user?.roles ?? [])
    .map(normalizeRole)
    .filter((r): r is UserRole => r !== null);

  const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

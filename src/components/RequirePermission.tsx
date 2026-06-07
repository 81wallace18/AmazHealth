import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermissions, type PermissionRequest } from "@/auth/permissions";

interface RequirePermissionProps {
  children: ReactNode;
  permission: PermissionRequest;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RequirePermission({
  children,
  permission,
  fallback,
  redirectTo = "/unauthorized",
}: RequirePermissionProps) {
  const permissions = usePermissions();
  const location = useLocation();

  if (permissions.loading) {
    return null;
  }

  if (!permissions.can(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

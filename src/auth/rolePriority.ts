import type { UserRole } from "./capabilities";

export const ROLE_PRIORITY: UserRole[] = [
  "ADMIN",
  "GESTAO",
  "HOSPITAL_MANAGER",
  "FINANCE",
  "NURSE_MANAGER",
  "DOCTOR",
  "NURSE",
  "PHARMACIST",
  "RECEPTIONIST",
];

const ROLE_SET = new Set<UserRole>(ROLE_PRIORITY);

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.toUpperCase() as UserRole;
  return ROLE_SET.has(normalized) ? normalized : null;
}

export function getPrimaryRole(roles: string[] | null | undefined): UserRole | null {
  if (!roles || roles.length === 0) {
    return null;
  }

  const normalizedRoles = new Set(
    roles
      .map(normalizeRole)
      .filter((role): role is UserRole => role !== null)
  );

  return ROLE_PRIORITY.find((role) => normalizedRoles.has(role)) ?? null;
}

import { useAuth } from "@/hooks/useAuth";
import type { UserCapabilities, UserRole } from "./capabilities";
import { normalizeRole } from "./rolePriority";
import { useCapabilities } from "./useCapabilities";

export type PermissionResource = "PRONTUARIO" | "RECEPCAO" | "TRIAGEM";

export type PermissionAction =
  | "READ"
  | "READ_PRESCRIPTION"
  | "WRITE_NURSING_NOTE"
  | "WRITE_NURSING_PROCEDURE"
  | "WRITE_MEDICAL_EVOLUTION"
  | "WRITE_PRESCRIPTION"
  | "DEFINE_OUTCOME"
  | "OPEN_ATTENDANCE"
  | "REGISTER_PATIENT"
  | "READ_BOARD"
  | "START";

export interface PermissionContext {
  sector?: "URGENCIA" | "INTERNACAO" | "AMBULATORIAL" | "FARMACIA" | "LABORATORIO";
  patientRelationship?: "UNDER_CARE" | "NOT_UNDER_CARE" | "UNKNOWN";
  duty?: "ACTIVE" | "NOT_REQUIRED" | "UNKNOWN";
  mode?: "ROUTINE" | "CONTROLLED_SUPPORT";
  shareGrant?: "NONE" | "READ_GRANTED";
}

export interface PermissionRequest {
  resource: PermissionResource;
  action: PermissionAction;
  context?: PermissionContext;
}

interface PermissionEvaluationInput {
  capabilities: UserCapabilities;
  roles: UserRole[];
  request: PermissionRequest;
}

const CLINICAL_CARE_ROLES = new Set<UserRole>(["DOCTOR", "NURSE", "NURSE_TECHNICIAN"]);
const TRIAGE_BOARD_ROLES = new Set<UserRole>(["DOCTOR", "NURSE", "NURSE_MANAGER", "NURSE_TECHNICIAN"]);
const TRIAGE_START_ROLES = new Set<UserRole>(["NURSE", "NURSE_MANAGER", "NURSE_TECHNICIAN"]);
const RECEPTION_ROLES = new Set<UserRole>(["ADMIN", "RECEPTIONIST", "NURSE", "NURSE_MANAGER"]);
const ADMINISTRATIVE_ROLES = new Set<UserRole>(["ADMIN", "GESTAO", "HOSPITAL_MANAGER"]);

function hasAnyRole(roles: UserRole[], allowed: Set<UserRole>) {
  return roles.some((role) => allowed.has(role));
}

function hasRole(roles: UserRole[], role: UserRole) {
  return roles.includes(role);
}

function hasControlledShare(roles: UserRole[], context?: PermissionContext) {
  return (
    context?.mode === "CONTROLLED_SUPPORT" &&
    context.shareGrant === "READ_GRANTED" &&
    hasAnyRole(roles, ADMINISTRATIVE_ROLES)
  );
}

export function normalizeUserRoles(roles: string[] | undefined): UserRole[] {
  return (roles ?? [])
    .map(normalizeRole)
    .filter((role): role is UserRole => role !== null);
}

export function canAccessPermission({ capabilities, roles, request }: PermissionEvaluationInput): boolean {
  if (hasRole(roles, "PLATFORM_ADMIN")) {
    return true;
  }

  if (request.resource === "PRONTUARIO") {
    switch (request.action) {
      case "READ":
        return hasAnyRole(roles, CLINICAL_CARE_ROLES) || hasControlledShare(roles, request.context);
      case "READ_PRESCRIPTION":
        return capabilities.canReadPrescription && hasAnyRole(roles, CLINICAL_CARE_ROLES);
      case "WRITE_NURSING_NOTE":
        return capabilities.canRecordEvolution && hasRole(roles, "NURSE");
      case "WRITE_NURSING_PROCEDURE":
        return capabilities.canRecordEvolution && (hasRole(roles, "NURSE") || hasRole(roles, "NURSE_TECHNICIAN"));
      case "WRITE_MEDICAL_EVOLUTION":
        return capabilities.canRecordEvolution && hasRole(roles, "DOCTOR");
      case "WRITE_PRESCRIPTION":
        return capabilities.canCreatePrescription && hasRole(roles, "DOCTOR");
      case "DEFINE_OUTCOME":
        return capabilities.canDefineOutcome && hasRole(roles, "DOCTOR");
      default:
        return false;
    }
  }

  if (request.resource === "TRIAGEM") {
    switch (request.action) {
      case "READ_BOARD":
        return capabilities.canViewTriageBoard && hasAnyRole(roles, TRIAGE_BOARD_ROLES);
      case "START":
        return capabilities.canCreateTriage && hasAnyRole(roles, TRIAGE_START_ROLES);
      default:
        return false;
    }
  }

  if (request.resource === "RECEPCAO") {
    switch (request.action) {
      case "OPEN_ATTENDANCE":
        return capabilities.canCreateAttendance && hasAnyRole(roles, RECEPTION_ROLES);
      case "REGISTER_PATIENT":
        return capabilities.canCreatePatients && hasAnyRole(roles, RECEPTION_ROLES);
      default:
        return false;
    }
  }

  return false;
}

export function usePermissions() {
  const { user, loading: authLoading } = useAuth();
  const capabilities = useCapabilities();
  const roles = normalizeUserRoles(user?.roles);

  return {
    roles,
    loading: authLoading || capabilities.loading,
    can: (request: PermissionRequest) =>
      canAccessPermission({
        capabilities,
        roles,
        request,
      }),
  };
}

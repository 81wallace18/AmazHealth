// Centralized capability mapping based on role
// Aligns with docs/MATRIZ_PERMISSOES.md

export type UserRole = 
  | 'ADMIN' 
  | 'GESTAO' 
  | 'DOCTOR' 
  | 'NURSE' 
  | 'NURSE_MANAGER'
  | 'PHARMACIST' 
  | 'RECEPTIONIST' 
  | 'HOSPITAL_MANAGER'
  | 'FINANCE';

export interface UserCapabilities {
  // Patients
  canListPatients: boolean;
  canReadPatients: boolean;
  canCreatePatients: boolean;
  canUpdatePatients: boolean;
  canDeletePatients: boolean;
  
  // Staff
  canListStaff: boolean;
  canReadStaff: boolean;
  canCreateStaff: boolean;
  canUpdateStaff: boolean;
  canDeleteStaff: boolean;
  canManageRoles: boolean;
  
  // Attendance/Atendimento
  canCreateAttendance: boolean;
  canReadAttendance: boolean;
  canUpdateAttendanceStatus: boolean;
  canStartAttendance: boolean;
  canRecordEvolution: boolean;
  canDefineOutcome: boolean;
  canAdmitPatient: boolean;
  
  // Triage
  canCreateTriage: boolean;
  canUpdateTriage: boolean;
  canReadTriage: boolean;
  canViewTriageBoard: boolean;
  
  // Prescription
  canCreatePrescription: boolean;
  canReadPrescription: boolean;
  canUpdatePrescription: boolean;
  canCancelPrescription: boolean;
  canExportPrescription: boolean;
  
  // Pharmacy
  canManageStock: boolean;
  canDispenseMedication: boolean;
  canReadPharmacyGlobal: boolean;
  
  // Exams
  canRequestExams: boolean;
  canReadExamResults: boolean;
  canInputExamResults: boolean;
  
  // Financial
  canAccessFinancial: boolean;
  canManageBilling: boolean;
  
  // Management
  canViewReports: boolean;
  canViewKPIs: boolean;
  canAccessOperational: boolean;
  
  // System
  canAccessAdmin: boolean;
}

const roleCapabilities: Record<UserRole, UserCapabilities> = {
  ADMIN: {
    // Full system access
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: true,
    canUpdatePatients: true,
    canDeletePatients: true,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: true,
    canUpdateStaff: true,
    canDeleteStaff: true,
    canManageRoles: true,
    canCreateAttendance: true,
    canReadAttendance: true,
    canUpdateAttendanceStatus: true,
    canStartAttendance: true,
    canRecordEvolution: true,
    canDefineOutcome: true,
    canAdmitPatient: true,
    canCreateTriage: true,
    canUpdateTriage: true,
    canReadTriage: true,
    canViewTriageBoard: true,
    canCreatePrescription: true,
    canReadPrescription: true,
    canUpdatePrescription: true,
    canCancelPrescription: true,
    canExportPrescription: true,
    canManageStock: true,
    canDispenseMedication: true,
    canReadPharmacyGlobal: true,
    canRequestExams: true,
    canReadExamResults: true,
    canInputExamResults: true,
    canAccessFinancial: true,
    canManageBilling: true,
    canViewReports: true,
    canViewKPIs: true,
    canAccessOperational: true,
    canAccessAdmin: true,
  },
  
  GESTAO: {
    // Operational management, no financial
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: false,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: false,
    canUpdateTriage: false,
    canReadTriage: false,
    canViewTriageBoard: true,
    canCreatePrescription: false,
    canReadPrescription: false,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: false,
    canReadExamResults: false,
    canInputExamResults: false,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: true,
    canViewKPIs: true,
    canAccessOperational: true,
    canAccessAdmin: false,
  },
  
  DOCTOR: {
    // Full clinical access
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: true,
    canStartAttendance: true,
    canRecordEvolution: true,
    canDefineOutcome: true,
    canAdmitPatient: true,
    canCreateTriage: false,
    canUpdateTriage: false,
    canReadTriage: true,
    canViewTriageBoard: true,
    canCreatePrescription: true,
    canReadPrescription: true,
    canUpdatePrescription: true,
    canCancelPrescription: true,
    canExportPrescription: true,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: true,
    canReadExamResults: true,
    canInputExamResults: true,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: false,
    canViewKPIs: false,
    canAccessOperational: false,
    canAccessAdmin: false,
  },
  
  NURSE: {
    // Triage and operational access
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: true,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: true,
    canUpdateTriage: true,
    canReadTriage: true,
    canViewTriageBoard: true,
    canCreatePrescription: false,
    canReadPrescription: true,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: false,
    canReadExamResults: true,
    canInputExamResults: false,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: false,
    canViewKPIs: false,
    canAccessOperational: false,
    canAccessAdmin: false,
  },

  NURSE_MANAGER: {
    // Gestão de enfermagem com visão operacional ampliada
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: true,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: true,
    canUpdateTriage: true,
    canReadTriage: true,
    canViewTriageBoard: true,
    canCreatePrescription: false,
    canReadPrescription: true,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: false,
    canReadExamResults: true,
    canInputExamResults: false,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: true,
    canViewKPIs: true,
    canAccessOperational: true,
    canAccessAdmin: false,
  },
  
  PHARMACIST: {
    // Pharmacy management with global read access
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: false,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: false,
    canUpdateTriage: false,
    canReadTriage: false,
    canViewTriageBoard: false,
    canCreatePrescription: false,
    canReadPrescription: true,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: true,
    canDispenseMedication: true,
    canReadPharmacyGlobal: true,
    canRequestExams: false,
    canReadExamResults: false,
    canInputExamResults: false,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: false,
    canViewKPIs: false,
    canAccessOperational: false,
    canAccessAdmin: false,
  },
  
  RECEPTIONIST: {
    // Patient registration and attendance creation
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: true,
    canUpdatePatients: true,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: true,
    canReadAttendance: true,
    canUpdateAttendanceStatus: true,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: false,
    canUpdateTriage: false,
    canReadTriage: false,
    canViewTriageBoard: true,
    canCreatePrescription: false,
    canReadPrescription: false,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: false,
    canReadExamResults: false,
    canInputExamResults: false,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: false,
    canViewKPIs: false,
    canAccessOperational: false,
    canAccessAdmin: false,
  },

  HOSPITAL_MANAGER: {
    // Gestão hospitalar com visão operacional e relatórios
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: true,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: false,
    canUpdateTriage: false,
    canReadTriage: true,
    canViewTriageBoard: true,
    canCreatePrescription: false,
    canReadPrescription: false,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: false,
    canReadExamResults: false,
    canInputExamResults: false,
    canAccessFinancial: false,
    canManageBilling: false,
    canViewReports: true,
    canViewKPIs: true,
    canAccessOperational: true,
    canAccessAdmin: false,
  },
  
  FINANCE: {
    // Financial only access
    canListPatients: true,
    canReadPatients: true,
    canCreatePatients: false,
    canUpdatePatients: false,
    canDeletePatients: false,
    canListStaff: true,
    canReadStaff: true,
    canCreateStaff: false,
    canUpdateStaff: false,
    canDeleteStaff: false,
    canManageRoles: false,
    canCreateAttendance: false,
    canReadAttendance: true,
    canUpdateAttendanceStatus: false,
    canStartAttendance: false,
    canRecordEvolution: false,
    canDefineOutcome: false,
    canAdmitPatient: false,
    canCreateTriage: false,
    canUpdateTriage: false,
    canReadTriage: false,
    canViewTriageBoard: false,
    canCreatePrescription: false,
    canReadPrescription: false,
    canUpdatePrescription: false,
    canCancelPrescription: false,
    canExportPrescription: false,
    canManageStock: false,
    canDispenseMedication: false,
    canReadPharmacyGlobal: false,
    canRequestExams: false,
    canReadExamResults: false,
    canInputExamResults: false,
    canAccessFinancial: true,
    canManageBilling: true,
    canViewReports: true,
    canViewKPIs: true,
    canAccessOperational: false,
    canAccessAdmin: false,
  },
};

export function getCapabilitiesForRole(role: UserRole): UserCapabilities {
  return roleCapabilities[role] || roleCapabilities.RECEPTIONIST;
}

export function getCapabilitiesForRoles(roles: string[]): UserCapabilities {
  if (!roles || roles.length === 0) {
    return roleCapabilities.RECEPTIONIST;
  }

  const normalized = roles.map(role => role.toUpperCase().trim()).filter(Boolean);
  if (normalized.includes('ADMIN')) {
    return roleCapabilities.ADMIN;
  }

  const emptyCapabilities = Object.keys(roleCapabilities.ADMIN).reduce((acc, key) => {
    acc[key as keyof UserCapabilities] = false;
    return acc;
  }, {} as UserCapabilities);

  let hasValidRole = false;
  for (const role of normalized) {
    const capabilities = roleCapabilities[role as UserRole];
    if (!capabilities) continue;
    hasValidRole = true;
    for (const capabilityKey of Object.keys(capabilities) as (keyof UserCapabilities)[]) {
      emptyCapabilities[capabilityKey] = emptyCapabilities[capabilityKey] || capabilities[capabilityKey];
    }
  }

  return hasValidRole ? emptyCapabilities : roleCapabilities.RECEPTIONIST;
}

export function hasCapability(capabilities: UserCapabilities, capability: keyof UserCapabilities): boolean {
  return capabilities[capability];
}

export function hasAnyCapability(capabilities: UserCapabilities, capabilitiesToCheck: (keyof UserCapabilities)[]): boolean {
  return capabilitiesToCheck.some(cap => capabilities[cap]);
}

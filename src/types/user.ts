export type RoleType =
  | 'admin'
  | 'gestao'
  | 'doctor'
  | 'nurse'
  | 'nurse_manager'
  | 'pharmacist'
  | 'receptionist'
  | 'hospital_manager'
  | 'finance'
  | 'staff';

export interface OrganizationRole {
  organizationId: string;
  organizationName: string;
  role: RoleType;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  staffId?: string | null;
  organizations: OrganizationRole[];
  createdAt: string;
  lastLogin?: string | null;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: RoleType;
  staffData?: StaffCreateRequest;
}

export interface StaffCreateRequest {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  phone?: string;
  documentNumber?: string;
  documentUf?: string;
  documentType?: string;
}

export interface CreateUserResponse {
  userId: string;
  email: string;
  activationToken: string;
  activationUrl: string;
  message: string;
}

export interface ActivateAccountRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateUserRoleRequest {
  role: RoleType;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

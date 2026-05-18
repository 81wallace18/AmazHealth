import api from '@/lib/api';

/**
 * Tipos para autenticação.
 */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  registrationNumber: string;
  area?: string;
}

export interface LoginData {
  login: string;
  password: string;
  organizationId?: string; // Opcional - backend usa primeira org se não fornecido
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    organizationId: string;
    organizationName: string;
    staffId?: string | null;
    activeSectorId?: string | null;
    roles: string[];
    enabledModules?: string[] | null;
    integrations?: string[] | null;
    cnesCode?: string | null;
    municipalityCode?: string | null;
    municipalityName?: string | null;
    stateCode?: string | null;
    operationalPolicies?: Record<string, unknown> | null;
    isPlatformUser?: boolean;
    mustChangePassword?: boolean;
  };
}

export interface OrganizationInfo {
  organizationId: string;
  organizationName: string;
  cnesCode?: string | null;
  municipalityCode?: string | null;
  municipalityName?: string | null;
  stateCode?: string | null;
  roles: string[];
}

export interface MeResponse {
  userId: string;
  username: string;
  email: string;
  activeOrganizationId: string;
  activeOrganizationName: string;
  activeRoles: string[];
  staffId?: string | null;
  activeSectorId?: string | null;
  organizations: OrganizationInfo[];
  enabledModules?: string[] | null;
  integrations?: string[] | null;
  operationalPolicies?: Record<string, unknown> | null;
  isPlatformUser?: boolean;
}

export interface ActivateAccountRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Service para autenticação com o backend.
 */
export const authService = {
  /**
   * Registra novo usuário.
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Realiza login.
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Renova access token.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Realiza logout.
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Retorna o perfil autenticado.
   */
  async getProfile(): Promise<MeResponse> {
    const response = await api.get<MeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Atualiza setor ativo do usuário autenticado.
   */
  async updateActiveSector(sectorId: string): Promise<AuthResponse> {
    const response = await api.patch<AuthResponse>('/auth/me/sector', { sectorId });
    return response.data;
  },

  /**
   * Atualiza staff associado ao usuário autenticado.
   */
  async updateStaff(staffId: string): Promise<AuthResponse> {
    const response = await api.patch<AuthResponse>('/auth/me/staff', { staffId });
    return response.data;
  },

  /**
   * Ativa conta de usuário a partir de token.
   */
  async activateAccount(data: ActivateAccountRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/activate', data);
    return response.data;
  },

  /**
   * Troca a senha do usuário autenticado. Zera mustChangePassword no backend.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.patch('/auth/me/password', { currentPassword, newPassword });
  },
};

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
  organizationId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    organizationId: string;
    organizationName: string;
  };
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
  async logout(userId: string): Promise<void> {
    await api.post('/auth/logout', { userId });
  },
};

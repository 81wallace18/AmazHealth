import axios from 'axios';
import { toast } from 'sonner';
import { authStorage } from './authStorage';

/**
 * Cliente API base usando Axios.
 * Configurado para conectar ao backend Spring Boot.
 */
const resolvedBaseURL = (() => {
  const fromEnv = import.meta.env.VITE_API_URL;
  // Em builds de produção, o fallback seguro é relativo (ex.: /api/v1),
  // evitando apontar para "localhost" do usuário.
  const fallback = import.meta.env.PROD ? '/api/v1' : 'http://localhost:8080/api/v1';
  return String(fromEnv || fallback).replace(/\/+$/, '');
})();

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para adicionar token JWT em todas as requisições.
 */
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Evento customizado para notificar logout/sessão expirada
 */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

/**
 * Interceptor para tratar erros de autenticação (401).
 * Se token expirado, tenta renovar com refresh token.
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e não é retry, tenta refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = authStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${resolvedBaseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        authStorage.updateTokens({ accessToken, refreshToken: newRefreshToken });

        // Retry original request com novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, limpa tokens e dispara evento de logout
        console.warn('[API] Sessão expirada, fazendo logout automático');
        authStorage.clear();

        // Dispara evento customizado para o App reagir
        window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT, {
          detail: { reason: 'session_expired' }
        }));

        toast.error('Sessão expirada. Faça login novamente.');
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        toast.error(error.response.data?.message || 'Você não tem permissão para esta ação.');
      } else if (status >= 400 && status < 500) {
        toast.error(error.response.data?.message || 'Verifique os dados e tente novamente.');
      } else if (status >= 500) {
        toast.error('Erro interno no servidor. Tente novamente mais tarde.');
      }
    } else if (error.request) {
      toast.error('Servidor indisponível. Verifique sua conexão.');
    }

    return Promise.reject(error);
  }
);

export default api;

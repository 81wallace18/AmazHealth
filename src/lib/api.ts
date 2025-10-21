import axios from 'axios';

/**
 * Cliente API base usando Axios.
 * Configurado para conectar ao backend Spring Boot.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor para adicionar token JWT em todas as requisições.
 *
 * TODO: Ativar autenticação quando backend estiver configurado
 * Por enquanto, usando modo de desenvolvimento sem autenticação
 */
api.interceptors.request.use(
  (config) => {
    // DESENVOLVIMENTO: Token mock para teste
    // Em produção, usar token real do localStorage
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // TODO: Remover este token mock em produção
      // Token de desenvolvimento (deve ser aceito pelo backend ou desabilitar security)
      console.warn('[API] Sem token de autenticação. Backend deve permitir acesso sem auth para desenvolvimento.');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request com novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, limpa tokens e redireciona para login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

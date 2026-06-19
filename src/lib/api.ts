import axios from 'axios';
import { toast } from 'sonner';
import { authStorage } from './authStorage';

/**
 * Cliente API base usando Axios.
 * Configurado para conectar ao backend Spring Boot.
 */
const resolvedBaseURL = (() => {
  const fromEnv = import.meta.env.VITE_API_URL;
  // Usa caminho relativo por padrão para funcionar tanto em localhost
  // quanto via IP da rede quando o frontend estiver atrás do proxy do Vite/nginx.
  const fallback = '/api/v1';
  return String(fromEnv || fallback).replace(/\/+$/, '');
})();

const api = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Refresh proativo: renova o token antes de expirar.
 * Agenda renovação a cada 12 minutos (token expira em 15 min em hml/prod).
 */
let refreshTimerId: ReturnType<typeof setInterval> | null = null;

function startProactiveRefresh() {
  stopProactiveRefresh();
  refreshTimerId = setInterval(async () => {
    const token = authStorage.getAccessToken();
    if (!token) return;
    try {
      const response = await axios.post(
        `${resolvedBaseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { accessToken } = response.data;
      if (accessToken) {
        authStorage.updateTokens({ accessToken });
      }
    } catch {
      // Refresh falhou silenciosamente — o interceptor de 401 cuida como fallback
    }
  }, 12 * 60 * 1000);
}

function stopProactiveRefresh() {
  if (refreshTimerId) {
    clearInterval(refreshTimerId);
    refreshTimerId = null;
  }
}

// Inicia o refresh proativo se já houver token (ex.: reload de página)
if (authStorage.getAccessToken()) {
  startProactiveRefresh();
}

export { startProactiveRefresh, stopProactiveRefresh };

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
 * Interceptor para tratar erros de autenticação (401).
 * Se token expirado, tenta renovar com cookie HttpOnly de refresh.
 * Nunca faz logout automático — o usuário só sai quando clicar em "Sair".
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e não é retry, tenta refresh silenciosamente
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${resolvedBaseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        authStorage.updateTokens({ accessToken });

        // Reinicia timer de refresh proativo
        startProactiveRefresh();

        // Retry original request com novo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, mas NÃO faz logout automático
        stopProactiveRefresh();
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

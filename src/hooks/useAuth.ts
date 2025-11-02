import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, AuthResponse } from '@/services/authService';
import api from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  staffId?: string | null;
  activeSectorId?: string | null;
  roles: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se há usuário salvo no localStorage ao carregar
    const validateSession = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');

      if (storedUser && accessToken) {
        try {
          // Tenta validar o token fazendo uma requisição ao backend
          const response = await api.get('/auth/me');
          const parsed = JSON.parse(storedUser);
          if (!parsed.roles) {
            parsed.roles = [];
          }
          // Atualiza com dados frescos do backend
          setUser(response.data);
        } catch (error) {
          // Token inválido/expirado - limpa tudo
          console.warn('[useAuth] Token inválido ao carregar, limpando sessão');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  const signIn = async (login: string, password: string, organizationId?: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authService.login({
        login,
        password,
        organizationId,
      });

      // Salva tokens e user no localStorage
      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      toast.success('Login realizado com sucesso!');
      return { error: null };
    } catch (error: any) {
      // Mensagens específicas por tipo de erro
      let message = 'Erro ao fazer login. Tente novamente.';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          message = 'Usuário ou senha incorretos. Verifique suas credenciais.';
        } else if (status === 423) {
          message = 'Conta bloqueada temporariamente. Aguarde 15 minutos ou contate o administrador.';
        } else if (status === 404) {
          message = 'Usuário não encontrado. Verifique o email ou username.';
        } else if (status === 400) {
          message = data?.message || 'Dados inválidos. Verifique os campos.';
        } else if (status >= 500) {
          message = 'Erro no servidor. Tente novamente em alguns instantes.';
        } else if (data?.message) {
          message = data.message;
        }
      } else if (error.request) {
        message = 'Sem conexão com o servidor. Verifique sua internet.';
      }

      toast.error(message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    username: string,
    email: string,
    password: string,
    registrationNumber: string,
    fullName: string,
    area?: string
  ) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authService.register({
        username,
        email,
        password,
        registrationNumber,
        fullName,
        area,
      });

      // Salva tokens e user no localStorage
      localStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      toast.success('Cadastro realizado com sucesso! Bem-vindo(a)!');
      return { error: null };
    } catch (error: any) {
      // Mensagens específicas por tipo de erro
      let message = 'Erro ao criar conta. Tente novamente.';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 409) {
          if (data?.message?.includes('username')) {
            message = 'Username já está em uso. Escolha outro.';
          } else if (data?.message?.includes('email')) {
            message = 'Email já cadastrado. Tente fazer login ou use outro email.';
          } else if (data?.message?.includes('registration')) {
            message = 'Número de registro já cadastrado. Verifique os dados.';
          } else {
            message = 'Dados já cadastrados no sistema.';
          }
        } else if (status === 400) {
          message = data?.message || 'Dados inválidos. Verifique os campos.';
        } else if (status >= 500) {
          message = 'Erro no servidor. Tente novamente em alguns instantes.';
        } else if (data?.message) {
          message = data.message;
        }
      } else if (error.request) {
        message = 'Sem conexão com o servidor. Verifique sua internet.';
      }

      toast.error(message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.logout();

      // Limpa localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      setUser(null);
      toast.success('Logout realizado com sucesso!');

      // Redireciona para login
      navigate('/auth', { replace: true });
    } catch (error) {
      // Mesmo com erro no backend, limpa localmente e redireciona
      console.error('[useAuth] Erro ao fazer logout no backend:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/auth', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}

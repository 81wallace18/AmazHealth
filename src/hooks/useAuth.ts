import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService, AuthResponse } from '@/services/authService';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se há usuário salvo no localStorage ao carregar
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (login: string, password: string, organizationId: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authService.login({
        login,
        password,
        organizationId,
      });

      // Salva tokens e user no localStorage
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      toast.success('Login realizado com sucesso!');
      return { error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
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
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      toast.success('Cadastro realizado com sucesso!');
      return { error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao criar conta';
      toast.error(message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      if (user) {
        await authService.logout(user.id);
      }

      // Limpa localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      setUser(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  authService,
  AuthResponse,
  MeResponse,
  OrganizationInfo,
} from '@/services/authService';
import { authStorage } from '@/lib/authStorage';
import { knownUsers } from '@/lib/knownUsers';
import { startProactiveRefresh, stopProactiveRefresh } from '@/lib/api';
import dutyService from '@/services/dutyService';

interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  organizationId: string;
  organizationName: string;
  staffId?: string | null;
  activeSectorId?: string | null;
  roles: string[];
  enabledModules?: string[] | null;
  integrations?: string[] | null;
  operationalPolicies?: Record<string, unknown> | null;
  isPlatformUser?: boolean;
  organizations?: OrganizationInfo[];
  activeShift?: 'DAY' | 'NIGHT' | null;
  activeDutyId?: string | null;
  activeSectorName?: string | null;
  activeDutyStartsAt?: string | null;
}

const normalizeRoles = (roles?: string[]) =>
  (roles ?? []).filter(Boolean).map((role) => role.toUpperCase());

const mapAuthUser = (authUser: AuthResponse['user']): User => ({
  id: authUser.id,
  username: authUser.username,
  email: authUser.email,
  fullName: authUser.fullName,
  organizationId: authUser.organizationId,
  organizationName: authUser.organizationName,
  staffId: authUser.staffId ?? null,
  activeSectorId: authUser.activeSectorId ?? null,
  roles: normalizeRoles(authUser.roles),
  enabledModules: authUser.enabledModules ?? null,
  integrations: authUser.integrations ?? null,
  operationalPolicies: authUser.operationalPolicies ?? null,
  isPlatformUser: authUser.isPlatformUser ?? false,
});

const mapProfileToUser = (profile: MeResponse): User => ({
  id: profile.userId,
  username: profile.username,
  email: profile.email,
  fullName: profile.username,
  organizationId: profile.activeOrganizationId,
  organizationName: profile.activeOrganizationName,
  staffId: profile.staffId ?? null,
  activeSectorId: profile.activeSectorId ?? null,
  roles: normalizeRoles(profile.activeRoles),
  enabledModules: profile.enabledModules ?? null,
  integrations: profile.integrations ?? null,
  operationalPolicies: profile.operationalPolicies ?? null,
  isPlatformUser: profile.isPlatformUser ?? false,
  organizations: profile.organizations,
});

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = () => {
    stopProactiveRefresh();
    authStorage.clear();
    setUser(null);
  };

  const persistUser = (data: User) => {
    authStorage.setUser(data);
    setUser(data);
  };

  const syncAuthResponse = (response: AuthResponse, rememberMe?: boolean) => {
    const normalized = mapAuthUser(response.user);
    authStorage.setSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? undefined,
      user: normalized,
      rememberMe,
    });
    setUser(normalized);
    return normalized;
  };

  useEffect(() => {
    // Verifica se há usuário salvo no storage ao carregar
    const validateSession = async () => {
      const storedUserRaw = authStorage.getUser();
      const accessToken = authStorage.getAccessToken();

      if (storedUserRaw && accessToken) {
        try {
          const parsed: User = JSON.parse(storedUserRaw);
          parsed.roles = normalizeRoles(parsed.roles);
          setUser(parsed);

          const profile = await authService.getProfile();
          const normalized = mapProfileToUser(profile);

          // Enriquecer com informações de plantão ativo apenas se a policy estiver ON
          // (evita chamada que retornaria 403 em orgs sem night_shift_review).
          const nightShiftEnabled = Boolean(
            (normalized.operationalPolicies as Record<string, unknown> | null | undefined)?.[
              'night_shift_review'
            ]
          );
          if (nightShiftEnabled) {
            try {
              const duty = await dutyService.getMyCurrentDuty();
              if (duty) {
                normalized.activeShift = duty.shiftType;
                normalized.activeDutyId = duty.id;
                normalized.activeSectorName = duty.sectorName;
                normalized.activeDutyStartsAt = duty.startsAt;
              }
            } catch {
              // Duty context is optional
            }
          }

          persistUser(normalized);
        } catch (error) {
          console.warn('[useAuth] Token inválido ao carregar, limpando sessão');
          clearSession();
        }
      }
      setLoading(false);
    };

    validateSession();
  }, []);

  // Detecta limpeza de sessão feita externamente (outra aba ou devtools)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'user' || e.key === 'accessToken') && e.newValue === null) {
        clearSession();
        navigate('/auth');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);


  const signIn = async (
    login: string,
    password: string,
    organizationId?: string,
    rememberMe?: boolean
  ) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authService.login({
        login,
        password,
        organizationId,
      });

      syncAuthResponse(response, rememberMe);
      startProactiveRefresh();
      // Salva no picker do device pra próxima vez aparecer só pedindo senha
      knownUsers.upsert({
        login,
        fullName: response.user.fullName,
        organizationName: response.user.organizationName,
      });
      toast.success('Login realizado com sucesso!');
      return { error: null, message: null };
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
      return { error, message };
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

      syncAuthResponse(response);
      startProactiveRefresh();
      toast.success('Cadastro realizado com sucesso! Bem-vindo(a)!');
      return { error: null, message: null };
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
      return { error, message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (options?: { reason?: string; silent?: boolean; redirectTo?: string }) => {
    const reason = options?.reason;
    const silent = options?.silent ?? false;
    const redirectTo = options?.redirectTo ?? '/auth';

    try {
      setLoading(true);
      await authService.logout();

      clearSession();
      if (reason) {
        toast.error(reason);
      } else if (!silent) {
        toast.success('Logout realizado com sucesso!');
      }

      // Redireciona para login
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // Mesmo com erro no backend, limpa localmente e redireciona
      console.error('[useAuth] Erro ao fazer logout no backend:', error);
      clearSession();
      if (reason) {
        toast.error(reason);
      }
      navigate(redirectTo, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const changeActiveSector = async (sectorId: string) => {
    try {
      setLoading(true);
      const response = await authService.updateActiveSector(sectorId);
      syncAuthResponse(response);
      toast.success('Setor ativo atualizado.');
    } catch (error: any) {
      console.error('Erro ao atualizar setor ativo:', error);
      toast.error(error?.response?.data?.message || 'Não foi possível atualizar o setor.');
    } finally {
      setLoading(false);
    }
  };

  const linkStaff = async (staffId: string) => {
    try {
      setLoading(true);
      const response = await authService.updateStaff(staffId);
      syncAuthResponse(response);
      toast.success('Profissional vinculado ao usuário.');
    } catch (error: any) {
      console.error('Erro ao atualizar staff do usuário:', error);
      toast.error(error?.response?.data?.message || 'Não foi possível atualizar o vínculo.');
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
    changeActiveSector,
    linkStaff,
  };
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppRole = 'admin' | 'doctor' | 'nurse' | 'staff' | 'receptionist';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  created_by: string | null;
  // User profile information
  profiles?: {
    full_name: string;
    registration_number: string;
    area: string;
    status: string;
  };
}

export interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  profiles: {
    full_name: string;
    registration_number: string;
    area: string;
    status: string;
  } | null;
  user_roles: UserRole[];
}

export function useUserRoles() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [currentUserRoles, setCurrentUserRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, registration_number, area, status');

      if (profilesError) {
        throw profilesError;
      }

      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at, created_by');

      if (rolesError) {
        throw rolesError;
      }

      // Group roles by user_id
      const userRolesMap = new Map<string, UserRole[]>();
      rolesData?.forEach(roleData => {
        const userId = roleData.user_id;
        const role: UserRole = {
          id: roleData.id,
          user_id: roleData.user_id,
          role: roleData.role as AppRole,
          created_at: roleData.created_at,
          created_by: roleData.created_by
        };

        if (!userRolesMap.has(userId)) {
          userRolesMap.set(userId, []);
        }
        userRolesMap.get(userId)!.push(role);
      });

      // Create the final users array from profiles
      const transformedUsers: UserWithRoles[] = profilesData?.map(profile => ({
        id: profile.user_id,
        email: '',
        created_at: '',
        profiles: {
          full_name: profile.full_name,
          registration_number: profile.registration_number,
          area: profile.area,
          status: profile.status,
        },
        user_roles: userRolesMap.get(profile.user_id) || []
      })) || [];

      setUsers(transformedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching current user roles:', error);
        return;
      }

      setCurrentUserRoles(data?.map(r => r.role as AppRole) || []);
    } catch (error) {
      console.error('Error fetching current user roles:', error);
    }
  };

  const assignRole = async (userId: string, role: AppRole) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return { error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role,
          created_by: user.id
        });

      if (error) {
        toast.error(`Erro ao atribuir role: ${error.message}`);
        return { error };
      }

      toast.success(`Role ${role} atribuída com sucesso!`);
      await fetchUsers();
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao atribuir role');
      return { error };
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        toast.error(`Erro ao remover role: ${error.message}`);
        return { error };
      }

      toast.success(`Role ${role} removida com sucesso!`);
      await fetchUsers();
      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao remover role');
      return { error };
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return currentUserRoles.includes(role);
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRoles();
  }, []);

  return {
    users,
    currentUserRoles,
    loading,
    error,
    assignRole,
    removeRole,
    hasRole,
    isAdmin,
    canManageUsers,
    refetch: fetchUsers
  };
}
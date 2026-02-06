import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "admin" | "doctor" | "nurse" | "staff" | "receptionist";

export interface UserRoleRow {
  role: AppRole;
}

export interface UserRoleProfile {
  full_name?: string;
  registration_number?: string;
  area?: string;
}

export interface UserWithRoles {
  id: string;
  profiles?: UserRoleProfile;
  user_roles: UserRoleRow[];
}

/**
 * Hook legado (pré-refactor): mantido para não quebrar telas antigas.
 *
 * Observação:
 * - O MVP atual usa backend Spring como fonte de verdade.
 * - Este hook ainda não foi integrado ao backend (ex.: endpoints de RBAC/roles por usuário).
 * - Por enquanto ele funciona como stub (lista vazia) e bloqueia ações com mensagem clara.
 */
export function useUserRoles() {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const canManageUsers = useCallback(() => {
    return Boolean(user?.roles?.includes("ADMIN") || user?.roles?.includes("admin"));
  }, [user?.roles]);

  const refetch = useCallback(() => {
    // Stub: no-op (integração futura com backend).
    setUsers([]);
  }, []);

  const assignRole = useCallback(async (_userId: string, _role: AppRole) => {
    toast.error("Gerenciamento de roles ainda não integrado", {
      description: "Esta tela é legado e será substituída pelo módulo de usuários do backend.",
    });
  }, []);

  const removeRole = useCallback(async (_userId: string, _role: AppRole) => {
    toast.error("Gerenciamento de roles ainda não integrado", {
      description: "Esta tela é legado e será substituída pelo módulo de usuários do backend.",
    });
  }, []);

  return {
    users,
    loading,
    error,
    assignRole,
    removeRole,
    canManageUsers,
    refetch,
  };
}


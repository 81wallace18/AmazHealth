import { UserRoleManagement } from '@/components/admin/UserRoleManagement';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserManagement() {
  const { users, currentUserRoles, loading, canManageUsers } = useUserRoles();

  // Calculate statistics
  const totalUsers = users.length;
  const usersWithRoles = users.filter(u => u.user_roles.length > 0).length;
  const usersWithoutRoles = totalUsers - usersWithRoles;
  const adminUsers = users.filter(u => u.user_roles.some(r => r.role === 'admin')).length;

  if (!canManageUsers()) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar o gerenciamento de usuários. Esta página é restrita a administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie usuários e suas permissões no sistema hospitalar
        </p>
      </div>

      {/* Current User Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Suas Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {currentUserRoles.map((role) => (
              <Badge key={role} variant="default">
                {role}
              </Badge>
            ))}
            {currentUserRoles.length === 0 && (
              <Badge variant="outline">Nenhuma role atribuída</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários registrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Roles</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithRoles}</div>
            <p className="text-xs text-muted-foreground">
              Usuários com permissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Roles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{usersWithoutRoles}</div>
            <p className="text-xs text-muted-foreground">
              Usuários sem permissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários com acesso admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning about users without roles */}
      {usersWithoutRoles > 0 && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Existem {usersWithoutRoles} usuário(s) sem roles atribuídas. Eles não conseguirão acessar a maioria das funcionalidades do sistema.
          </AlertDescription>
        </Alert>
      )}

      {/* User Role Management Component */}
      <UserRoleManagement />
    </div>
  );
}
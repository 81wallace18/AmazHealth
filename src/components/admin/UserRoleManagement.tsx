import { useState } from 'react';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Shield, Trash2, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  staff: 'Funcionário',
  receptionist: 'Recepcionista'
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'destructive',
  doctor: 'default',
  nurse: 'secondary',
  staff: 'outline',
  receptionist: 'secondary'
};

export function UserRoleManagement() {
  const { users, loading, error, assignRole, removeRole, canManageUsers, refetch } = useUserRoles();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('staff');
  const [assigning, setAssigning] = useState(false);

  if (!canManageUsers()) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para gerenciar usuários. Apenas administradores podem acessar esta funcionalidade.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Carregando usuários...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Erro ao carregar usuários: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    setAssigning(true);
    await assignRole(selectedUserId, selectedRole);
    setSelectedUserId('');
    setSelectedRole('staff');
    setAssigning(false);
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    await removeRole(userId, role);
  };

  const getUsersWithoutRole = () => {
    return users.filter(user => user.user_roles.length === 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Atribuir Role a Usuário
          </CardTitle>
          <CardDescription>
            Selecione um usuário sem role e atribua uma função no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Usuário</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário sem role" />
                </SelectTrigger>
                <SelectContent>
                  {getUsersWithoutRole().map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.profiles?.full_name} - {user.profiles?.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAssignRole} 
              disabled={!selectedUserId || !selectedRole || assigning}
            >
              {assigning ? 'Atribuindo...' : 'Atribuir Role'}
            </Button>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários e Suas Roles</CardTitle>
          <CardDescription>
            Visualize e gerencie as roles atribuídas aos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.profiles?.full_name || 'Nome não disponível'}
                  </TableCell>
                  <TableCell>{user.profiles?.registration_number}</TableCell>
                  <TableCell>{user.profiles?.area}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.user_roles.length > 0 ? (
                        user.user_roles.map((userRole) => (
                          <Badge 
                            key={`${user.id}-${userRole.role}`}
                            variant={ROLE_COLORS[userRole.role as AppRole] as any}
                            className="text-xs"
                          >
                            {ROLE_LABELS[userRole.role as AppRole]}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Sem role
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.user_roles.map((userRole) => (
                        <Button
                          key={`remove-${user.id}-${userRole.role}`}
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRole(user.id, userRole.role as AppRole)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
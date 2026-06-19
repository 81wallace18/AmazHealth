import { useState } from 'react';
import { Edit, Trash2, MoreVertical, ShieldOff, ShieldCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { staffService, type Staff, type RoleType, type StaffStatus } from '@/services/staffService';
import type { User } from '@/types/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffListProps {
  staff: Staff[];
  usersByStaffId?: Map<string, User>;
  onEdit: (staff: Staff) => void;
  onDelete: () => void;
  onToggleAccess?: (staffId: string, userId: string, isActive: boolean) => void;
}

const roleLabels: Record<RoleType, string> = {
  admin: 'Administrador',
  gestao: 'Gestão',
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  nurse_manager: 'Coord. Enfermagem',
  nurse_technician: 'Técnico Enf.',
  receptionist: 'Recepcionista',
  pharmacist: 'Farmacêutico',
  hospital_manager: 'Gestor Hospitalar',
  finance: 'Financeiro',
  staff: 'Profissional',
};

const statusLabels: Record<StaffStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ON_LEAVE: 'Em Licença',
};

const roleColors: Record<RoleType, string> = {
  admin: 'bg-purple-100 text-purple-800',
  gestao: 'bg-indigo-100 text-indigo-800',
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  nurse_manager: 'bg-emerald-100 text-emerald-800',
  nurse_technician: 'bg-lime-100 text-lime-800',
  receptionist: 'bg-orange-100 text-orange-800',
  pharmacist: 'bg-pink-100 text-pink-800',
  hospital_manager: 'bg-cyan-100 text-cyan-800',
  finance: 'bg-amber-100 text-amber-800',
  staff: 'bg-slate-100 text-slate-800',
};

const statusColors: Record<StaffStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  ON_LEAVE: 'bg-orange-100 text-orange-800',
};

function AccessBadge({ user }: { user?: User }) {
  if (!user) return <Badge className="bg-gray-100 text-gray-500 font-medium">Sem acesso</Badge>;
  if (!user.isActive) return <Badge className="bg-red-100 text-red-700 font-medium">Acesso inativo</Badge>;
  if (user.mustChangePassword) return <Badge className="bg-yellow-100 text-yellow-700 font-medium">Aguardando ativação</Badge>;
  return <Badge className="bg-green-100 text-green-700 font-medium">Acesso ativo</Badge>;
}

function SusApsBadge({ member }: { member: Staff }) {
  if (member.excludeFromSusApsIntegration) {
    return <Badge className="bg-gray-100 text-gray-600 font-medium">Fora APS</Badge>;
  }
  if (member.susApsReady) {
    return <Badge className="bg-blue-100 text-blue-700 font-medium">SUS pronto</Badge>;
  }
  const issues = member.susApsReadinessIssues?.length || 0;
  return (
    <Badge className="bg-amber-100 text-amber-700 font-medium">
      {issues > 0 ? `${issues} pendência${issues > 1 ? 's' : ''}` : 'Pendente'}
    </Badge>
  );
}

export function StaffList({ staff, usersByStaffId, onEdit, onDelete, onToggleAccess }: StaffListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (member: Staff) => {
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedStaff) return;
    setIsDeleting(true);
    try {
      await staffService.delete(selectedStaff.id);
      toast.success('Profissional removido com sucesso');
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
      onDelete();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao remover profissional';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (staff.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum profissional encontrado
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Especialização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SUS APS</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => {
              const linkedUser = usersByStaffId?.get(member.id);
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-mono text-sm">{member.staffCode}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.firstName} {member.lastName}</div>
                      {member.email && (
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-medium', roleColors[member.role])}>
                      {roleLabels[member.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {member.specialization || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-medium', statusColors[member.status])}>
                      {statusLabels[member.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <SusApsBadge member={member} />
                  </TableCell>
                  <TableCell>
                    <AccessBadge user={linkedUser} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar dados
                        </DropdownMenuItem>
                        {linkedUser && onToggleAccess && (
                          <DropdownMenuItem
                            onClick={() => onToggleAccess(member.id, linkedUser.id, linkedUser.isActive)}
                          >
                            {linkedUser.isActive
                              ? <><ShieldOff className="h-4 w-4 mr-2" />Desativar acesso</>
                              : <><ShieldCheck className="h-4 w-4 mr-2" />Reativar acesso</>
                            }
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o profissional{' '}
              <strong>{selectedStaff?.firstName} {selectedStaff?.lastName}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

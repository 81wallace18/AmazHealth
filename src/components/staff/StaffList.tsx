import { useState } from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffListProps {
  staff: Staff[];
  onEdit: (staff: Staff) => void;
  onDelete: () => void;
}

const roleLabels: Record<RoleType, string> = {
  admin: 'Administrador',
  gestao: 'Gestão',
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  nurse_manager: 'Enfermeiro Gestor',
  receptionist: 'Recepcionista',
  pharmacist: 'Farmacêutico',
  hospital_manager: 'Gestor Hospitalar',
  finance: 'Financeiro',
  staff: 'Staff',
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

export function StaffList({ staff, onEdit, onDelete }: StaffListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (staff: Staff) => {
    setSelectedStaff(staff);
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
      console.error('Erro ao deletar profissional:', error);
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
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-mono text-sm">
                  {member.staffCode}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    {member.email && (
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
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
                  <div className="text-sm">
                    {member.phone || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn('font-medium', statusColors[member.status])}>
                    {statusLabels[member.status]}
                  </Badge>
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
                        Editar
                      </DropdownMenuItem>
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o profissional{' '}
              <strong>
                {selectedStaff?.firstName} {selectedStaff?.lastName}
              </strong>
              ? Esta ação não pode ser desfeita.
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

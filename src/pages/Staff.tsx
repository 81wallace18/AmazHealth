import { useState, useEffect } from 'react';
import { UserPlus, Search, Users, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StaffForm } from '@/components/staff/StaffForm';
import { StaffList } from '@/components/staff/StaffList';
import { staffService, type Staff, type RoleType, type StaffStatus } from '@/services/staffService';
import { toast } from 'sonner';

const roleLabels: Record<RoleType | 'all', string> = {
  all: 'Todas as Funções',
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  pharmacist: 'Farmacêutico',
  lab_technician: 'Técnico de Laboratório',
};

const statusLabels: Record<StaffStatus | 'all', string> = {
  all: 'Todos os Status',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ON_LEAVE: 'Em Licença',
};

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all');

  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadStaff();
  }, [currentPage, roleFilter, statusFilter]);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const response = await staffService.findAll({
        page: currentPage,
        size: pageSize,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        q: searchQuery || undefined,
      });

      setStaff(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      toast.error('Erro ao carregar lista de profissionais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0); // Reset para primeira página
    loadStaff();
  };

  const handleNewStaff = () => {
    setSelectedStaff(null);
    setShowForm(true);
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStaff(null);
  };

  const handleFormSuccess = () => {
    loadStaff();
  };

  const handleDeleteSuccess = () => {
    loadStaff();
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as RoleType | 'all');
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as StaffStatus | 'all');
    setCurrentPage(0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Equipe Clínica
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar profissionais de saúde da organização
          </p>
        </div>
        <Button onClick={handleNewStaff}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Profissional
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Busque e filtre profissionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nome, email ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Filtro por Função */}
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Status */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Profissionais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profissionais Cadastrados</CardTitle>
              <CardDescription>
                {totalElements} profissional(is) encontrado(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando profissionais...
            </div>
          ) : (
            <>
              <StaffList
                staff={staff}
                onEdit={handleEditStaff}
                onDelete={handleDeleteSuccess}
              />

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Formulário de Criação/Edição */}
      <StaffForm
        open={showForm}
        onOpenChange={handleFormClose}
        staff={selectedStaff}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

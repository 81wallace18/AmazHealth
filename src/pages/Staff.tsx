import { useState, useEffect } from 'react';
import { Search, Users, Filter } from 'lucide-react';
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
import { SusApsReadinessPanel } from '@/components/staff/SusApsReadinessPanel';
import { AddMemberWizard } from '@/components/team/AddMemberWizard';
import { authService } from '@/services/authService';
import { staffService, type Staff, type RoleType, type StaffStatus } from '@/services/staffService';
import { susApsReadinessService } from '@/services/susApsReadinessService';
import { userService } from '@/services/userService';
import type { SusApsOrganizationInfo, SusApsReadinessIssue, SusApsReadinessResponse } from '@/types/susApsReadiness';
import type { User } from '@/types/user';
import { toast } from 'sonner';

const roleLabels: Record<RoleType | 'all', string> = {
  all: 'Todas as Funções',
  admin: 'Administrador',
  gestao: 'Gestão',
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  nurse_manager: 'Coord. Enfermagem',
  receptionist: 'Recepcionista',
  pharmacist: 'Farmacêutico',
  hospital_manager: 'Gestor Hospitalar',
  finance: 'Financeiro',
  staff: 'Profissional',
};

const statusLabels: Record<StaffStatus | 'all', string> = {
  all: 'Todos os Status',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ON_LEAVE: 'Em Licença',
};

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [usersByStaffId, setUsersByStaffId] = useState<Map<string, User>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isReadinessLoading, setIsReadinessLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [organizationInfo, setOrganizationInfo] = useState<SusApsOrganizationInfo | null>(null);
  const [readinessSummary, setReadinessSummary] = useState<SusApsReadinessResponse | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StaffStatus | 'all'>('all');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadData();
  }, [currentPage, roleFilter, statusFilter]);

  useEffect(() => {
    loadReadinessPanel();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, usersRes] = await Promise.all([
        staffService.findAll({
          page: currentPage,
          size: pageSize,
          role: roleFilter !== 'all' ? roleFilter.toUpperCase() as any : undefined,
          status: statusFilter !== 'all' ? statusFilter.toUpperCase() as any : undefined,
          q: searchQuery || undefined,
        }),
        userService.findAll(0, 100),
      ]);

      setStaff(staffRes.content);
      setTotalPages(staffRes.totalPages);
      setTotalElements(staffRes.totalElements);

      const map = new Map<string, User>();
      usersRes.content.forEach((u) => {
        if (u.staffId) map.set(u.staffId, u);
      });
      setUsersByStaffId(map);
    } catch (error) {
      toast.error('Erro ao carregar equipe');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReadinessPanel = async () => {
    setIsReadinessLoading(true);
    try {
      const [profile, summary] = await Promise.all([
        authService.getProfile(),
        susApsReadinessService.getSummary(),
      ]);

      const activeOrganization = profile.organizations.find(
        (organization) => organization.organizationId === profile.activeOrganizationId,
      );

      setOrganizationInfo({
        organizationId: profile.activeOrganizationId,
        organizationName: profile.activeOrganizationName,
        cnesCode: activeOrganization?.cnesCode ?? null,
        municipalityCode: activeOrganization?.municipalityCode ?? null,
        municipalityName: activeOrganization?.municipalityName ?? null,
        stateCode: activeOrganization?.stateCode ?? null,
      });
      setReadinessSummary(summary);
    } catch (error) {
      toast.error('Não foi possível carregar o painel de saneamento SUS APS.');
    } finally {
      setIsReadinessLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadData(), loadReadinessPanel()]);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadData();
  };

  const handleEditStaff = (member: Staff) => {
    setSelectedStaff(member);
    setShowEditForm(true);
  };

  const handleToggleAccess = async (staffId: string, userId: string, isActive: boolean) => {
    try {
      await userService.updateStatus(userId, { isActive: !isActive });
      toast.success(isActive ? 'Acesso desativado.' : 'Acesso reativado.');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Não foi possível alterar o acesso.');
    }
  };

  const resolveIssueLabel = (issue: SusApsReadinessIssue) => {
    if (issue.scope === 'Organization') {
      return organizationInfo?.organizationName ?? null;
    }

    if (issue.scope === 'Staff') {
      const member = staff.find((entry) => entry.id === issue.entityId);
      if (member) {
        return `${member.firstName} ${member.lastName}`;
      }
    }

    return issue.entityId || null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Equipe
          </h1>
          <p className="text-muted-foreground mt-1">
            Profissionais de saúde e seus acessos ao sistema
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          Adicionar membro
        </Button>
      </div>

      <SusApsReadinessPanel
        summary={readinessSummary}
        organization={organizationInfo}
        isLoading={isReadinessLoading}
        onRetry={loadReadinessPanel}
        resolveEntityLabel={resolveIssueLabel}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Busque e filtre profissionais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 flex gap-2">
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

            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as RoleType | 'all'); setCurrentPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Filtrar por função" /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StaffStatus | 'all'); setCurrentPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profissionais Cadastrados</CardTitle>
          <CardDescription>{totalElements} profissional(is) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando equipe...</div>
          ) : (
            <>
              <StaffList
                staff={staff}
                usersByStaffId={usersByStaffId}
                onEdit={handleEditStaff}
                onDelete={refreshAll}
                onToggleAccess={handleToggleAccess}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage + 1} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddMemberWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSuccess={refreshAll}
      />

      <StaffForm
        open={showEditForm}
        onOpenChange={(open) => { setShowEditForm(open); if (!open) setSelectedStaff(null); }}
        staff={selectedStaff}
        onSuccess={refreshAll}
        defaultCnesCode={organizationInfo?.cnesCode}
      />
    </div>
  );
}

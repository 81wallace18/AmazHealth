import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { professionalSusAssignmentService } from '@/services/professionalSusAssignmentService';
import { susApsReadinessService } from '@/services/susApsReadinessService';
import type { Staff } from '@/services/staffService';
import type {
  ProfessionalSusAssignment,
  ProfessionalSusAssignmentRequest,
} from '@/types/professionalSusAssignment';
import type { SusApsReadinessResponse } from '@/types/susApsReadiness';
import { toast } from 'sonner';

interface ProfessionalSusAssignmentSectionProps {
  staff: Staff;
  defaultCnesCode?: string | null;
  onChange?: () => void;
}

interface AssignmentFormState {
  displayName: string;
  cnesCode: string;
  cboCode: string;
  ineCode: string;
  microAreaCode: string;
  startsAt: string;
  endsAt: string;
}

function toDatetimeLocal(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildDefaultForm(staff: Staff, defaultCnesCode?: string | null): AssignmentFormState {
  return {
    displayName: `${staff.firstName} ${staff.lastName}`.trim(),
    cnesCode: defaultCnesCode?.trim() || '',
    cboCode: staff.cboCode?.trim() || '',
    ineCode: '',
    microAreaCode: '',
    startsAt: '',
    endsAt: '',
  };
}

function scopeReadyLabel(readiness: SusApsReadinessResponse | null) {
  if (!readiness) {
    return 'Carregando prontidão';
  }
  if (readiness.ready) {
    return 'Cadastro pronto para SUS APS';
  }
  return `${readiness.blockingCount} bloqueio(s) e ${readiness.sanitationCount} ajuste(s)`;
}

export function ProfessionalSusAssignmentSection({
  staff,
  defaultCnesCode,
  onChange,
}: ProfessionalSusAssignmentSectionProps) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ProfessionalSusAssignment[]>([]);
  const [readiness, setReadiness] = useState<SusApsReadinessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentFormState>(buildDefaultForm(staff, defaultCnesCode));

  const canManageAssignments = useMemo(() => {
    const roles = new Set(user?.roles ?? []);
    return roles.has('ADMIN') || roles.has('HOSPITAL_MANAGER');
  }, [user?.roles]);

  const resetForm = () => {
    setEditingId(null);
    setForm(buildDefaultForm(staff, defaultCnesCode));
  };

  const loadSection = async () => {
    setIsLoading(true);
    try {
      const [assignmentData, readinessData] = await Promise.all([
        professionalSusAssignmentService.findByStaff(staff.id),
        susApsReadinessService.getStaffReadiness(staff.id),
      ]);
      setAssignments(assignmentData);
      setReadiness(readinessData);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Não foi possível carregar os vínculos SUS do profissional.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    resetForm();
    void loadSection();
  }, [staff.id, staff.firstName, staff.lastName, staff.cboCode, defaultCnesCode]);

  const handleFormChange = (field: keyof AssignmentFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (assignment: ProfessionalSusAssignment) => {
    setEditingId(assignment.id);
    setForm({
      displayName: assignment.displayName,
      cnesCode: assignment.cnesCode,
      cboCode: assignment.cboCode,
      ineCode: assignment.ineCode || '',
      microAreaCode: assignment.microAreaCode || '',
      startsAt: toDatetimeLocal(assignment.startsAt),
      endsAt: toDatetimeLocal(assignment.endsAt),
    });
  };

  const handleSave = async () => {
    if (!canManageAssignments) {
      toast.error('Seu perfil pode consultar prontidão, mas não pode editar vínculos SUS.');
      return;
    }

    if (!form.displayName.trim() || !form.cnesCode.trim() || !form.cboCode.trim()) {
      toast.error('Preencha nome de exibição, CNES e CBO do vínculo SUS.');
      return;
    }

    setIsSaving(true);
    const payload: ProfessionalSusAssignmentRequest = {
      staffId: staff.id,
      displayName: form.displayName.trim(),
      cnesCode: form.cnesCode.trim(),
      cboCode: form.cboCode.trim(),
      ineCode: form.ineCode.trim() || undefined,
      microAreaCode: form.microAreaCode.trim() || undefined,
      startsAt: toIsoString(form.startsAt),
      endsAt: toIsoString(form.endsAt),
      active: true,
    };

    try {
      if (editingId) {
        await professionalSusAssignmentService.update(editingId, payload);
        toast.success('Vínculo SUS atualizado com sucesso.');
      } else {
        await professionalSusAssignmentService.create(payload);
        toast.success('Vínculo SUS criado com sucesso.');
      }

      resetForm();
      await loadSection();
      onChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Não foi possível salvar o vínculo SUS.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (assignmentId: string) => {
    if (!canManageAssignments) {
      toast.error('Seu perfil pode consultar prontidão, mas não pode editar vínculos SUS.');
      return;
    }

    try {
      await professionalSusAssignmentService.deactivate(assignmentId);
      toast.success('Vínculo SUS inativado.');
      if (editingId === assignmentId) {
        resetForm();
      }
      await loadSection();
      onChange?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Não foi possível inativar o vínculo SUS.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vínculo SUS do profissional</CardTitle>
        <CardDescription>
          Lotações e identificadores usados para produção APS. A ausência de vínculo aparece como pendência, mas não bloqueia o cadastro local.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium">Prontidão do profissional</div>
              <p className="text-sm text-muted-foreground">{scopeReadyLabel(readiness)}</p>
            </div>
            <Badge variant={readiness?.ready ? 'secondary' : 'outline'}>
              {readiness?.ready ? 'Pronto' : 'Com pendências'}
            </Badge>
          </div>

          {(readiness?.issues.length ?? 0) > 0 && (
            <div className="mt-3 space-y-2">
              {readiness?.issues.map((issue) => (
                <div key={`${issue.scope}-${issue.entityId}-${issue.field}-${issue.code}`} className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">{issue.message}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {issue.scope} · {issue.field} · {issue.code}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">Vínculos cadastrados</div>
            <Button type="button" variant="outline" size="sm" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo vínculo
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando vínculos...</p>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vínculo SUS cadastrado para este profissional.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">{assignment.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        CNES {assignment.cnesCode} · CBO {assignment.cboCode}
                        {assignment.ineCode ? ` · INE ${assignment.ineCode}` : ''}
                        {assignment.microAreaCode ? ` · Microárea ${assignment.microAreaCode}` : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignment.startsAt ? `Início: ${new Date(assignment.startsAt).toLocaleString('pt-BR')}` : 'Sem início informado'}
                        {assignment.endsAt ? ` · Fim: ${new Date(assignment.endsAt).toLocaleString('pt-BR')}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={assignment.active ? 'secondary' : 'outline'}>
                        {assignment.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(assignment)}
                        disabled={!canManageAssignments}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      {assignment.active && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(assignment.id)}
                          disabled={!canManageAssignments}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Inativar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <div className="font-medium">
              {editingId ? 'Editar vínculo SUS' : 'Cadastrar vínculo SUS'}
            </div>
            <p className="text-sm text-muted-foreground">
              Perfis `ADMIN` e `HOSPITAL_MANAGER` podem salvar alterações. Perfis `GESTAO` ficam com leitura das pendências.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sus-display-name">Nome de exibição</Label>
              <Input
                id="sus-display-name"
                value={form.displayName}
                onChange={(event) => handleFormChange('displayName', event.target.value)}
                placeholder="Nome exibido na produção APS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus-cnes">CNES</Label>
              <Input
                id="sus-cnes"
                value={form.cnesCode}
                onChange={(event) => handleFormChange('cnesCode', event.target.value)}
                placeholder="CNES da unidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus-cbo">CBO do vínculo</Label>
              <Input
                id="sus-cbo"
                value={form.cboCode}
                onChange={(event) => handleFormChange('cboCode', event.target.value)}
                placeholder="2251-25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus-ine">INE</Label>
              <Input
                id="sus-ine"
                value={form.ineCode}
                onChange={(event) => handleFormChange('ineCode', event.target.value)}
                placeholder="Identificador da equipe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus-micro-area">Microárea</Label>
              <Input
                id="sus-micro-area"
                value={form.microAreaCode}
                onChange={(event) => handleFormChange('microAreaCode', event.target.value)}
                placeholder="Ex.: 01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus-starts-at">Início da vigência</Label>
              <Input
                id="sus-starts-at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => handleFormChange('startsAt', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sus-ends-at">Fim da vigência</Label>
              <Input
                id="sus-ends-at"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => handleFormChange('endsAt', event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar edição
              </Button>
            )}
            <Button type="button" onClick={handleSave} disabled={isSaving || !canManageAssignments}>
              {isSaving ? 'Salvando vínculo...' : editingId ? 'Salvar vínculo' : 'Criar vínculo'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfessionalSusAssignmentSection;

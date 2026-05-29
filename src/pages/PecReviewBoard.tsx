import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  Eye,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useCapabilities } from '@/auth/useCapabilities';
import pecSubmissionService, {
  PecSubmissionDetail,
  PecSubmissionListItem,
  PecSubmissionListResponse,
  PecSubmissionStatus,
} from '@/services/pecSubmissionService';
import staffService, { type Staff } from '@/services/staffService';

const statusOptions: Array<{ value: PecSubmissionStatus; label: string }> = [
  { value: 'PENDING_REVIEW', label: 'Aguardando revisão' },
  { value: 'READY', label: 'Pronto para envio' },
  { value: 'BLOCKED', label: 'Bloqueado' },
  { value: 'MANUAL_REVIEW', label: 'Revisão manual' },
  { value: 'FAILED_RETRYABLE', label: 'Tentará novamente' },
  { value: 'IN_PROGRESS', label: 'Em envio' },
  { value: 'EXPORTED', label: 'Enviado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const statusLabels: Record<string, string> = Object.fromEntries(statusOptions.map((item) => [item.value, item.label]));

function statusVariant(status?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'READY':
    case 'EXPORTED':
      return 'default';
    case 'BLOCKED':
    case 'MANUAL_REVIEW':
      return 'destructive';
    case 'PENDING_REVIEW':
    case 'FAILED_RETRYABLE':
      return 'secondary';
    default:
      return 'outline';
  }
}

function shortId(value?: string) {
  if (!value) return 'pendente';
  return value.slice(0, 8);
}

function formatDate(value?: string) {
  if (!value) return 'sem data';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function credentialLabel(selected?: PecSubmissionDetail | null) {
  if (!selected?.credential?.configured) return 'credencial PEC pendente';
  const source = selected.credential.source === 'PecProfessionalCredential' ? 'fallback legado' : 'credencial canônica';
  return `${selected.credential.externalUsername ?? 'usuário oculto'} · ${selected.credential.validityStatus ?? 'sem status'} · ${source}`;
}

function assignmentLabel(selected?: PecSubmissionDetail | null) {
  const assignment = selected?.susAssignment;
  if (!assignment) return `vínculo SUS ${shortId(selected?.professionalSusAssignmentId)}`;
  return [
    assignment.displayName,
    `CBO ${assignment.cboCode ?? 'pendente'}`,
    `CNES ${assignment.cnesCode ?? 'pendente'}`,
    `INE ${assignment.ineCode ?? 'pendente'}`,
  ].filter(Boolean).join(' · ');
}

function professionalLabel(selected?: PecSubmissionDetail | null) {
  const professional = selected?.professional;
  if (!professional) return `profissional ${shortId(selected?.professionalStaffId)}`;
  return [
    professional.name || shortId(professional.staffId),
    professional.cns ? `CNS ${professional.cns}` : 'CNS pendente',
    professional.cboCode ? `CBO staff ${professional.cboCode}` : null,
  ].filter(Boolean).join(' · ');
}

function prettyJson(value?: string) {
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function fieldsForAction(selected: PecSubmissionDetail, kind: ActionKind) {
  if (kind === 'suggest') {
    return prettyJson(selected.adminSuggestedPecFields ?? selected.pecFields);
  }
  return '';
}

function staffLabel(staff: Staff) {
  return [
    `${staff.firstName} ${staff.lastName}`.trim() || staff.staffCode,
    staff.role,
    staff.cboCode ? `CBO ${staff.cboCode}` : null,
  ].filter(Boolean).join(' · ');
}

type ActionKind = 'suggest' | 'route-responsible';

interface PendingAction {
  kind: ActionKind;
  title: string;
  description: string;
  requiresFields?: boolean;
  requiresComment?: boolean;
  requiresResponsible?: boolean;
}

export default function PecReviewBoard() {
  const capabilities = useCapabilities();
  const [status, setStatus] = useState<string>('PENDING_REVIEW');
  const [reasonCode, setReasonCode] = useState('');
  const [formType, setFormType] = useState('');
  const [professionalStaffId, setProfessionalStaffId] = useState('ALL');
  const [patientId, setPatientId] = useState('');
  const [response, setResponse] = useState<PecSubmissionListResponse | null>(null);
  const [selected, setSelected] = useState<PecSubmissionDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<Staff[]>([]);
  const [busy, setBusy] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionFields, setActionFields] = useState('');
  const [routeProfessionalStaffId, setRouteProfessionalStaffId] = useState('');

  const isAdminScope = useMemo(
    () => ['ADMIN', 'GESTAO', 'HOSPITAL_MANAGER'].some((role) => capabilities.hasRole(role)),
    [capabilities]
  );

  const staffById = useMemo(
    () => new Map(staffOptions.map((staff) => [staff.id, staff])),
    [staffOptions]
  );

  async function loadList() {
    setBusy(true);
    try {
      const data = await pecSubmissionService.list({
        status: status === 'ALL' ? undefined : status,
        reasonCode,
        formType,
        professionalStaffId: professionalStaffId === 'ALL' ? undefined : professionalStaffId,
        patientId,
        size: 25,
      });
      setResponse(data);
    } catch (error) {
      toast.error('Erro ao carregar submissões PEC.');
    } finally {
      setBusy(false);
    }
  }

  async function loadStaffOptions() {
    try {
      const data = await staffService.findAllActive();
      setStaffOptions(data);
    } catch (error) {
      toast.error('Não foi possível carregar a lista de profissionais. Use o UUID manual no encaminhamento.');
    }
  }

  async function loadDetail(id: string) {
    setSelectedId(id);
    setDetailBusy(true);
    try {
      const data = await pecSubmissionService.get(id);
      setSelected(data);
      setActionFields(prettyJson(data.pecFields));
    } catch (error) {
      toast.error('Erro ao carregar detalhe da submissão PEC.');
    } finally {
      setDetailBusy(false);
    }
  }

  useEffect(() => {
    loadList();
    loadStaffOptions();
  }, []);

  function openAction(action: PendingAction) {
    if (!selected) return;
    setPendingAction(action);
    setActionComment('');
    setActionFields(fieldsForAction(selected, action.kind));
    setRouteProfessionalStaffId(action.kind === 'route-responsible' ? selected.professionalStaffId ?? '' : '');
  }

  async function submitAction() {
    if (!selected || !pendingAction) return;
    if (pendingAction.requiresComment && !actionComment.trim()) {
      toast.error('Informe um comentário para concluir a ação.');
      return;
    }
    if (pendingAction.requiresFields && !actionFields.trim()) {
      toast.error('Informe os campos PEC.');
      return;
    }
    if (pendingAction.requiresResponsible && !routeProfessionalStaffId.trim()) {
      toast.error('Informe o profissional responsável.');
      return;
    }
    setBusy(true);
    try {
      let updated: PecSubmissionDetail;
      switch (pendingAction.kind) {
        case 'suggest':
          updated = await pecSubmissionService.createAdminSuggestion(selected.id, {
            pecFields: actionFields,
            comment: actionComment,
          });
          break;
        case 'route-responsible':
          await pecSubmissionService.routeResponsible(selected.id, {
            professionalStaffId: routeProfessionalStaffId.trim(),
            comment: actionComment,
          });
          updated = await pecSubmissionService.get(selected.id);
          break;
      }
      setSelected(updated);
      setPendingAction(null);
      toast.success(pendingAction.kind === 'route-responsible' ? 'Submissão encaminhada ao responsável.' : 'Submissão PEC atualizada.');
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  const items = response?.items ?? [];
  const selectedTitle = selected ? `${statusLabels[selected.status] ?? selected.status} · ${selected.formType ?? 'formulário pendente'}` : '';
  const selectedRouteStaff = routeProfessionalStaffId ? staffById.get(routeProfessionalStaffId) : undefined;

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revisão PEC</h1>
          <p className="text-muted-foreground">Fila de submissões individuais com autoria profissional e governança administrativa.</p>
        </div>
        <Button onClick={loadList} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Motivo</Label>
          <Input value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} placeholder="CNES_MISSING" />
        </div>
        <div className="space-y-2">
          <Label>Formulário</Label>
          <Input value={formType} onChange={(event) => setFormType(event.target.value)} placeholder="CDS_PROCEDIMENTOS" />
        </div>
        <div className="space-y-2">
          <Label>Profissional</Label>
          <Select
            value={professionalStaffId === 'ALL' || staffById.has(professionalStaffId) ? professionalStaffId : 'manual'}
            onValueChange={(value) => setProfessionalStaffId(value === 'manual' ? '' : value)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="manual">Informar UUID</SelectItem>
              {staffOptions.map((staff) => (
                <SelectItem key={staff.id} value={staff.id}>{staffLabel(staff)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {professionalStaffId !== 'ALL' && (
            <Input
              value={professionalStaffId}
              onChange={(event) => setProfessionalStaffId(event.target.value)}
              placeholder="UUID do profissional"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>Paciente</Label>
          <Input value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder="UUID do paciente" />
        </div>
        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={loadList} disabled={busy}>
            Filtrar
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(response?.statusCounters ?? {}).map(([counterStatus, total]) => (
          <div key={counterStatus} className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">{statusLabels[counterStatus] ?? counterStatus}</div>
            <div className="mt-1 text-2xl font-semibold">{total}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Formulário</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Atualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: PecSubmissionListItem) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant={statusVariant(item.status)}>{statusLabels[item.status] ?? item.status}</Badge></TableCell>
                  <TableCell>{item.formType ?? item.sourceType}</TableCell>
                  <TableCell>
                    <div className="min-w-36">
                      <div className="font-medium">{staffById.get(item.professionalStaffId) ? staffLabel(staffById.get(item.professionalStaffId)!) : shortId(item.professionalStaffId)}</div>
                      <div className="text-xs text-muted-foreground">{shortId(item.professionalStaffId)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{shortId(item.patientId)}</TableCell>
                  <TableCell>{item.reasonCode ?? item.errorCode ?? 'sem motivo'}</TableCell>
                  <TableCell>{formatDate(item.updatedAt ?? item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => loadDetail(item.id)}>
                      <Eye className="mr-2 h-4 w-4" /> Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!busy && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhuma submissão encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => {
        if (!open) {
          setSelectedId(null);
          setSelected(null);
        }
      }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{detailBusy ? 'Carregando submissão' : selectedTitle}</SheetTitle>
            <SheetDescription>
              {selected ? `Submissão ${shortId(selected.id)} · paciente ${shortId(selected.patientId)}` : 'Buscando dados da submissão PEC.'}
            </SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="mt-6 space-y-5">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Autoria PEC</AlertTitle>
                <AlertDescription>
                  {professionalLabel(selected)}<br />
                  {assignmentLabel(selected)}<br />
                  {credentialLabel(selected)}
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge className="mt-2" variant={statusVariant(selected.status)}>{statusLabels[selected.status] ?? selected.status}</Badge>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Tentativas</div>
                  <div className="mt-1 text-lg font-semibold">{selected.attemptCount ?? 0}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Enviado em</div>
                  <div className="mt-1 truncate font-medium">{formatDate(selected.exportedAt)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Referência PEC</div>
                  <div className="mt-1 truncate font-medium">{selected.externalReference ?? 'pendente'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Evidência operacional</div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium">{selected.operationalEvidence ?? 'pendente'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isAdminScope && (
                  <>
                    <Button variant="outline" onClick={() => openAction({
                      kind: 'route-responsible',
                      title: 'Encaminhar ao responsável',
                      description: 'O responsável clínico assumirá a revisão e a liberação da submissão PEC. Esta ação registra trilha de auditoria.',
                      requiresComment: true,
                      requiresResponsible: true,
                    })}>
                      <UserRoundCheck className="mr-2 h-4 w-4" /> Encaminhar responsável
                    </Button>
                    <Button variant="outline" onClick={() => openAction({
                      kind: 'suggest',
                      title: 'Sugerir edição administrativa',
                      description: 'A sugestão será analisada pelo profissional responsável antes de qualquer envio.',
                      requiresFields: true,
                    })}>
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Sugerir edição
                    </Button>
                  </>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Original</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.originalPecFields) || 'sem snapshot'}</pre>
                </div>
                <div className="space-y-2">
                  <Label>Campos PEC</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.pecFields) || 'sem campos'}</pre>
                </div>
                <div className="space-y-2">
                  <Label>Sugestão administrativa</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.adminSuggestedPecFields) || 'sem sugestão'}</pre>
                  {selected.adminSuggestionComment && (
                    <p className="text-sm text-muted-foreground">{selected.adminSuggestionComment}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Versão final profissional</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.professionalFinalPecFields) || 'sem versão final'}</pre>
                  {selected.professionalReviewComment && (
                    <p className="text-sm text-muted-foreground">{selected.professionalReviewComment}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Auditoria de origem</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.auditContext) || 'sem auditoria'}</pre>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Eventos de revisão</Label>
                <div className="space-y-2">
                  {(selected.reviewEvents ?? []).map((event) => (
                    <div key={event.id} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{event.action}</span>
                        <span className="text-muted-foreground">{formatDate(event.createdAt)}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        usuário {shortId(event.actorUserId)} · profissional {shortId(event.actorStaffId)}
                      </div>
                      {event.comment && <div className="mt-2">{event.comment}</div>}
                    </div>
                  ))}
                  {(selected.reviewEvents ?? []).length === 0 && (
                    <div className="rounded-md border p-3 text-sm text-muted-foreground">Sem eventos de revisão.</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Linha do tempo</Label>
                <div className="space-y-2">
                  {selected.timeline.map((event, index) => (
                    <div key={`${event.type}-${event.occurredAt}-${index}`} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{event.type}</span>
                        <span className="text-muted-foreground">{formatDate(event.occurredAt)}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {event.status ?? 'sem status'} · {event.reasonCode ?? event.errorCode ?? 'sem motivo'} · ator {shortId(event.actorId)}
                      </div>
                      {event.message && <div className="mt-2">{event.message}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{pendingAction?.title}</DialogTitle>
            <DialogDescription>{pendingAction?.description}</DialogDescription>
          </DialogHeader>
          {pendingAction && (
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>{pendingAction.requiresResponsible ? 'Encaminhamento auditável' : 'Confirmação de autoria'}</AlertTitle>
                <AlertDescription>
                  {professionalLabel(selected)}<br />
                  {assignmentLabel(selected)}<br />
                  {credentialLabel(selected)}
                </AlertDescription>
              </Alert>
              {pendingAction.requiresFields && (
                <div className="space-y-2">
                  <Label>Campos PEC</Label>
                  <Textarea rows={12} value={actionFields} onChange={(event) => setActionFields(event.target.value)} />
                </div>
              )}
              {pendingAction.requiresResponsible && (
                <div className="space-y-3 rounded-md border p-3">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select
                      value={selectedRouteStaff ? routeProfessionalStaffId : 'manual'}
                      onValueChange={(value) => setRouteProfessionalStaffId(value === 'manual' ? '' : value)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Informar UUID manualmente</SelectItem>
                        {staffOptions.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>{staffLabel(staff)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>UUID do profissional responsável</Label>
                    <Input
                      value={routeProfessionalStaffId}
                      onChange={(event) => setRouteProfessionalStaffId(event.target.value)}
                      placeholder="professionalStaffId"
                    />
                  </div>
                </div>
              )}
              {!pendingAction.requiresFields && !pendingAction.requiresResponsible && (
                <div className="space-y-2">
                  <Label>Resumo dos campos finais</Label>
                  <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                    {selected ? fieldsForAction(selected, pendingAction.kind) || 'sem campos' : 'sem campos'}
                  </pre>
                </div>
              )}
              <div className="space-y-2">
                <Label>Comentário</Label>
                <Textarea rows={3} value={actionComment} onChange={(event) => setActionComment(event.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>Cancelar</Button>
            <Button onClick={submitAction} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

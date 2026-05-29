import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  History,
  KeyRound,
  Loader2,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import pecShiftClosingService, {
  PecCredentialStatus,
  PecShift,
  PecShiftClosingBatch,
  PecShiftClosingPreview,
} from '@/services/pecShiftClosingService';
import pecSubmissionService, {
  PecSubmissionDetail,
  PecSubmissionListItem,
  PecSubmissionStatus,
} from '@/services/pecSubmissionService';

type SubmissionSection = 'pending' | 'active' | 'history';
type ResponsibleActionKind = 'accept' | 'reject' | 'final-fields' | 'mark-ready';

interface ResponsibleAction {
  kind: ResponsibleActionKind;
  title: string;
  description: string;
  requiresFields?: boolean;
  requiresComment?: boolean;
}

const professionalStatuses: PecSubmissionStatus[] = [
  'PENDING_REVIEW',
  'READY',
  'IN_PROGRESS',
  'EXPORTED',
  'BLOCKED',
  'MANUAL_REVIEW',
];

const sectionStatuses: Record<SubmissionSection, PecSubmissionStatus[]> = {
  pending: ['PENDING_REVIEW'],
  active: ['READY', 'IN_PROGRESS'],
  history: ['EXPORTED', 'BLOCKED', 'MANUAL_REVIEW'],
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusLabel(status?: string) {
  switch (status) {
    case 'VALID': return 'PEC testado';
    case 'TESTING': return 'Testando PEC';
    case 'INVALID_PASSWORD': return 'Senha recusada';
    case 'SESSION_CONFLICT': return 'Sessão em conflito';
    case 'PEC_UNAVAILABLE': return 'PEC indisponível';
    case 'MISSING_CONFIGURATION': return 'Configuração pendente';
    default: return 'Não testado';
  }
}

function exportStatusLabel(status?: string) {
  switch (status) {
    case 'DRAFT': return 'Rascunho';
    case 'PENDING_REVIEW': return 'Aguardando revisão';
    case 'READY': return 'Pronto para envio';
    case 'IN_PROGRESS': return 'Em envio';
    case 'EXPORTED': return 'Enviado ao PEC';
    case 'FAILED_RETRYABLE': return 'Tentará novamente';
    case 'FAILED': return 'Falha';
    case 'BLOCKED': return 'Bloqueado';
    case 'MANUAL_REVIEW': return 'Revisão manual';
    case 'CANCELLED': return 'Cancelado';
    default: return status || 'Sem status';
  }
}

function statusVariant(status?: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'READY':
    case 'EXPORTED':
      return 'default';
    case 'BLOCKED':
    case 'MANUAL_REVIEW':
      return 'destructive';
    case 'PENDING_REVIEW':
    case 'IN_PROGRESS':
      return 'secondary';
    default:
      return 'outline';
  }
}

function shortId(value?: string) {
  if (!value) return 'pendente';
  return value.slice(0, 8);
}

function formatDateTime(value?: string) {
  if (!value) return 'sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function prettyJson(value?: string) {
  if (!value) return '';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function finalFieldsFor(submission?: PecSubmissionDetail | null) {
  if (!submission) return '';
  return (
    submission.professionalFinalPecFields
    ?? submission.adminSuggestedPecFields
    ?? submission.pecFields
    ?? submission.originalPecFields
    ?? ''
  );
}

function fieldsForAction(submission: PecSubmissionDetail, kind: ResponsibleActionKind) {
  if (kind === 'accept') return prettyJson(submission.adminSuggestedPecFields ?? submission.pecFields);
  if (kind === 'final-fields') return prettyJson(finalFieldsFor(submission));
  return prettyJson(finalFieldsFor(submission));
}

function professionalLabel(submission?: PecSubmissionDetail | null) {
  const professional = submission?.professional;
  if (!professional) return `Profissional ${shortId(submission?.professionalStaffId)}`;
  return [
    professional.name || shortId(professional.staffId),
    professional.cns ? `CNS ${professional.cns}` : 'CNS pendente',
    professional.cboCode ? `CBO ${professional.cboCode}` : null,
  ].filter(Boolean).join(' · ');
}

function assignmentLabel(submission?: PecSubmissionDetail | null) {
  const assignment = submission?.susAssignment;
  if (!assignment) return `Vínculo SUS ${shortId(submission?.professionalSusAssignmentId)}`;
  return [
    assignment.displayName,
    `CBO ${assignment.cboCode ?? 'pendente'}`,
    `CNES ${assignment.cnesCode ?? 'pendente'}`,
    `INE ${assignment.ineCode ?? 'pendente'}`,
    assignment.microAreaCode ? `Microárea ${assignment.microAreaCode}` : null,
    assignment.active ? 'ativo' : 'inativo',
  ].filter(Boolean).join(' · ');
}

function credentialLabel(submission?: PecSubmissionDetail | null) {
  const credential = submission?.credential;
  if (!credential?.configured) return 'Credencial PEC pendente';
  const source = credential.source ?? credential.provider ?? 'origem não informada';
  return [
    credential.externalUsername ?? 'usuário oculto',
    credential.validityStatus ?? 'sem status',
    `origem ${source}`,
    credential.lastValidatedAt ? `validada ${formatDateTime(credential.lastValidatedAt)}` : null,
  ].filter(Boolean).join(' · ');
}

function sectionTitle(section: SubmissionSection) {
  switch (section) {
    case 'pending': return 'Revisão pendente';
    case 'active': return 'Prontas e processando';
    case 'history': return 'Histórico';
  }
}

function sectionEmptyLabel(section: SubmissionSection) {
  switch (section) {
    case 'pending': return 'Nenhuma submissão aguardando sua revisão.';
    case 'active': return 'Nenhuma submissão pronta ou em processamento.';
    case 'history': return 'Nenhuma submissão finalizada, bloqueada ou em revisão manual.';
  }
}

export default function PecShiftClosing() {
  const [credential, setCredential] = useState<PecCredentialStatus | null>(null);
  const [date, setDate] = useState(todayIso());
  const [shift, setShift] = useState<PecShift>('TARDE');
  const [preview, setPreview] = useState<PecShiftClosingPreview | null>(null);
  const [batch, setBatch] = useState<PecShiftClosingBatch | null>(null);
  const [busy, setBusy] = useState(false);
  const [submissions, setSubmissions] = useState<PecSubmissionListItem[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState('');
  const [activeSection, setActiveSection] = useState<SubmissionSection>('pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PecSubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [pendingAction, setPendingAction] = useState<ResponsibleAction | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionFields, setActionFields] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const canCreateBatch = useMemo(() => {
    return Boolean(preview && preview.blockingMessages.length === 0 && preview.readyCount > 0);
  }, [preview]);

  const submissionsBySection = useMemo(() => {
    return submissions.reduce<Record<SubmissionSection, PecSubmissionListItem[]>>(
      (acc, item) => {
        if (sectionStatuses.pending.includes(item.status)) acc.pending.push(item);
        if (sectionStatuses.active.includes(item.status)) acc.active.push(item);
        if (sectionStatuses.history.includes(item.status)) acc.history.push(item);
        return acc;
      },
      { pending: [], active: [], history: [] }
    );
  }, [submissions]);

  async function loadCredential() {
    try {
      const status = await pecShiftClosingService.credentialStatus();
      setCredential(status);
    } catch {
      // Interceptor mostra a mensagem.
    }
  }

  async function loadProfessionalSubmissions() {
    setSubmissionsLoading(true);
    setSubmissionsError('');
    try {
      const responses = await Promise.all(
        professionalStatuses.map((status) => pecSubmissionService.list({ status, size: 50 }))
      );
      const deduplicated = new Map<string, PecSubmissionListItem>();
      responses.forEach((response) => {
        response.items.forEach((item) => deduplicated.set(item.id, item));
      });
      const filtered = Array.from(deduplicated.values())
        .sort((a, b) => {
          const left = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
          const right = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
          return right - left;
        });
      setSubmissions(filtered);
    } catch {
      setSubmissionsError('Não foi possível carregar suas submissões PEC.');
    } finally {
      setSubmissionsLoading(false);
    }
  }

  useEffect(() => {
    loadCredential();
    loadProfessionalSubmissions();
  }, []);

  async function testCredential() {
    setBusy(true);
    try {
      const status = await pecShiftClosingService.testCredential();
      setCredential(status);
      if (status.status === 'VALID') toast.success('PEC pronto para o fechamento do turno.');
      else if (status.status === 'TESTING') toast.info('Teste enviado para o PEC. Aguarde a confirmação.');
      else toast.error(status.message || 'PEC não aceitou a credencial.');
    } finally {
      setBusy(false);
    }
  }

  async function loadPreview() {
    setBusy(true);
    setBatch(null);
    try {
      const data = await pecShiftClosingService.preview(date, shift);
      setPreview(data);
      if (data.blockingMessages.length > 0) {
        toast.warning('Prévia montada com pendências para corrigir.');
      } else {
        toast.success('Prévia pronta para envio ao PEC.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function createAndStartBatch() {
    if (!canCreateBatch) {
      toast.error('Corrija as pendências antes de enviar ao PEC.');
      return;
    }
    setBusy(true);
    try {
      const created = await pecShiftClosingService.createBatch(date, shift);
      const started = await pecShiftClosingService.startBatch(created.id);
      setBatch(started);
      toast.success('Submissões liberadas no nosso sistema.');
      await loadProfessionalSubmissions();
    } finally {
      setBusy(false);
    }
  }

  async function loadSubmissionDetail(id: string) {
    setSelectedId(id);
    setSelected(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const data = await pecSubmissionService.get(id);
      setSelected(data);
      setActionFields(prettyJson(finalFieldsFor(data)));
    } catch {
      setDetailError('Não foi possível carregar o detalhe da submissão.');
    } finally {
      setDetailLoading(false);
    }
  }

  function openResponsibleAction(action: ResponsibleAction) {
    if (!selected) return;
    setPendingAction(action);
    setActionComment('');
    setActionFields(fieldsForAction(selected, action.kind));
  }

  async function submitResponsibleAction() {
    if (!selected || !pendingAction) return;
    if (pendingAction.requiresComment && !actionComment.trim()) {
      toast.error('Informe um comentário para concluir a ação.');
      return;
    }
    if (pendingAction.requiresFields && !actionFields.trim()) {
      toast.error('Informe os campos finais do PEC.');
      return;
    }

    setActionBusy(true);
    try {
      let updated: PecSubmissionDetail;
      switch (pendingAction.kind) {
        case 'accept':
          updated = await pecSubmissionService.acceptSuggestion(selected.id, { comment: actionComment });
          break;
        case 'reject':
          updated = await pecSubmissionService.rejectSuggestion(selected.id, { comment: actionComment });
          break;
        case 'final-fields':
          updated = await pecSubmissionService.updateFinalFields(selected.id, {
            pecFields: actionFields,
            comment: actionComment,
          });
          break;
        case 'mark-ready':
          updated = await pecSubmissionService.markReady(selected.id, { comment: actionComment });
          break;
      }
      setSelected(updated);
      setPendingAction(null);
      toast.success('Submissão PEC atualizada.');
      await loadProfessionalSubmissions();
    } finally {
      setActionBusy(false);
    }
  }

  function renderSubmissionsTable(section: SubmissionSection) {
    const items = submissionsBySection[section];

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>{sectionTitle(section)}</CardTitle>
              <CardDescription>Listagem escopada para o profissional autenticado.</CardDescription>
            </div>
            <Badge variant="secondary">{items.length} submissões</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {submissionsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao carregar</AlertTitle>
              <AlertDescription>{submissionsError}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Formulário</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissionsLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Carregando suas submissões PEC...
                    </TableCell>
                  </TableRow>
                )}
                {!submissionsLoading && items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={statusVariant(item.status)}>{exportStatusLabel(item.status)}</Badge>
                    </TableCell>
                    <TableCell>{item.formType ?? item.sourceType}</TableCell>
                    <TableCell>{shortId(item.patientId)}</TableCell>
                    <TableCell>{item.reasonCode ?? item.errorCode ?? 'sem motivo'}</TableCell>
                    <TableCell>{formatDateTime(item.updatedAt ?? item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => loadSubmissionDetail(item.id)}>
                        <Eye className="mr-2 h-4 w-4" /> Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!submissionsLoading && !submissionsError && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {sectionEmptyLabel(section)}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedTitle = selected
    ? `${exportStatusLabel(selected.status)} · ${selected.formType ?? selected.sourceType}`
    : 'Submissão PEC';
  const readyAction = pendingAction?.kind === 'mark-ready';

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fechamento PEC</h1>
          <p className="text-muted-foreground">Confirmação assíncrona de submissões CDS Procedimentos no PEC.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadProfessionalSubmissions} disabled={submissionsLoading}>
            {submissionsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar fila
          </Button>
          <Button onClick={loadPreview} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Montar prévia
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Conexão PEC</CardTitle>
            <CardDescription>Configure sua senha na tela pessoal. Aqui aparece apenas se o PEC está pronto para o turno.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{credential?.username || 'Credencial ainda não configurada'}</div>
                  <p className="text-sm text-muted-foreground">{credential?.message || 'Cadastre sua conexão PEC antes de liberar submissões.'}</p>
                </div>
                <Badge variant={credential?.status === 'VALID' ? 'default' : 'secondary'}>{statusLabel(credential?.status)}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/minha-conexao-pec">Abrir minha conexão PEC</Link>
              </Button>
              <Button onClick={testCredential} disabled={busy || !credential?.configured || credential?.status === 'TESTING'}>
                <ShieldCheck className="mr-2 h-4 w-4" /> Testar PEC
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do turno</CardTitle>
            <CardDescription>O sistema usa esses dados para montar a tela CDS &gt; Procedimentos no PEC.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data do atendimento</Label>
              <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={shift} onValueChange={(value) => setShift(value as PecShift)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANHA">Manhã</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOITE">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Minhas submissões PEC</CardTitle>
              <CardDescription>Revise pendências, acompanhe envios e confirme a versão final assinada por você.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{submissionsBySection.pending.length} em revisão</Badge>
              <Badge variant="outline">{submissionsBySection.active.length} prontas/processando</Badge>
              <Badge variant="outline">{submissionsBySection.history.length} no histórico</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as SubmissionSection)}>
            <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="pending">
                <ClipboardCheck className="mr-2 h-4 w-4" /> Revisão pendente
              </TabsTrigger>
              <TabsTrigger value="active">
                <Send className="mr-2 h-4 w-4" /> Prontas/processando
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" /> Histórico
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">{renderSubmissionsTable('pending')}</TabsContent>
            <TabsContent value="active">{renderSubmissionsTable('active')}</TabsContent>
            <TabsContent value="history">{renderSubmissionsTable('history')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Prévia das submissões</CardTitle>
                <CardDescription>
                  {preview.professionalName} · CBO {preview.cbo || 'pendente'} · CNES {preview.cnes || 'pendente'} · INE {preview.ine || 'pendente'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-emerald-600">{preview.readyCount} prontos</Badge>
                <Badge variant={preview.blockedCount > 0 ? 'destructive' : 'secondary'}>{preview.blockedCount} pendências</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview.blockingMessages.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <div className="mb-2 flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" /> Corrigir antes de enviar</div>
                <ul className="list-disc space-y-1 pl-5">
                  {preview.blockingMessages.map((message) => <li key={message}>{message}</li>)}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Tudo pronto para liberar as submissões ao PEC.</div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF/CNS</TableHead>
                  <TableHead>Procedimentos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.items.map((item) => (
                  <TableRow key={item.visitId}>
                    <TableCell className="font-medium">{item.patientName}</TableCell>
                    <TableCell>{item.cpf || item.cns || 'Pendente'}</TableCell>
                    <TableCell>{item.procedures.length > 0 ? item.procedures.join(', ') : 'Sem mapeamento'}</TableCell>
                    <TableCell>
                      {item.ready ? <Badge className="bg-emerald-600">Pronto</Badge> : <Badge variant="destructive">Corrigir</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end">
              <Button onClick={createAndStartBatch} disabled={busy || !canCreateBatch}>
                <Play className="mr-2 h-4 w-4" /> Confirmar submissões
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {batch && (
        <Card>
          <CardHeader>
            <CardTitle>Status do envio</CardTitle>
            <CardDescription>{batch.userMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {batch.messages.map((message) => <p key={message}>{message}</p>)}
            <Badge variant="secondary">{exportStatusLabel(batch.status)}</Badge>
          </CardContent>
        </Card>
      )}

      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => {
        if (!open) {
          setSelectedId(null);
          setSelected(null);
          setDetailError('');
        }
      }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-4xl">
          <SheetHeader>
            <SheetTitle>{detailLoading ? 'Carregando submissão' : selectedTitle}</SheetTitle>
            <SheetDescription>
              {selected ? `Submissão ${shortId(selected.id)} · paciente ${shortId(selected.patientId)}` : 'Buscando dados da submissão PEC.'}
            </SheetDescription>
          </SheetHeader>

          {detailLoading && (
            <div className="mt-6 rounded-md border p-6 text-center text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Carregando detalhe da submissão...
            </div>
          )}

          {detailError && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro no detalhe</AlertTitle>
              <AlertDescription>{detailError}</AlertDescription>
            </Alert>
          )}

          {selected && (
            <div className="mt-6 space-y-5">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Profissional responsável</AlertTitle>
                <AlertDescription>
                  {professionalLabel(selected)}<br />
                  {assignmentLabel(selected)}<br />
                  {credentialLabel(selected)}
                </AlertDescription>
              </Alert>

              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge className="mt-2" variant={statusVariant(selected.status)}>{exportStatusLabel(selected.status)}</Badge>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Tentativas</div>
                  <div className="mt-1 text-lg font-semibold">{selected.attemptCount ?? 0}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Enviado em</div>
                  <div className="mt-1 truncate font-medium">{formatDateTime(selected.exportedAt)}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Referência PEC</div>
                  <div className="mt-1 truncate font-medium">{selected.externalReference ?? 'pendente'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Evidência operacional</div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium">{selected.operationalEvidence ?? 'pendente'}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Origem</div>
                  <div className="mt-1 truncate font-medium">{selected.sourceType}</div>
                </div>
              </div>

              {selected.status === 'PENDING_REVIEW' && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!selected.adminSuggestedPecFields} onClick={() => openResponsibleAction({
                    kind: 'accept',
                    title: 'Aceitar sugestão administrativa',
                    description: 'Você assumirá os campos sugeridos como versão final profissional.',
                  })}>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Aceitar sugestão
                  </Button>
                  <Button variant="outline" disabled={!selected.adminSuggestedPecFields} onClick={() => openResponsibleAction({
                    kind: 'reject',
                    title: 'Recusar sugestão administrativa',
                    description: 'A recusa exige comentário clínico/operacional para manter a trilha de auditoria.',
                    requiresComment: true,
                  })}>
                    <AlertTriangle className="mr-2 h-4 w-4" /> Recusar
                  </Button>
                  <Button variant="outline" onClick={() => openResponsibleAction({
                    kind: 'final-fields',
                    title: 'Ajustar versão final',
                    description: 'Revise os campos que serão assinados por você antes do envio ao PEC.',
                    requiresFields: true,
                  })}>
                    <UserCheck className="mr-2 h-4 w-4" /> Ajustar final
                  </Button>
                  <Button onClick={() => openResponsibleAction({
                    kind: 'mark-ready',
                    title: 'Marcar pronto para envio',
                    description: 'Confirme autoria, vínculo SUS, credencial e campos finais antes de liberar para o worker.',
                  })}>
                    <Send className="mr-2 h-4 w-4" /> Marcar READY
                  </Button>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>Original</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.originalPecFields) || 'sem snapshot'}</pre>
                </div>
                <div className="space-y-2">
                  <Label>Campos atuais</Label>
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
                <div className="space-y-2 lg:col-span-2">
                  <Label>Auditoria de origem</Label>
                  <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">{prettyJson(selected.auditContext) || 'sem auditoria'}</pre>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <Label>Eventos de revisão</Label>
                  <div className="space-y-2">
                    {(selected.reviewEvents ?? []).map((event) => (
                      <div key={event.id} className="rounded-md border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{event.action}</span>
                          <span className="text-muted-foreground">{formatDateTime(event.createdAt)}</span>
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
                    {(selected.timeline ?? []).map((event, index) => (
                      <div key={`${event.type}-${event.occurredAt}-${index}`} className="rounded-md border p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{event.type}</span>
                          <span className="text-muted-foreground">{formatDateTime(event.occurredAt)}</span>
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {event.status ?? 'sem status'} · {event.reasonCode ?? event.errorCode ?? 'sem motivo'} · ator {shortId(event.actorId)}
                        </div>
                        {event.message && <div className="mt-2">{event.message}</div>}
                      </div>
                    ))}
                    {(selected.timeline ?? []).length === 0 && (
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">Sem eventos de linha do tempo.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{pendingAction?.title}</DialogTitle>
            <DialogDescription>{pendingAction?.description}</DialogDescription>
          </DialogHeader>
          {pendingAction && (
            <div className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>{readyAction ? 'Confirmação READY' : 'Confirmação de autoria'}</AlertTitle>
                <AlertDescription>
                  {professionalLabel(selected)}<br />
                  {assignmentLabel(selected)}<br />
                  {credentialLabel(selected)}
                </AlertDescription>
              </Alert>

              {readyAction && selected && (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">Assinante</div>
                    <div className="mt-1 font-medium">{selected.professional?.name ?? shortId(selected.professionalStaffId)}</div>
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">CBO / CNES / INE</div>
                    <div className="mt-1 font-medium">
                      {selected.susAssignment?.cboCode ?? 'CBO pendente'} · {selected.susAssignment?.cnesCode ?? 'CNES pendente'} · {selected.susAssignment?.ineCode ?? 'INE pendente'}
                    </div>
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <div className="text-xs text-muted-foreground">Credencial</div>
                    <div className="mt-1 font-medium">
                      {selected.credential?.source ?? selected.credential?.provider ?? 'origem pendente'} · {selected.credential?.validityStatus ?? 'status pendente'}
                    </div>
                  </div>
                </div>
              )}

              {pendingAction.requiresFields ? (
                <div className="space-y-2">
                  <Label>Campos finais PEC</Label>
                  <Textarea rows={12} value={actionFields} onChange={(event) => setActionFields(event.target.value)} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{readyAction ? 'Campos finais que serão enviados' : 'Resumo dos campos finais'}</Label>
                  <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                    {selected ? fieldsForAction(selected, pendingAction.kind) || 'sem campos' : 'sem campos'}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <Label>Comentário{pendingAction.requiresComment ? ' obrigatório' : ''}</Label>
                <Textarea rows={3} value={actionComment} onChange={(event) => setActionComment(event.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>Cancelar</Button>
            <Button onClick={submitResponsibleAction} disabled={actionBusy}>
              {actionBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

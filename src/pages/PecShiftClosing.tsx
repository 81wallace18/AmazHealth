import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import pecShiftClosingService, {
  PecCredentialStatus,
  PecShift,
  PecShiftClosingBatch,
  PecShiftClosingPreview,
} from '@/services/pecShiftClosingService';

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

export default function PecShiftClosing() {
  const [credential, setCredential] = useState<PecCredentialStatus | null>(null);
  const [date, setDate] = useState(todayIso());
  const [shift, setShift] = useState<PecShift>('TARDE');
  const [preview, setPreview] = useState<PecShiftClosingPreview | null>(null);
  const [batch, setBatch] = useState<PecShiftClosingBatch | null>(null);
  const [busy, setBusy] = useState(false);

  const canCreateBatch = useMemo(() => {
    return Boolean(preview && preview.blockingMessages.length === 0 && preview.readyCount > 0);
  }, [preview]);

  async function loadCredential() {
    try {
      const status = await pecShiftClosingService.credentialStatus();
      setCredential(status);
    } catch {
      // Interceptor mostra a mensagem.
    }
  }

  useEffect(() => {
    loadCredential();
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
      toast.success('Lote liberado no nosso sistema.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fechamento PEC</h1>
          <p className="text-muted-foreground">Envio em lote de CDS Procedimentos no fim do turno.</p>
        </div>
        <Button onClick={loadPreview} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Montar prévia
        </Button>
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
                  <p className="text-sm text-muted-foreground">{credential?.message || 'Cadastre sua conexão PEC antes de enviar o lote.'}</p>
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

      {preview && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Prévia do lote</CardTitle>
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
                <div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Tudo pronto para enviar em lote ao PEC.</div>
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
                <Play className="mr-2 h-4 w-4" /> Confirmar e enviar lote
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
            <Badge variant="secondary">{batch.status}</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

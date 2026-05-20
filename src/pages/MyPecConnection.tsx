import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, KeyRound, Loader2, LockKeyhole, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import pecShiftClosingService, { PecCredentialStatus } from '@/services/pecShiftClosingService';

function statusCopy(status?: string) {
  switch (status) {
    case 'VALID':
      return {
        title: 'Conexão pronta',
        badge: 'Conectado ao PEC',
        description: 'Conseguimos entrar no PEC com sua credencial.',
        tone: 'success',
        icon: ShieldCheck,
      };
    case 'TESTING':
      return {
        title: 'Testando no PEC',
        badge: 'Teste em andamento',
        description: 'Estamos tentando entrar no PEC. Isso pode levar alguns instantes.',
        tone: 'info',
        icon: Clock3,
      };
    case 'INVALID_PASSWORD':
      return {
        title: 'Senha recusada',
        badge: 'Atualizar senha',
        description: 'O PEC recusou sua senha. Digite a senha atual e teste de novo.',
        tone: 'danger',
        icon: ShieldAlert,
      };
    case 'PEC_UNAVAILABLE':
      return {
        title: 'PEC indisponível',
        badge: 'Tente novamente',
        description: 'O PEC não respondeu agora. A senha pode estar correta, mas o sistema externo não confirmou.',
        tone: 'warning',
        icon: ShieldAlert,
      };
    case 'SESSION_CONFLICT':
      return {
        title: 'Sessão em conflito',
        badge: 'Fechar outra sessão',
        description: 'O PEC indicou sessão aberta em outro lugar. Feche a sessão anterior e tente novamente.',
        tone: 'warning',
        icon: ShieldAlert,
      };
    case 'MISSING_CONFIGURATION':
      return {
        title: 'Configuração pendente',
        badge: 'Chamar gestão',
        description: 'A URL do PEC ainda não está configurada para esta unidade.',
        tone: 'warning',
        icon: ShieldAlert,
      };
    default:
      return {
        title: 'Conexão não testada',
        badge: 'Não testado',
        description: 'Informe sua credencial do PEC e faça o teste antes do fechamento do turno.',
        tone: 'neutral',
        icon: KeyRound,
      };
  }
}

function formatDate(value?: string) {
  if (!value) return 'Ainda sem teste';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function MyPecConnection() {
  const [credential, setCredential] = useState<PecCredentialStatus | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const copy = useMemo(() => statusCopy(credential?.status), [credential?.status]);
  const Icon = copy.icon;
  const isTesting = credential?.status === 'TESTING';
  const canSubmit = username.trim().length > 0 && password.trim().length > 0 && !busy;

  async function loadStatus(silent = false) {
    if (!silent) setBusy(true);
    try {
      const status = await pecShiftClosingService.credentialStatus();
      setCredential(status);
      if (status.username) setUsername(status.username);
    } finally {
      if (!silent) setBusy(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (!isTesting) return;
    const timer = window.setInterval(() => loadStatus(true), 3000);
    return () => window.clearInterval(timer);
  }, [isTesting]);

  async function saveAndTest() {
    if (!canSubmit) {
      toast.error('Informe CPF/login e senha do PEC.');
      return;
    }
    setBusy(true);
    try {
      await pecShiftClosingService.saveCredential(username, password);
      setPassword('');
      const status = await pecShiftClosingService.testCredential();
      setCredential(status);
      toast.success('Teste enviado para o PEC.');
    } finally {
      setBusy(false);
    }
  }

  async function retest() {
    setBusy(true);
    try {
      const status = await pecShiftClosingService.testCredential();
      setCredential(status);
      toast.success('Novo teste enviado para o PEC.');
    } finally {
      setBusy(false);
    }
  }

  const toneClasses = (() => {
    switch (copy.tone) {
      case 'success': return 'border-emerald-200 bg-emerald-50 text-emerald-950';
      case 'info': return 'border-sky-200 bg-sky-50 text-sky-950';
      case 'warning': return 'border-amber-200 bg-amber-50 text-amber-950';
      case 'danger': return 'border-red-200 bg-red-50 text-red-950';
      default: return 'border-muted bg-muted/40 text-foreground';
    }
  })();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[radial-gradient(circle_at_top_left,hsl(var(--secondary))_0,transparent_34%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">Minha conexão PEC</Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">Sua chave segura para o PEC</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Cadastre uma vez. No fim do turno, o sistema usa essa conexão para preencher CDS &gt; Procedimentos sem expor sua senha.
              </p>
            </div>
          </div>
          <Card className={`border ${toneClasses}`}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-full bg-white/70 p-2 shadow-soft">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-semibold">{copy.title}</div>
                <p className="text-sm opacity-85">{credential?.message || copy.description}</p>
                <p className="text-xs opacity-70">Último teste: {formatDate(credential?.lastTestedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5" /> Credencial do PEC</CardTitle>
              <CardDescription>Use o mesmo CPF/login e senha que você usa para entrar no PEC.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pec-username">CPF/login PEC</Label>
                <Input id="pec-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="CPF ou usuário do PEC" autoComplete="username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pec-password">Senha PEC</Label>
                <Input id="pec-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={credential?.configured ? 'Digite para trocar a senha salva' : 'Digite sua senha do PEC'} autoComplete="current-password" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={saveAndTest} disabled={!canSubmit}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Salvar e testar no PEC
                </Button>
                <Button variant="outline" onClick={retest} disabled={busy || !credential?.configured || isTesting}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Testar novamente
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>O que acontece depois?</CardTitle>
              <CardDescription>Fluxo desenhado para quem está no plantão, sem linguagem de TI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['1', 'Você salva a senha', 'A senha fica protegida no sistema. Ela não aparece em relatórios, logs ou tela de fechamento.'],
                ['2', 'Nós testamos no PEC', 'O worker abre o PEC real e confirma se a entrada funcionou.'],
                ['3', 'No fim do turno, você confere', 'A tela de fechamento mostra pacientes prontos, pendências e o botão de envio.'],
              ].map(([step, title, text]) => (
                <div key={step} className="flex gap-3 rounded-xl border bg-card p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{step}</div>
                  <div>
                    <div className="font-medium">{title}</div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                <div className="mb-1 flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4" /> Fechamento fica mais simples</div>
                Quando a conexão estiver pronta, vá direto para o fechamento e confira o lote do turno.
              </div>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/pec-shift-closing">Ir para fechamento PEC</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

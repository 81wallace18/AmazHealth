import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Clock3, KeyRound, Loader2, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import externalIdentityService from '@/services/externalIdentityService';
import pecShiftClosingService, { PecCredentialStatus } from '@/services/pecShiftClosingService';
import {
  ExternalCredentialStatusResponse,
  ExternalIdentityProvider,
} from '@/types/externalIdentity';

const providerOptions: Array<{ value: ExternalIdentityProvider; label: string; shortLabel: string }> = [
  { value: 'ESUS_PEC', label: 'e-SUS PEC', shortLabel: 'PEC' },
  { value: 'HORUS_LEGACY', label: 'Hórus legado', shortLabel: 'Hórus' },
  { value: 'ESUS_AF', label: 'e-SUS AF', shortLabel: 'AF' },
];

function providerLabel(provider: ExternalIdentityProvider) {
  return providerOptions.find((option) => option.value === provider)?.label ?? provider;
}

function statusCopy(status?: string) {
  switch (status) {
    case 'HEALTHY':
    case 'VALID':
      return {
        title: 'Credencial validada',
        badge: 'Válida',
        description: 'A senha registrada foi validada no provedor externo.',
        tone: 'success',
        icon: ShieldCheck,
      };
    case 'EXPIRING_SOON':
      return {
        title: 'Credencial próxima do vencimento',
        badge: 'Atenção',
        description: 'Rotacione a senha antes do vencimento operacional.',
        tone: 'warning',
        icon: Clock3,
      };
    case 'EXPIRED':
      return {
        title: 'Credencial expirada',
        badge: 'Expirada',
        description: 'Renove a senha no provedor externo e rotacione aqui.',
        tone: 'danger',
        icon: ShieldAlert,
      };
    case 'INVALID':
    case 'INVALID_PASSWORD':
      return {
        title: 'Senha recusada',
        badge: 'Atualizar',
        description: 'O provedor externo recusou a senha registrada.',
        tone: 'danger',
        icon: ShieldAlert,
      };
    case 'PROVIDER_UNAVAILABLE':
    case 'PEC_UNAVAILABLE':
      return {
        title: 'Provedor indisponível',
        badge: 'Contingência',
        description: 'O provedor externo não respondeu agora.',
        tone: 'warning',
        icon: ShieldAlert,
      };
    case 'TECHNICAL_FAILURE':
    case 'UNKNOWN_ERROR':
      return {
        title: 'Falha técnica',
        badge: 'Revisar',
        description: 'Não foi possível confirmar a credencial.',
        tone: 'warning',
        icon: ShieldAlert,
      };
    case 'MISSING_CONFIGURATION':
    case 'NOT_CONFIGURED':
      return {
        title: 'Credencial não configurada',
        badge: 'Configurar',
        description: 'Ainda não existe credencial externa ativa para este profissional.',
        tone: 'neutral',
        icon: KeyRound,
      };
    case 'NOT_TESTED':
    case 'TESTING':
      return {
        title: 'Validação pendente',
        badge: 'Pendente',
        description: 'A credencial existe, mas ainda não foi validada com sucesso.',
        tone: 'info',
        icon: Clock3,
      };
    default:
      return {
        title: 'Sem status carregado',
        badge: 'Consultar',
        description: 'Selecione o provedor e consulte sua credencial externa.',
        tone: 'neutral',
        icon: KeyRound,
      };
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function selectDefaultProvider(integrations?: string[] | null, roles?: string[]): ExternalIdentityProvider {
  const normalizedIntegrations = new Set((integrations ?? []).map((item) => item.toUpperCase()));
  const normalizedRoles = new Set((roles ?? []).map((item) => item.toUpperCase()));
  if (normalizedRoles.has('PHARMACIST') && (normalizedIntegrations.has('HORUS_LEGACY') || normalizedIntegrations.has('HORUS_PHARMACY'))) {
    return 'HORUS_LEGACY';
  }
  if (normalizedIntegrations.has('ESUS_PEC')) return 'ESUS_PEC';
  if (normalizedIntegrations.has('ESUS_AF')) return 'ESUS_AF';
  if (normalizedIntegrations.has('HORUS_LEGACY') || normalizedIntegrations.has('HORUS_PHARMACY')) return 'HORUS_LEGACY';
  return 'ESUS_PEC';
}

export default function MyPecConnection() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<ExternalIdentityProvider>(() =>
    selectDefaultProvider(user?.integrations, user?.roles)
  );
  const [credential, setCredential] = useState<ExternalCredentialStatusResponse | null>(null);
  const [legacyPecCredential, setLegacyPecCredential] = useState<PecCredentialStatus | null>(null);
  const [externalUsername, setExternalUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);

  const statusValue = credential?.healthStatus ?? credential?.validityStatus ?? legacyPecCredential?.status;
  const copy = useMemo(() => statusCopy(statusValue), [statusValue]);
  const Icon = copy.icon;
  const canUseLegacyPec = provider === 'ESUS_PEC';
  const canRotate = newPassword.trim().length > 0 && !busy;
  const isAdministrative = Boolean(user?.roles?.some((role) =>
    ['ADMIN', 'TENANT_ADMIN', 'PLATFORM_ADMIN', 'HOSPITAL_MANAGER'].includes(role.toUpperCase())
  ));

  async function loadStatus(silent = false) {
    if (!silent) setBusy(true);
    try {
      if (!isAdministrative || user?.staffId || externalUsername.trim()) {
        const status = await externalIdentityService.credentialStatus({
          provider,
          staffId: user?.staffId,
          externalUsername: externalUsername.trim() || undefined,
        });
        setCredential(status);
        if (status.externalUsername) setExternalUsername(status.externalUsername);
      }

      if (provider === 'ESUS_PEC') {
        try {
          const legacyStatus = await pecShiftClosingService.credentialStatus();
          setLegacyPecCredential(legacyStatus);
          if (!externalUsername && legacyStatus.username) setExternalUsername(legacyStatus.username);
        } catch {
          setLegacyPecCredential(null);
        }
      } else {
        setLegacyPecCredential(null);
      }
    } finally {
      if (!silent) setBusy(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, [provider]);

  async function rotateCredential() {
    if (!canRotate) {
      toast.error('Informe a nova senha do provedor externo.');
      return;
    }
    setBusy(true);
    try {
      const result = await externalIdentityService.rotateCredential({
        provider,
        staffId: user?.staffId,
        externalUsername: externalUsername.trim() || undefined,
        newPassword,
        credentialExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      setNewPassword('');
      setCredential(result);
      toast[result.rotated ? 'success' : 'warning'](result.message || (result.rotated ? 'Credencial rotacionada.' : 'Senha não validada no provedor externo.'));
    } finally {
      setBusy(false);
    }
  }

  async function saveLegacyPecCredential() {
    if (!externalUsername.trim() || !newPassword.trim()) {
      toast.error('Informe CPF/login e senha do PEC.');
      return;
    }
    setBusy(true);
    try {
      await pecShiftClosingService.saveCredential(externalUsername, newPassword);
      setNewPassword('');
      const status = await pecShiftClosingService.testCredential();
      setLegacyPecCredential(status);
      toast.success('Teste enviado para o PEC.');
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary" className="mb-2">Identidade externa</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Minha conexão externa</h1>
          <p className="text-sm text-muted-foreground">
            Consulte status e rotacione sua credencial transicional sem expor senha em telas ou relatórios.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadStatus()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className={`border ${toneClasses}`}>
          <CardContent className="flex items-start gap-3 p-4">
            <div className="rounded-full bg-white/70 p-2 shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{copy.title}</span>
                <Badge variant="outline">{copy.badge}</Badge>
              </div>
              <p className="text-sm opacity-85">{credential?.message || legacyPecCredential?.message || copy.description}</p>
              <p className="text-xs opacity-70">Última validação: {formatDate(credential?.lastValidatedAt ?? legacyPecCredential?.lastTestedAt)}</p>
              {credential?.credentialExpiresAt && (
                <p className="text-xs opacity-70">Vencimento informado: {formatDate(credential.credentialExpiresAt)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Provedor e identificação
            </CardTitle>
            <CardDescription>
              Use o mesmo usuário que identifica sua conta no sistema externo selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Provedor</Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as ExternalIdentityProvider)}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="external-username">Login externo</Label>
              <Input
                id="external-username"
                value={externalUsername}
                onChange={(event) => setExternalUsername(event.target.value)}
                onBlur={() => loadStatus(true)}
                placeholder={`Usuário no ${providerLabel(provider)}`}
                autoComplete="username"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Rotacionar senha externa
            </CardTitle>
            <CardDescription>
              A senha fica apenas no campo durante o envio. A troca de senha real continua acontecendo no provedor externo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="external-password">Nova senha do provedor</Label>
                <Input
                  id="external-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Digite somente para validar/rotacionar"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires-at">Vencimento da credencial</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={rotateCredential} disabled={!canRotate}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Rotacionar em {providerOptions.find((option) => option.value === provider)?.shortLabel}
              </Button>
              {canUseLegacyPec && (
                <Button variant="outline" onClick={saveLegacyPecCredential} disabled={!canRotate || !externalUsername.trim()}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Salvar/testar PEC legado
                </Button>
              )}
            </div>
            {credential?.healthStatus === 'NOT_CONFIGURED' && (
              <Alert>
                <AlertDescription>
                  A rotação exige uma credencial externa já vinculada. Se ainda não houver vínculo aprovado, peça ao administrador para revisar sua identidade externa.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operação relacionada</CardTitle>
            <CardDescription>Atalhos mantidos para os fluxos que já dependem da credencial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {provider === 'ESUS_PEC' && (
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link to="/pec-shift-closing">Ir para fechamento PEC</Link>
              </Button>
            )}
            {provider === 'HORUS_LEGACY' && (
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link to="/pharmacy">Ir para farmácia</Link>
              </Button>
            )}
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              Senhas externas não são salvas no navegador. Depois de enviar, o campo é limpo e o status exibido vem do backend.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

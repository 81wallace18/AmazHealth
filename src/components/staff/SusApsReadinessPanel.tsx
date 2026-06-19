import { AlertTriangle, Building2, MapPinned, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  SusApsOrganizationInfo,
  SusApsReadinessIssue,
  SusApsReadinessResponse,
} from '@/types/susApsReadiness';

interface SusApsReadinessPanelProps {
  summary: SusApsReadinessResponse | null;
  organization: SusApsOrganizationInfo | null;
  isLoading?: boolean;
  onRetry?: () => void;
  resolveEntityLabel?: (issue: SusApsReadinessIssue) => string | null;
}

const scopeLabels: Record<string, string> = {
  Organization: 'Unidade',
  Staff: 'Profissional',
  ProfessionalSusAssignment: 'Vínculo SUS',
  Patient: 'Paciente',
  Medicine: 'Medicamento',
  PrescriptionItem: 'Item de prescrição',
};

function groupIssuesBySeverity(issues: SusApsReadinessIssue[]) {
  return issues.reduce<Record<string, SusApsReadinessIssue[]>>((acc, issue) => {
    const key = issue.severity;
    acc[key] = acc[key] ?? [];
    acc[key].push(issue);
    return acc;
  }, {});
}

function getScopeLabel(scope: string) {
  return scopeLabels[scope] ?? scope;
}

function renderTerritory(organization: SusApsOrganizationInfo | null) {
  if (!organization) {
    return 'Carregando unidade';
  }

  if (organization.municipalityName && organization.stateCode) {
    return `${organization.municipalityName}/${organization.stateCode}`;
  }

  if (organization.municipalityCode) {
    return `Código IBGE ${organization.municipalityCode}`;
  }

  return 'Território pendente';
}

export function SusApsReadinessPanel({
  summary,
  organization,
  isLoading = false,
  onRetry,
  resolveEntityLabel,
}: SusApsReadinessPanelProps) {
  const grouped = groupIssuesBySeverity(summary?.issues ?? []);
  const blockingIssues = grouped.BLOCKING ?? [];
  const sanitationIssues = grouped.SANITATION ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Saneamento SUS APS
          </CardTitle>
          <CardDescription>
            Pendências de cadastro e configuração para exportação APS, sem bloquear o uso local do sistema.
          </CardDescription>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Status
            </div>
            <div className="text-lg font-semibold">
              {summary?.ready ? 'Pronto para APS' : 'Com pendências'}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary ? `${summary.issues.length} apontamento(s) no total` : 'Resumo ainda não carregado'}
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Bloqueios
            </div>
            <div className="text-2xl font-semibold">{summary?.blockingCount ?? '—'}</div>
            <p className="mt-1 text-sm text-muted-foreground">Impedem geração/exportação válida</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4" />
              Saneamento
            </div>
            <div className="text-2xl font-semibold">{summary?.sanitationCount ?? '—'}</div>
            <p className="mt-1 text-sm text-muted-foreground">Ajustes recomendados sem bloqueio imediato</p>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Unidade
            </div>
            <div className="font-semibold">{organization?.organizationName ?? 'Organização ativa'}</div>
            <p className="mt-1 text-sm text-muted-foreground">
              CNES: {organization?.cnesCode?.trim() || 'Pendente'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Configuração da unidade
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">CNES</div>
                <div className="text-sm font-medium">{organization?.cnesCode?.trim() || 'Pendente'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Território</div>
                <div className="text-sm font-medium">{renderTerritory(organization)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <MapPinned className="h-4 w-4" />
              Leitura operacional
            </div>
            <p className="text-sm text-muted-foreground">
              Os formulários locais continuam funcionando. Este painel apenas evidencia o que ainda precisa ser saneado para fluxos SUS APS.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">Pendências bloqueantes</div>
              <Badge variant={blockingIssues.length > 0 ? 'destructive' : 'secondary'}>
                {blockingIssues.length}
              </Badge>
            </div>
            {blockingIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum bloqueio encontrado.</p>
            ) : (
              <div className="space-y-3">
                {blockingIssues.map((issue) => (
                  <div key={`${issue.severity}-${issue.scope}-${issue.entityId}-${issue.field}-${issue.code}`} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="destructive">{getScopeLabel(issue.scope)}</Badge>
                      {resolveEntityLabel?.(issue) && (
                        <span className="text-sm font-medium">{resolveEntityLabel(issue)}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{issue.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Campo: {issue.field} · Código: {issue.code}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">Pendências de saneamento</div>
              <Badge variant="secondary">{sanitationIssues.length}</Badge>
            </div>
            {sanitationIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ajuste adicional sinalizado.</p>
            ) : (
              <div className="space-y-3">
                {sanitationIssues.map((issue) => (
                  <div key={`${issue.severity}-${issue.scope}-${issue.entityId}-${issue.field}-${issue.code}`} className="rounded-md border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{getScopeLabel(issue.scope)}</Badge>
                      {resolveEntityLabel?.(issue) && (
                        <span className="text-sm font-medium">{resolveEntityLabel(issue)}</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{issue.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Campo: {issue.field} · Código: {issue.code}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SusApsReadinessPanel;

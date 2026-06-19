import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useCapabilities } from '@/auth/useCapabilities';
import { useToast } from '@/hooks/use-toast';
import { pharmacyService } from '@/services/pharmacyService';
import type {
  HorusOperationalDivergence,
  HorusOperationalDivergenceStatus,
  HorusOperationalDivergenceType
} from '@/types/pharmacy';

type DivergenceFilter = HorusOperationalDivergenceStatus | 'ALL';

const statusLabels: Record<HorusOperationalDivergenceStatus, string> = {
  OPEN: 'Aberta',
  IN_REVIEW: 'Em revisão',
  RESOLVED_MANUAL: 'Resolvida',
  EXTERNAL_TASK_CREATED: 'Tarefa externa',
  IGNORED: 'Ignorada',
  CORRECTION_REQUIRED: 'Correção necessária'
};

const typeLabels: Record<HorusOperationalDivergenceType, string> = {
  PENDING_MAPPING: 'Mapeamento pendente',
  NO_AVAILABLE_STOCK: 'Sem saldo',
  BLOCKED_BATCH: 'Lote bloqueado',
  EXPIRED_BATCH: 'Lote vencido',
  NEAR_EXPIRY_BATCH: 'Validade crítica',
  QUANTITY_CONFLICT: 'Quantidade divergente'
};

const decisionOptions: HorusOperationalDivergenceStatus[] = [
  'IN_REVIEW',
  'RESOLVED_MANUAL',
  'EXTERNAL_TASK_CREATED',
  'IGNORED',
  'CORRECTION_REQUIRED'
];

function formatDateTime(value?: string | null) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function statusBadge(status: HorusOperationalDivergenceStatus) {
  const variant = status === 'OPEN' || status === 'CORRECTION_REQUIRED'
    ? 'destructive'
    : status === 'RESOLVED_MANUAL' || status === 'IGNORED'
      ? 'secondary'
      : 'outline';
  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function HorusOperationalDivergencesPanel() {
  const capabilities = useCapabilities();
  const canWrite = capabilities.hasRole('PHARMACIST') || capabilities.hasRole('PLATFORM_ADMIN');
  const { toast } = useToast();

  const [filter, setFilter] = useState<DivergenceFilter>('OPEN');
  const [divergences, setDivergences] = useState<HorusOperationalDivergence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HorusOperationalDivergence | null>(null);
  const [nextStatus, setNextStatus] = useState<HorusOperationalDivergenceStatus>('IN_REVIEW');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pharmacyService.getHorusOperationalDivergences({
        status: filter === 'ALL' ? undefined : filter
      });
      setDivergences(response);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Não foi possível carregar as divergências operacionais.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    return divergences.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [divergences]);

  const openDecision = (divergence: HorusOperationalDivergence) => {
    setSelected(divergence);
    setNextStatus(divergence.status === 'OPEN' ? 'IN_REVIEW' : divergence.status);
    setReason(divergence.resolution ?? '');
  };

  const saveDecision = async () => {
    if (!selected) return;
    if (!canWrite) {
      toast({
        title: 'Sem permissão',
        description: 'Somente farmacêutico ou superadmin pode decidir divergências HÓRUS.',
        variant: 'destructive'
      });
      return;
    }
    if (!reason.trim()) {
      toast({
        title: 'Informe a justificativa',
        description: 'A decisão operacional exige justificativa auditável.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const updated = await pharmacyService.decideHorusOperationalDivergence(selected.id, {
        status: nextStatus,
        reason: reason.trim()
      });
      setDivergences((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(null);
      toast({ title: 'Divergência atualizada', description: 'A decisão foi registrada com auditoria.' });
      await load();
    } catch (err: any) {
      toast({
        title: 'Falha ao registrar decisão',
        description: err.response?.data?.message || err.message || 'Não foi possível atualizar a divergência.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!canWrite && (
        <Alert>
          <AlertDescription>
            Seu perfil pode acompanhar divergências, mas decisões ficam restritas ao farmacêutico e ao superadmin.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5" />
              Divergências Operacionais HÓRUS
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fila auditável de divergências persistidas a partir dos snapshots importados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as DivergenceFilter)}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="OPEN">Abertas</SelectItem>
                <SelectItem value="IN_REVIEW">Em revisão</SelectItem>
                <SelectItem value="RESOLVED_MANUAL">Resolvidas</SelectItem>
                <SelectItem value="EXTERNAL_TASK_CREATED">Tarefa externa</SelectItem>
                <SelectItem value="IGNORED">Ignoradas</SelectItem>
                <SelectItem value="CORRECTION_REQUIRED">Correção necessária</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {(['OPEN', 'IN_REVIEW', 'RESOLVED_MANUAL', 'EXTERNAL_TASK_CREATED', 'IGNORED', 'CORRECTION_REQUIRED'] as HorusOperationalDivergenceStatus[])
              .map((status) => (
                <Badge key={status} variant="outline">{statusLabels[status]}: {counts[status] ?? 0}</Badge>
              ))}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando divergências...
            </div>
          ) : divergences.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma divergência operacional encontrada.</div>
          ) : (
            <ScrollArea className="h-[560px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divergences.map((divergence) => (
                    <TableRow key={divergence.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{typeLabels[divergence.divergenceType]}</div>
                        <div className="text-xs text-muted-foreground">{divergence.divergenceType}</div>
                      </TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        <div>Run: {divergence.sourceRunId}</div>
                        <div>Linha: {divergence.sourceRowId}</div>
                        {divergence.mappingId && <div>Mapa: {divergence.mappingId}</div>}
                      </TableCell>
                      <TableCell className="align-top">{statusBadge(divergence.status)}</TableCell>
                      <TableCell className="max-w-[360px] align-top">
                        <div className="text-sm">{divergence.reason || 'Sem motivo registrado'}</div>
                        {divergence.resolution && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {divergence.resolution} · {formatDateTime(divergence.resolvedAt)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => openDecision(divergence)} disabled={!canWrite}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Decidir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Decidir divergência operacional</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  {typeLabels[selected.divergenceType]}
                </div>
                <div className="mt-2 text-muted-foreground">{selected.reason || 'Sem motivo registrado'}</div>
                <div className="mt-2">{statusBadge(selected.status)}</div>
              </div>

              <div className="space-y-2">
                <Label>Novo status</Label>
                <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as HorusOperationalDivergenceStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {decisionOptions.map((status) => (
                      <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Justificativa</Label>
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
                <Button onClick={saveDecision} disabled={saving || !canWrite}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar decisão
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

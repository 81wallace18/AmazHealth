import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useCapabilities } from '@/auth/useCapabilities';
import { useToast } from '@/hooks/use-toast';
import { pharmacyService } from '@/services/pharmacyService';
import type {
  HorusExternalMedicineMapping,
  HorusExternalMedicineMappingDecision,
  HorusExternalMedicineMappingStatus,
  Medicine
} from '@/types/pharmacy';
import { CheckCircle2, History, Loader2, RefreshCw, RotateCcw, Search, XCircle } from 'lucide-react';

type MappingFilter = HorusExternalMedicineMappingStatus | 'ALL';
type MappingAction = 'APPROVE' | 'REVERT' | 'IGNORE' | 'MARK_REVIEW';

const statusLabels: Record<HorusExternalMedicineMappingStatus, string> = {
  PENDING: 'Pendente',
  MATCHED: 'Vinculado',
  REVIEW: 'Revisão',
  IGNORED: 'Ignorado'
};

const actionLabels: Record<MappingAction, string> = {
  APPROVE: 'Aprovar vínculo',
  REVERT: 'Reverter vínculo',
  IGNORE: 'Ignorar item',
  MARK_REVIEW: 'Enviar para revisão'
};

export function HorusMappingsPanel() {
  const capabilities = useCapabilities();
  const canWrite = capabilities.hasRole('PHARMACIST') || capabilities.hasRole('PLATFORM_ADMIN');
  const { toast } = useToast();

  const [filter, setFilter] = useState<MappingFilter>('PENDING');
  const [mappings, setMappings] = useState<HorusExternalMedicineMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<HorusExternalMedicineMapping | null>(null);
  const [action, setAction] = useState<MappingAction>('APPROVE');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicineLoading, setMedicineLoading] = useState(false);
  const [decisions, setDecisions] = useState<HorusExternalMedicineMappingDecision[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadMappings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pharmacyService.getHorusMappings({
        status: filter === 'ALL' ? undefined : filter
      });
      setMappings(response);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Não foi possível carregar os mapeamentos HÓRUS.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadMappings();
  }, [loadMappings]);

  const counts = useMemo(() => {
    return mappings.reduce<Record<string, number>>((acc, item) => {
      acc[item.mappingStatus] = (acc[item.mappingStatus] ?? 0) + 1;
      return acc;
    }, {});
  }, [mappings]);

  const openAction = async (mapping: HorusExternalMedicineMapping, nextAction: MappingAction) => {
    setSelected(mapping);
    setAction(nextAction);
    setReason(mapping.notes ?? '');
    setSelectedMedicine(null);
    setMedicineQuery(mapping.externalProductName);
    setMedicines([]);
    setDecisions([]);
    setHistoryLoading(true);
    try {
      const history = await pharmacyService.getHorusMappingDecisions(mapping.id);
      setDecisions(history);
    } finally {
      setHistoryLoading(false);
    }
  };

  const searchMedicines = async () => {
    setMedicineLoading(true);
    try {
      const response = medicineQuery.trim()
        ? await pharmacyService.searchMedicines(medicineQuery, 0, 20)
        : await pharmacyService.getMedicines({ page: 0, size: 20 });
      setMedicines(response.content.filter((medicine) => medicine.isActive !== false));
    } finally {
      setMedicineLoading(false);
    }
  };

  const saveDecision = async () => {
    if (!selected) return;
    if (!canWrite) {
      toast({ title: 'Sem permissão', description: 'Somente farmacêutico ou superadmin pode alterar mapeamentos HÓRUS.', variant: 'destructive' });
      return;
    }
    if (action === 'APPROVE' && !selectedMedicine) {
      toast({ title: 'Selecione o medicamento', description: 'Escolha um medicamento local ativo para aprovar o vínculo.', variant: 'destructive' });
      return;
    }
    if (action !== 'APPROVE' && !reason.trim()) {
      toast({ title: 'Informe a justificativa', description: 'Reverter, ignorar ou revisar exige justificativa auditável.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let updated: HorusExternalMedicineMapping;
      if (action === 'APPROVE') {
        updated = await pharmacyService.approveHorusMapping(selected.id, {
          medicineId: selectedMedicine!.id,
          reason: reason.trim() || undefined
        });
      } else if (action === 'REVERT') {
        updated = await pharmacyService.revertHorusMapping(selected.id, { reason: reason.trim() });
      } else if (action === 'IGNORE') {
        updated = await pharmacyService.ignoreHorusMapping(selected.id, { reason: reason.trim() });
      } else {
        updated = await pharmacyService.markHorusMappingForReview(selected.id, { reason: reason.trim() });
      }

      setMappings((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected(null);
      toast({ title: 'Mapeamento atualizado', description: 'A decisão foi registrada com histórico auditável.' });
      await loadMappings();
    } catch (err: any) {
      toast({
        title: 'Falha ao atualizar mapeamento',
        description: err.response?.data?.message || err.message || 'Não foi possível registrar a decisão.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: HorusExternalMedicineMappingStatus) => {
    const variant = status === 'MATCHED' ? 'default' : status === 'IGNORED' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{statusLabels[status]}</Badge>;
  };

  return (
    <div className="space-y-4">
      {!canWrite && (
        <Alert>
          <AlertDescription>
            Seu perfil pode acompanhar os mapeamentos, mas alterações ficam restritas ao farmacêutico e ao superadmin.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Mapeamentos HÓRUS
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vínculo reversível entre produtos externos e medicamentos internos existentes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as MappingFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="REVIEW">Revisão</SelectItem>
                <SelectItem value="MATCHED">Vinculados</SelectItem>
                <SelectItem value="IGNORED">Ignorados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadMappings} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            {(['PENDING', 'REVIEW', 'MATCHED', 'IGNORED'] as HorusExternalMedicineMappingStatus[]).map((status) => (
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
              Carregando mapeamentos...
            </div>
          ) : mappings.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum mapeamento encontrado.</div>
          ) : (
            <ScrollArea className="h-[520px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto externo</TableHead>
                    <TableHead>Medicamento interno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{mapping.externalProductName || 'Sem nome'}</div>
                        <div className="text-xs text-muted-foreground">
                          {mapping.externalProgramName || 'sem programa'} · {mapping.externalUnitName || 'sem unidade'}
                        </div>
                        {mapping.notes && <div className="mt-1 text-xs text-muted-foreground">{mapping.notes}</div>}
                      </TableCell>
                      <TableCell className="align-top">
                        {mapping.medicineName ? (
                          <div>
                            <div className="font-medium">{mapping.medicineName}</div>
                            <div className="text-xs text-muted-foreground">{mapping.medicineId}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem vínculo</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top">{statusBadge(mapping.mappingStatus)}</TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openAction(mapping, 'APPROVE')} disabled={!canWrite}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAction(mapping, 'MARK_REVIEW')} disabled={!canWrite}>
                            <Search className="mr-2 h-4 w-4" />
                            Revisar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAction(mapping, 'REVERT')} disabled={!canWrite || mapping.mappingStatus !== 'MATCHED'}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reverter
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAction(mapping, 'IGNORE')} disabled={!canWrite}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Ignorar
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{actionLabels[action]}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">{selected.externalProductName}</div>
                <div className="text-muted-foreground">{selected.externalProgramName || 'sem programa'} · {selected.externalUnitName || 'sem unidade'}</div>
                <div className="mt-2">{statusBadge(selected.mappingStatus)}</div>
              </div>

              {action === 'APPROVE' && (
                <div className="space-y-3">
                  <Label>Medicamento interno ativo</Label>
                  <div className="flex gap-2">
                    <Input value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="Buscar medicamento local" />
                    <Button variant="outline" onClick={searchMedicines} disabled={medicineLoading}>
                      {medicineLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Buscar
                    </Button>
                  </div>
                  <ScrollArea className="h-[180px] rounded-md border">
                    <Table>
                      <TableBody>
                        {medicines.map((medicine) => (
                          <TableRow key={medicine.id} className="cursor-pointer" onClick={() => setSelectedMedicine(medicine)}>
                            <TableCell>
                              <div className="font-medium">{medicine.medicineName}</div>
                              <div className="text-xs text-muted-foreground">{medicine.medicineCode} · {medicine.category || 'sem categoria'}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedMedicine?.id === medicine.id && <Badge>Selecionado</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-2">
                <Label>{action === 'APPROVE' ? 'Observação' : 'Justificativa obrigatória'}</Label>
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Histórico auditável</Label>
                {historyLoading ? (
                  <div className="flex items-center py-4 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando histórico...
                  </div>
                ) : decisions.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">Nenhuma decisão registrada.</div>
                ) : (
                  <ScrollArea className="h-[140px] rounded-md border">
                    <div className="space-y-2 p-3">
                      {decisions.map((decision) => (
                        <div key={decision.id} className="text-sm">
                          <div className="font-medium">{actionLabels[decision.decisionType]} · {statusLabels[decision.newStatus]}</div>
                          <div className="text-xs text-muted-foreground">{new Date(decision.createdAt).toLocaleString()} · {decision.reason}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
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

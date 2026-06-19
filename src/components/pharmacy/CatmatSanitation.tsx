import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCapabilities } from '@/auth/useCapabilities';
import { useOrgConfig } from '@/hooks/useOrgConfig';
import { pharmacyService } from '@/services/pharmacyService';
import type { Medicine, OfficialMedicineReference } from '@/types/pharmacy';
import { Link2, Loader2, Upload } from 'lucide-react';

export function CatmatSanitation() {
  const { toast } = useToast();
  const capabilities = useCapabilities();
  const { hasPolicy } = useOrgConfig();
  const canManageCatmat = capabilities.hasRole('PHARMACIST') || hasPolicy('pharmacy_catalog_management');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [references, setReferences] = useState<OfficialMedicineReference[]>([]);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [referenceQuery, setReferenceQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedReference, setSelectedReference] = useState<OfficialMedicineReference | null>(null);
  const [lmeEligible, setLmeEligible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sourceName, setSourceName] = useState('CATMAT oficial');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const response = medicineQuery.trim()
        ? await pharmacyService.searchMedicines(medicineQuery, 0, 30)
        : await pharmacyService.getMedicines({ page: 0, size: 30 });
      setMedicines(response.content);
    } finally {
      setLoading(false);
    }
  }, [medicineQuery]);

  const loadReferences = useCallback(async () => {
    const response = await pharmacyService.searchOfficialMedicineReferences({
      q: referenceQuery,
      active: true,
      page: 0,
      size: 30
    });
    setReferences(response.content);
  }, [referenceQuery]);

  useEffect(() => {
    void loadMedicines();
  }, [loadMedicines]);

  useEffect(() => {
    void loadReferences();
  }, [loadReferences]);

  const selectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setLmeEligible(Boolean(medicine.lmeEligible));
  };

  const link = async () => {
    if (!canManageCatmat) {
      toast({ title: 'Sem permissão', description: 'Somente farmácia ou gestão farmacêutica pode vincular CATMAT.', variant: 'destructive' });
      return;
    }
    if (!selectedMedicine || !selectedReference) {
      toast({ title: 'Seleção incompleta', description: 'Escolha o medicamento local e a referência CATMAT.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await pharmacyService.linkMedicineToCatmat(selectedMedicine.id, {
        officialMedicineReferenceId: selectedReference.id,
        lmeEligible
      });
      setSelectedMedicine(updated);
      setMedicines((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: 'CATMAT vinculado', description: 'Medicamento saneado para uso em LME conforme aptidão informada.' });
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    if (!canManageCatmat) {
      toast({ title: 'Sem permissão', description: 'Somente farmácia ou gestão farmacêutica pode remover vínculo CATMAT.', variant: 'destructive' });
      return;
    }
    if (!selectedMedicine) return;
    setSaving(true);
    try {
      const updated = await pharmacyService.unlinkMedicineFromCatmat(selectedMedicine.id);
      setSelectedMedicine(updated);
      setSelectedReference(null);
      setMedicines((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast({ title: 'Vínculo removido', description: 'O medicamento deixou de ficar apto para LME.' });
    } finally {
      setSaving(false);
    }
  };

  const importCatalog = async () => {
    if (!canManageCatmat) {
      toast({ title: 'Sem permissão', description: 'Somente farmácia ou gestão farmacêutica pode importar o catálogo oficial.', variant: 'destructive' });
      return;
    }
    if (!file || !sourceName.trim()) {
      toast({ title: 'Importação incompleta', description: 'Informe fonte e arquivo CSV oficial.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const result = await pharmacyService.importOfficialMedicineReferences({ file, sourceName, sourceUrl });
      toast({
        title: 'Catálogo importado',
        description: `${result.createdCount} criados, ${result.updatedCount} atualizados, ${result.rejectedCount} rejeitados.`
      });
      setFile(null);
      await loadReferences();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Médico só seleciona medicamentos já aptos para LME. Se faltar CATMAT, a farmácia saneia aqui antes da solicitação ser finalizada.
        </AlertDescription>
      </Alert>
      {!canManageCatmat && (
        <Alert>
          <AlertDescription>
            Seu perfil está em modo consulta. Importar catálogo, vincular CATMAT e marcar aptidão LME ficam restritos à farmácia ou à política de gestão farmacêutica.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Importação administrada do Catálogo Oficial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-1">
            <Label>Fonte</Label>
            <Input value={sourceName} onChange={(event) => setSourceName(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>URL da fonte</Label>
            <Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="Opcional" />
          </div>
          <div className="space-y-1">
            <Label>Arquivo CSV</Label>
            <Input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          <div className="flex items-end">
            <Button onClick={importCatalog} disabled={saving || !canManageCatmat}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Medicamento local</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="Buscar por nome, código ou CATMAT" />
              <Button variant="outline" onClick={loadMedicines} disabled={loading}>Buscar</Button>
            </div>
            <ScrollArea className="h-[360px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicamento</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine) => (
                    <TableRow key={medicine.id} className="cursor-pointer" onClick={() => selectMedicine(medicine)}>
                      <TableCell>
                        <div className="font-medium">{medicine.medicineName}</div>
                        <div className="text-xs text-muted-foreground">{medicine.medicineCode} · CATMAT {medicine.catmatCode || 'pendente'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={medicine.officialMedicineReferenceId ? 'default' : 'secondary'}>
                            {medicine.officialMedicineReferenceId ? 'CATMAT vinculado' : 'Sem vínculo'}
                          </Badge>
                          <Badge variant={medicine.lmeEligible ? 'default' : 'outline'}>
                            {medicine.lmeEligible ? 'Apto LME' : 'Não apto LME'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referência CATMAT oficial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={referenceQuery} onChange={(event) => setReferenceQuery(event.target.value)} placeholder="Buscar CATMAT ou nome oficial" />
              <Button variant="outline" onClick={loadReferences}>Buscar</Button>
            </div>
            <ScrollArea className="h-[360px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {references.map((reference) => (
                    <TableRow key={reference.id} className="cursor-pointer" onClick={() => setSelectedReference(reference)}>
                      <TableCell>
                        <div className="font-medium">{reference.officialName}</div>
                        <div className="text-xs text-muted-foreground">CATMAT {reference.catmatCode} · {reference.presentation || reference.concentration || 'sem apresentação'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={reference.active ? 'default' : 'secondary'}>{reference.active ? 'Ativa' : 'Inativa'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Vínculo selecionado</p>
            <p className="text-sm text-muted-foreground">
              {selectedMedicine ? selectedMedicine.medicineName : 'Nenhum medicamento'} → {selectedReference ? `${selectedReference.catmatCode} ${selectedReference.officialName}` : 'nenhuma referência selecionada'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="lme-eligible">Apto para LME</Label>
            <Switch id="lme-eligible" checked={lmeEligible} onCheckedChange={setLmeEligible} />
            <Button variant="outline" onClick={unlink} disabled={!selectedMedicine || saving || !canManageCatmat}>Remover vínculo</Button>
            <Button onClick={link} disabled={!selectedMedicine || !selectedReference || saving || !canManageCatmat}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              Vincular CATMAT
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Activity, Plus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import nursingProcedureService, { NursingProcedureRecord, PecProcedureMapping } from '@/services/nursingProcedureService';

interface NursingProcedurePanelProps {
  visitId: string;
}

const groupLabels: Record<string, string> = {
  CONSOLIDADO: 'Consolidado',
  INDIVIDUALIZADO: 'Individualizado',
  TESTE_RAPIDO: 'Teste rápido',
  ADMINISTRACAO_MEDICAMENTO: 'Administração',
  SIGTAP: 'SIGTAP',
};

export function NursingProcedurePanel({ visitId }: NursingProcedurePanelProps) {
  const [mappings, setMappings] = useState<PecProcedureMapping[]>([]);
  const [records, setRecords] = useState<NursingProcedureRecord[]>([]);
  const [procedureMappingId, setProcedureMappingId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [shift, setShift] = useState<'MANHA' | 'TARDE' | 'NOITE'>('TARDE');
  const [localAtendimento, setLocalAtendimento] = useState('UBS');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const manualMappings = useMemo(() => mappings, [mappings]);

  async function load() {
    setBusy(true);
    try {
      const [nextMappings, nextRecords] = await Promise.all([
        nursingProcedureService.mappings(),
        nursingProcedureService.byVisit(visitId),
      ]);
      setMappings(nextMappings);
      setRecords(nextRecords);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [visitId]);

  async function addProcedure() {
    if (!procedureMappingId) {
      toast.error('Selecione o procedimento realizado.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        visitId,
        procedureMappingId,
        quantity: Number(quantity) || 1,
        shift,
        localAtendimento,
        notes: notes.trim() || undefined,
      };
      if (editingId) {
        await nursingProcedureService.update(editingId, payload);
        toast.success('Procedimento atualizado.');
      } else {
        await nursingProcedureService.create(payload);
        toast.success('Procedimento registrado para o fechamento PEC.');
      }
      setProcedureMappingId('');
      setQuantity('1');
      setNotes('');
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Procedimentos de enfermagem</CardTitle>
          <CardDescription>
            Registre aqui o que não vem automaticamente da triagem. Esses dados alimentam o fechamento PEC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[2fr_0.8fr_0.8fr_1fr]">
            <div className="space-y-2">
              <Label>Procedimento realizado</Label>
              <Select value={procedureMappingId} onValueChange={setProcedureMappingId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {manualMappings.map((mapping) => (
                    <SelectItem key={mapping.id} value={mapping.id}>
                      {mapping.displayName} · {groupLabels[mapping.procedureGroup]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Turno</Label>
              <Select value={shift} onValueChange={(value) => setShift(value as 'MANHA' | 'TARDE' | 'NOITE')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANHA">Manhã</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOITE">Noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input value={localAtendimento} onChange={(event) => setLocalAtendimento(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observação opcional</Label>
            <Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={load} disabled={busy}>
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button onClick={addProcedure} disabled={busy}>
              <Plus className="mr-2 h-4 w-4" /> {editingId ? 'Atualizar procedimento' : 'Adicionar procedimento'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Procedimentos deste atendimento</CardTitle>
          <CardDescription>Itens automáticos da triagem e lançamentos manuais.</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum procedimento registrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Grupo PEC</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.procedureName}</TableCell>
                    <TableCell>{groupLabels[record.procedureGroup] || record.procedureGroup}</TableCell>
                    <TableCell>{record.source === 'TRIAGE_VITAL_SIGNS' ? 'Triagem' : 'Manual'}</TableCell>
                    <TableCell>{record.shift}</TableCell>
                    <TableCell><Badge variant="secondary">{record.exportStatus}</Badge></TableCell>
                    <TableCell className="text-right">
                      {record.source === 'MANUAL' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(record.id);
                              setProcedureMappingId(record.procedureMappingId);
                              setQuantity(String(record.quantity || 1));
                              setShift(record.shift);
                              setLocalAtendimento(record.localAtendimento || 'UBS');
                              setNotes(record.notes || '');
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await nursingProcedureService.delete(record.id);
                                await load();
                                toast.success('Procedimento removido.');
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

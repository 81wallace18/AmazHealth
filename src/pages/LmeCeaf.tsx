import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCapabilities } from '@/auth/useCapabilities';
import { useToast } from '@/hooks/use-toast';
import { lmeService } from '@/services/lmeService';
import { patientService } from '@/services/patientService';
import { pharmacyService } from '@/services/pharmacyService';
import type { LmeFillerType, LmeMedicationRequestItem, LmeRequestResponse, LmeRequestSaveRequest, LmeRequestStatus } from '@/types/lme';
import type { Patient } from '@/types/patient';
import type { Medicine } from '@/types/pharmacy';
import { Download, Loader2, Plus, Printer, Save, Search, Send, XCircle } from 'lucide-react';

const statusLabels: Record<LmeRequestStatus, string> = {
  DRAFT: 'Rascunho',
  FINALIZED: 'Finalizada',
  PRINTED: 'Impressa',
  CANCELLED: 'Cancelada',
  REPLACED: 'Substituída'
};

const fillerLabels: Record<LmeFillerType, string> = {
  PATIENT: 'Paciente',
  MOTHER: 'Mãe',
  LEGAL_RESPONSIBLE: 'Responsável legal',
  DOCTOR: 'Médico',
  OTHER: 'Outro'
};

const initialForm: LmeRequestSaveRequest = {
  patientId: '',
  requestDate: new Date().toISOString().slice(0, 10),
  previousTreatment: false,
  incapable: false,
  fillerType: 'PATIENT',
  medications: []
};

function patientName(patient: Patient) {
  return `${patient.firstName} ${patient.lastName}`.trim();
}

function asQuantity(value: string) {
  return value === '' ? 0 : Math.max(Number(value), 0);
}

export default function LmeCeaf() {
  const { toast } = useToast();
  const capabilities = useCapabilities();
  const canWriteLme = capabilities.hasRole('DOCTOR') || capabilities.hasRole('PLATFORM_ADMIN');
  const canPrintLme = canWriteLme || capabilities.hasRole('ADMIN') || capabilities.hasRole('PHARMACIST');
  const canCancelLme = canWriteLme || capabilities.hasRole('ADMIN');
  const [requests, setRequests] = useState<LmeRequestResponse[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patientQuery, setPatientQuery] = useState('');
  const [medicineQuery, setMedicineQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LmeRequestStatus | 'ALL'>('ALL');
  const [form, setForm] = useState<LmeRequestSaveRequest>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState('');

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === form.patientId),
    [patients, form.patientId]
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await lmeService.search({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: 0,
        size: 30
      });
      setRequests(response.content);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const searchPatients = async () => {
    const response = await patientService.search({ query: patientQuery, page: 0, size: 20 });
    setPatients(response.content);
  };

  const searchMedicines = useCallback(async () => {
    const response = await pharmacyService.searchMedicines(medicineQuery, 0, 20, {
      lmeEligible: true,
      officialLinked: true
    });
    setMedicines(response.content);
  }, [medicineQuery]);

  useEffect(() => {
    void loadRequests();
    void searchMedicines();
  }, [loadRequests, searchMedicines]);

  const updateField = <K extends keyof LmeRequestSaveRequest>(field: K, value: LmeRequestSaveRequest[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addMedication = (medicine: Medicine) => {
    if (form.medications.some((item) => item.medicineId === medicine.id)) {
      toast({ title: 'Medicamento já adicionado', description: 'Cada medicamento deve aparecer uma vez na solicitação.' });
      return;
    }
    if (form.medications.length >= 6) {
      toast({ title: 'Limite do LME', description: 'A solicitação permite no máximo 6 medicamentos.', variant: 'destructive' });
      return;
    }
    updateField('medications', [...form.medications, { medicineId: medicine.id, month1Quantity: 0, month2Quantity: 0, month3Quantity: 0, month4Quantity: 0, month5Quantity: 0, month6Quantity: 0 }]);
  };

  const removeMedication = (medicineId: string) => {
    updateField('medications', form.medications.filter((item) => item.medicineId !== medicineId));
  };

  const updateMedication = (medicineId: string, field: keyof LmeMedicationRequestItem, value: number) => {
    updateField('medications', form.medications.map((item) => (
      item.medicineId === medicineId ? { ...item, [field]: value } : item
    )));
  };

  const buildPayload = (): LmeRequestSaveRequest => ({
    ...form,
    patientId: form.patientId,
    cid10Code: form.cid10Code?.trim().toUpperCase(),
    diagnosis: form.diagnosis?.trim(),
    anamnesis: form.anamnesis?.trim(),
    previousTreatmentDescription: form.previousTreatmentDescription?.trim(),
    legalResponsibleName: form.legalResponsibleName?.trim(),
    legalResponsibleCpf: form.legalResponsibleCpf?.trim(),
    fillerName: form.fillerName?.trim(),
    fillerCpf: form.fillerCpf?.trim(),
    indigenousEthnicity: form.indigenousEthnicity?.trim(),
    pcdtChecklist: form.pcdtChecklist?.trim()
  });

  const save = async (): Promise<LmeRequestResponse | null> => {
    if (!canWriteLme) {
      toast({ title: 'Somente médico finaliza LME', description: 'Seu perfil pode acompanhar e imprimir, mas não criar solicitação LME.', variant: 'destructive' });
      return null;
    }
    if (!form.patientId) {
      toast({ title: 'Paciente obrigatório', description: 'Selecione o paciente antes de salvar a LME.', variant: 'destructive' });
      return null;
    }
    setSaving(true);
    try {
      const saved = editingId
        ? await lmeService.update(editingId, buildPayload())
        : await lmeService.create(buildPayload());
      setEditingId(saved.id);
      toast({ title: 'Solicitação salva', description: 'Rascunho LME atualizado com sucesso.' });
      await loadRequests();
      return saved;
    } finally {
      setSaving(false);
    }
  };

  const finalize = async () => {
    if (!canWriteLme) {
      toast({ title: 'Somente médico finaliza LME', description: 'Acione o médico responsável para finalizar a solicitação.', variant: 'destructive' });
      return;
    }
    let requestId = editingId;
    if (!requestId) {
      const saved = await save();
      requestId = saved?.id ?? null;
    }
    if (!requestId) {
      return;
    }
    setSaving(true);
    try {
      const finalized = await lmeService.finalize(requestId);
      toast({ title: 'LME finalizada', description: 'A solicitação ficou imutável e pronta para impressão.' });
      setEditingId(finalized.id);
      await loadRequests();
    } finally {
      setSaving(false);
    }
  };

  const editRequest = async (request: LmeRequestResponse) => {
    setEditingId(request.id);
    setForm({
      patientId: request.patientId,
      doctorId: request.doctorId,
      visitId: request.visitId,
      attendanceId: request.attendanceId,
      prescriptionId: request.prescriptionId,
      requestDate: request.requestDate,
      weightKg: request.weightKg,
      heightCm: request.heightCm,
      cid10Code: request.cid10Code,
      diagnosis: request.diagnosis,
      anamnesis: request.anamnesis,
      previousTreatment: Boolean(request.previousTreatment),
      incapable: Boolean(request.incapable),
      legalResponsibleName: request.legalResponsibleName,
      fillerType: request.fillerType ?? 'PATIENT',
      fillerName: request.fillerName,
      indigenousEthnicity: request.indigenousEthnicity,
      pcdtChecklist: request.pcdtChecklist,
      medications: request.medications.map((medication) => ({
        medicineId: medication.medicineId,
        month1Quantity: medication.month1Quantity,
        month2Quantity: medication.month2Quantity,
        month3Quantity: medication.month3Quantity,
        month4Quantity: medication.month4Quantity,
        month5Quantity: medication.month5Quantity,
        month6Quantity: medication.month6Quantity
      }))
    });
    if (!patients.some((patient) => patient.id === request.patientId)) {
      const patient = await patientService.getById(request.patientId);
      setPatients((prev) => [patient, ...prev]);
    }
  };

  const downloadPdf = async (request: LmeRequestResponse) => {
    const blob = await lmeService.downloadPdf(request.id);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lme_${request.id}.pdf`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    await loadRequests();
  };

  const cancelRequest = async (request: LmeRequestResponse) => {
    if (!reason.trim()) {
      toast({ title: 'Motivo obrigatório', description: 'Informe o motivo antes de cancelar ou substituir.', variant: 'destructive' });
      return;
    }
    await lmeService.cancel(request.id, reason);
    setReason('');
    toast({ title: 'Solicitação cancelada', description: 'O histórico foi preservado para auditoria.' });
    await loadRequests();
  };

  const replaceRequest = async (request: LmeRequestResponse) => {
    if (!reason.trim()) {
      toast({ title: 'Motivo obrigatório', description: 'Informe o motivo antes de cancelar ou substituir.', variant: 'destructive' });
      return;
    }
    const replacement = await lmeService.replace(request.id, reason);
    setReason('');
    toast({ title: 'Substituição criada', description: 'Um novo rascunho foi criado a partir da LME anterior.' });
    await loadRequests();
    await editRequest(replacement);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const medicationName = (medicineId: string) => {
    const medicine = medicines.find((item) => item.id === medicineId);
    return medicine ? `${medicine.medicineName} (${medicine.catmatCode})` : medicineId;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">LME/CEAF</h1>
        <p className="text-muted-foreground">Solicitação médica de medicamentos especializados com CATMAT saneado.</p>
      </div>

      <Alert>
        <AlertDescription>
          A V1 cobre a Solicitação LME. Avaliação, autorização, número/vigência de APAC e integração produtiva ficam para a próxima etapa.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="new" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="new">Nova solicitação</TabsTrigger>
          <TabsTrigger value="list">Solicitações</TabsTrigger>
          <TabsTrigger value="pending">Pendências</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{editingId ? 'Editar rascunho LME' : 'Nova Solicitação LME'}</CardTitle>
                <p className="text-sm text-muted-foreground">Comece pelo paciente e selecione apenas medicamentos já aptos para LME.</p>
              </div>
              <Button variant="outline" onClick={resetForm}>Novo rascunho</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canWriteLme && (
                <Alert>
                  <AlertDescription>
                    Seu perfil está em modo de acompanhamento. Criação, edição e finalização de LME ficam restritas ao médico.
                  </AlertDescription>
                </Alert>
              )}
              <section className="space-y-3">
                <div className="flex gap-2">
                  <Input value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)} placeholder="Buscar paciente por nome, CPF ou CNS" />
                  <Button variant="outline" onClick={searchPatients}><Search className="mr-2 h-4 w-4" />Buscar</Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => updateField('patientId', patient.id)}
                      className={`rounded-md border p-3 text-left text-sm ${form.patientId === patient.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                    >
                      <div className="font-medium">{patientName(patient)}</div>
                      <div className="text-xs text-muted-foreground">CPF {patient.cpf || 'pendente'} · CNS {patient.cns || 'pendente'}</div>
                    </button>
                  ))}
                </div>
                {selectedPatient && (
                  <Alert>
                    <AlertDescription>
                      Paciente selecionado: {patientName(selectedPatient)}. CPF/CNS são validados pelo backend ao finalizar.
                    </AlertDescription>
                  </Alert>
                )}
              </section>

              <section className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" value={form.requestDate ?? ''} onChange={(event) => updateField('requestDate', event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Peso (kg)</Label>
                  <Input type="number" value={form.weightKg ?? ''} onChange={(event) => updateField('weightKg', Number(event.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Altura (cm)</Label>
                  <Input type="number" value={form.heightCm ?? ''} onChange={(event) => updateField('heightCm', Number(event.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>CID-10 *</Label>
                  <Input value={form.cid10Code ?? ''} onChange={(event) => updateField('cid10Code', event.target.value)} placeholder="Ex: M05.9" />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Diagnóstico *</Label>
                  <Textarea rows={4} value={form.diagnosis ?? ''} onChange={(event) => updateField('diagnosis', event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Anamnese *</Label>
                  <Textarea rows={4} value={form.anamnesis ?? ''} onChange={(event) => updateField('anamnesis', event.target.value)} />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Tratamento prévio</p>
                      <p className="text-xs text-muted-foreground">Se marcado, descreva o histórico.</p>
                    </div>
                    <Switch checked={Boolean(form.previousTreatment)} onCheckedChange={(checked) => updateField('previousTreatment', checked)} />
                  </div>
                  {form.previousTreatment && (
                    <Textarea className="mt-3" rows={3} value={form.previousTreatmentDescription ?? ''} onChange={(event) => updateField('previousTreatmentDescription', event.target.value)} />
                  )}
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Paciente incapaz</p>
                      <p className="text-xs text-muted-foreground">Responsável legal passa a ser obrigatório.</p>
                    </div>
                    <Switch checked={Boolean(form.incapable)} onCheckedChange={(checked) => updateField('incapable', checked)} />
                  </div>
                  {form.incapable && (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <Input value={form.legalResponsibleName ?? ''} onChange={(event) => updateField('legalResponsibleName', event.target.value)} placeholder="Nome do responsável" />
                      <Input value={form.legalResponsibleCpf ?? ''} onChange={(event) => updateField('legalResponsibleCpf', event.target.value)} placeholder="CPF do responsável" />
                    </div>
                  )}
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Preenchedor declarado *</Label>
                  <Select value={form.fillerType ?? 'PATIENT'} onValueChange={(value) => updateField('fillerType', value as LmeFillerType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(fillerLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.fillerType === 'OTHER' && (
                  <>
                    <div className="space-y-1">
                      <Label>Nome do preenchedor</Label>
                      <Input value={form.fillerName ?? ''} onChange={(event) => updateField('fillerName', event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>CPF do preenchedor</Label>
                      <Input value={form.fillerCpf ?? ''} onChange={(event) => updateField('fillerCpf', event.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label>Etnia indígena</Label>
                  <Input value={form.indigenousEthnicity ?? ''} onChange={(event) => updateField('indigenousEthnicity', event.target.value)} placeholder="Se aplicável" />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex gap-2">
                  <Input value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="Buscar medicamento apto para LME" />
                  <Button variant="outline" onClick={searchMedicines}><Search className="mr-2 h-4 w-4" />Buscar</Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {medicines.map((medicine) => (
                    <button key={medicine.id} type="button" onClick={() => addMedication(medicine)} className="rounded-md border p-3 text-left text-sm hover:bg-muted">
                      <div className="font-medium">{medicine.medicineName}</div>
                      <div className="text-xs text-muted-foreground">CATMAT {medicine.catmatCode} · {medicine.strength || medicine.dosageForm || 'sem apresentação'}</div>
                    </button>
                  ))}
                </div>
                {medicines.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Nenhum medicamento apto encontrado. A farmácia precisa vincular CATMAT oficial e marcar aptidão LME antes do médico finalizar a solicitação.
                    </AlertDescription>
                  </Alert>
                )}
              </section>

              <section className="space-y-3">
                <Label>Medicamentos e quantidades por mês</Label>
                <ScrollArea className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicamento</TableHead>
                        {[1, 2, 3, 4, 5, 6].map((month) => <TableHead key={month}>Mês {month}</TableHead>)}
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.medications.map((item) => (
                        <TableRow key={item.medicineId}>
                          <TableCell className="min-w-[220px]">{medicationName(item.medicineId)}</TableCell>
                          {(['month1Quantity', 'month2Quantity', 'month3Quantity', 'month4Quantity', 'month5Quantity', 'month6Quantity'] as const).map((field) => (
                            <TableCell key={field}>
                              <Input className="w-20" type="number" min={0} value={item[field] ?? 0} onChange={(event) => updateMedication(item.medicineId, field, asQuantity(event.target.value))} />
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeMedication(item.medicineId)}><XCircle className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </section>

              <section className="space-y-1">
                <Label>Checklist PCDT / pendências documentais</Label>
                <Textarea rows={4} value={form.pcdtChecklist ?? ''} onChange={(event) => updateField('pcdtChecklist', event.target.value)} placeholder="Exames, laudos e observações que precisam acompanhar a solicitação física." />
              </section>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={save} disabled={saving || !canWriteLme}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar rascunho
                </Button>
                <Button onClick={finalize} disabled={saving || !canWriteLme}>
                  <Send className="mr-2 h-4 w-4" />Finalizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Solicitações LME</CardTitle>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LmeRequestStatus | 'ALL')}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os status</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={loadRequests}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Atualizar</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo para cancelar/substituir" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.patientName}</div>
                        <div className="text-xs text-muted-foreground">CPF {request.patientCpf || 'pendente'} · CNS {request.patientCns || 'pendente'}</div>
                      </TableCell>
                      <TableCell>{request.doctorName || '—'}</TableCell>
                      <TableCell><Badge variant={request.status === 'CANCELLED' ? 'destructive' : 'outline'}>{statusLabels[request.status]}</Badge></TableCell>
                      <TableCell>{request.requestDate || request.createdAt?.slice(0, 10)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {request.status === 'DRAFT' && canWriteLme && <Button size="sm" variant="outline" onClick={() => editRequest(request)}>Editar</Button>}
                          {request.status !== 'DRAFT' && request.status !== 'CANCELLED' && canPrintLme && <Button size="sm" variant="outline" onClick={() => downloadPdf(request)}><Download className="mr-1 h-3 w-3" />PDF</Button>}
                          {(request.status === 'FINALIZED' || request.status === 'PRINTED') && canPrintLme && <Button size="sm" variant="outline" onClick={() => lmeService.markPrinted(request.id).then(loadRequests)}><Printer className="mr-1 h-3 w-3" />Impresso</Button>}
                          {(request.status === 'FINALIZED' || request.status === 'PRINTED') && canWriteLme && <Button size="sm" variant="outline" onClick={() => replaceRequest(request)}><Plus className="mr-1 h-3 w-3" />Substituir</Button>}
                          {request.status !== 'CANCELLED' && request.status !== 'REPLACED' && canCancelLme && <Button size="sm" variant="destructive" onClick={() => cancelRequest(request)}>Cancelar</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pendências operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Medicamento em texto livre não finaliza LME. Use somente itens cadastrados, ativos, com CATMAT oficial e aptidão LME marcada pela farmácia.</p>
              <p>Paciente precisa ter CPF ou CNS válido; médico precisa ter CNS válido; unidade precisa ter CNES válido.</p>
              <p>Paciente indígena exige etnia; paciente incapaz exige responsável legal; preenchedor “Outro” exige nome e CPF válido.</p>
              <p>O PDF atual é funcional para impressão interna. O layout fiel ao formulário oficial LME 2026 será uma fatia separada.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

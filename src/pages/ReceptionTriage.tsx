import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  UserPlus,
  AlertTriangle,
  Stethoscope,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ReceptionQueueList } from "@/components/reception/ReceptionQueueList";
import { PatientRegistrationForm } from "@/components/reception/PatientRegistrationForm";
import { EmergencyBypassDialog } from "@/components/attendance/EmergencyBypassDialog";
import receptionService from "@/services/receptionService";
import attendanceService from "@/services/attendanceService";
import { patientService } from "@/services/patientService";
import { triageService } from "@/services/triageService";
import { useCapabilities } from "@/auth/useCapabilities";
import { usePermissions } from "@/auth/permissions";
import type { ReceptionPatientListItem, ReceptionQueueItem } from "@/types/reception";
import type { Patient } from "@/types/patient";
import type { ManchesterColor } from "@/types/triage";
import { toast } from "sonner";

const MANCHESTER_OPTIONS: { value: ManchesterColor; label: string; color: string }[] = [
  { value: "RED", label: "Emergência", color: "bg-red-500" },
  { value: "ORANGE", label: "Muito Urgente", color: "bg-orange-500" },
  { value: "YELLOW", label: "Urgente", color: "bg-yellow-500" },
  { value: "GREEN", label: "Pouco Urgente", color: "bg-green-500" },
  { value: "BLUE", label: "Não Urgente", color: "bg-blue-500" },
];

export default function ReceptionTriage() {
  const capabilities = useCapabilities();
  const permissions = usePermissions();
  const canRegisterClinicalTriage = permissions.can({
    resource: "TRIAGEM",
    action: "START",
    context: { sector: "URGENCIA", duty: "ACTIVE" },
  });

  // Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ReceptionPatientListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fila
  const [queueItems, setQueueItems] = useState<ReceptionQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Dialogs
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isBypassOpen, setIsBypassOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form atendimento + triagem
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [glasgow, setGlasgow] = useState("15");
  const [vitalErrors, setVitalErrors] = useState<Record<string, string>>({});

  const validateVital = (field: string, value: string, min: number, max: number, label: string) => {
    if (!value) { setVitalErrors(p => { const n = {...p}; delete n[field]; return n; }); return; }
    const n = parseFloat(value);
    if (isNaN(n) || n < min || n > max) {
      setVitalErrors(p => ({ ...p, [field]: `${label}: ${min}–${max}` }));
    } else {
      setVitalErrors(p => { const n2 = {...p}; delete n2[field]; return n2; });
    }
  };
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [hgt, setHgt] = useState("");
  const [manchesterColor, setManchesterColor] = useState<ManchesterColor | "">("");
  const [suggestedColor, setSuggestedColor] = useState<ManchesterColor | "">("");
  const [triageJustification, setTriageJustification] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setChiefComplaint("");
    setVitalsOpen(false);
    setBp("");
    setHr("");
    setRr("");
    setTemp("");
    setSpo2("");
    setGlasgow("15");
    setWeight("");
    setHeight("");
    setHgt("");
    setManchesterColor("");
    setSuggestedColor("");
    setTriageJustification("");
    setOverrideReason("");
  };

  // Carrega fila
  const loadQueue = useCallback(async () => {
    try {
      const data = await receptionService.listTriageBoard();
      setQueueItems(data);
    } catch (error) {
      console.error("Erro ao carregar fila:", error);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  // Busca
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const result = await receptionService.listPatients({ query: q, size: 10 });
      setSearchResults(result.content);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Abrir dialog de atendimento
  const handleOpenAttendance = async (item: ReceptionPatientListItem) => {
    try {
      const patient = await patientService.getById(item.patientId);
      setSelectedPatient(patient);
      resetForm();
      setVitalsOpen(canRegisterClinicalTriage);
      setIsAttendanceOpen(true);
    } catch {
      toast.error("Erro ao carregar dados do paciente.");
    }
  };

  // Emergencia
  const handleEmergency = async (item: ReceptionPatientListItem) => {
    try {
      const patient = await patientService.getById(item.patientId);
      setSelectedPatient(patient);
      setIsBypassOpen(true);
    } catch {
      toast.error("Erro ao carregar dados do paciente.");
    }
  };

  // Sugestao Manchester
  const handleSuggestColor = async () => {
    if (!bp || !hr || !glasgow) return;
    try {
      const suggestion = await triageService.suggest({
        vitalSigns: {
          bloodPressure: bp,
          heartRate: parseInt(hr),
          respiratoryRate: rr ? parseInt(rr) : undefined,
          temperature: temp ? parseFloat(temp) : undefined,
          oxygenSaturation: spo2 ? parseInt(spo2) : undefined,
          glasgowComaScale: parseInt(glasgow),
        },
      });
      setManchesterColor(suggestion.suggestedColor);
      setSuggestedColor(suggestion.suggestedColor);
      setOverrideReason("");
      setTriageJustification(suggestion.justification);
    } catch {
      // Sugestao falhou - usuario escolhe manualmente
    }
  };

  // Submeter atendimento (+ triagem quando sinais vitais abertos)
  const handleSubmitAttendance = async () => {
    if (!selectedPatient || !chiefComplaint.trim()) return;

    // Se sinais vitais abertos, validar TODOS os 8 campos obrigatorios
    if (vitalsOpen) {
      if (Object.keys(vitalErrors).length > 0) {
        toast.error("Corrija os valores fora do intervalo antes de continuar.");
        return;
      }
      const missing: string[] = [];
      if (!bp) missing.push("PA");
      if (!hr) missing.push("FC");
      if (!rr) missing.push("FR");
      if (!temp) missing.push("Temperatura");
      if (!spo2) missing.push("SPO2");
      if (!weight) missing.push("Peso");
      if (!height) missing.push("Estatura");
      if (!hgt) missing.push("HGT");
      if (!manchesterColor) missing.push("Classificação Manchester");
      if (suggestedColor && manchesterColor && suggestedColor !== manchesterColor && !overrideReason.trim()) {
        missing.push("Motivo da alteração da classificação");
      }
      if (missing.length > 0) {
        toast.error(`Preencha os campos obrigatórios: ${missing.join(", ")}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Cria atendimento
      const attendance = await attendanceService.create({
        patientId: selectedPatient.id,
        visitType: "URGENCIA",
        chiefComplaint: chiefComplaint.trim(),
      });

      // 2. Se sinais vitais abertos e preenchidos, registra triagem
      const hasVitals = vitalsOpen && bp && hr && manchesterColor;
      if (hasVitals) {
        try {
          await triageService.registerTriage(attendance.id, {
            vitalSigns: {
              bloodPressure: bp,
              heartRate: parseInt(hr),
              respiratoryRate: rr ? parseInt(rr) : undefined,
              temperature: temp ? parseFloat(temp) : undefined,
              oxygenSaturation: spo2 ? parseInt(spo2) : undefined,
              glasgowComaScale: parseInt(glasgow),
              weight: weight ? parseFloat(weight) : undefined,
              height: height ? parseFloat(height) : undefined,
              bloodGlucose: hgt ? parseInt(hgt) : undefined,
            },
            triageColor: manchesterColor as ManchesterColor,
            triageJustification: triageJustification || `Classificação ${manchesterColor} definida na recepção`,
            // Sempre envia overrideReason para satisfazer validação do backend quando cor difere da sugestão
            overrideReason: overrideReason || "Classificação definida pelo profissional de saúde na recepção",
          });
          toast.success("Atendimento criado e triagem registrada.");
        } catch (triageError: any) {
          const triageMsg = triageError?.response?.data?.message || "Erro na triagem";
          toast.warning(`Atendimento criado, mas triagem falhou: ${triageMsg}. Classifique pelo board de triagem.`, { duration: 8000 });
        }
      } else {
        toast.success("Atendimento criado. Paciente aguardando triagem.");
      }

      resetForm();
      setIsAttendanceOpen(false);
      setSelectedPatient(null);
      await loadQueue();
      if (hasSearched) await handleSearch();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao criar atendimento.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Cadastrar paciente → abre atendimento automaticamente
  const handleRegisterPatient = async (data: any) => {
    try {
      const patient = await patientService.create(data);
      toast.success("Paciente cadastrado. Preencha a queixa para abrir o atendimento.");
      setIsRegisterOpen(false);

      // Abre dialog de atendimento automaticamente com o paciente recem criado
      setSelectedPatient(patient);
      resetForm();
      setVitalsOpen(canRegisterClinicalTriage);
      setIsAttendanceOpen(true);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao cadastrar paciente.";
      toast.error(msg);
      throw error;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Recepção</h1>
          <p className="text-sm text-muted-foreground">
            Registrar entrada, localizar paciente e abrir atendimento
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { loadQueue(); if (hasSearched) handleSearch(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Busca + Cadastro */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome, CPF ou cartão SUS..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  // Auto-busca quando digitar CPF (11+) ou CNS (15)
                  const digits = val.replace(/\D/g, "");
                  if (digits.length >= 11) {
                    setSearching(true);
                    setHasSearched(true);
                    receptionService.listPatients({ query: digits, size: 10 })
                      .then((r) => setSearchResults(r.content))
                      .catch(() => setSearchResults([]))
                      .finally(() => setSearching(false));
                  }
                }}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 sm:flex-none" onClick={handleSearch} disabled={searching || searchQuery.trim().length < 2}>
                {searching ? "Buscando..." : "Buscar"}
              </Button>
              <Button className="flex-1 sm:flex-none" variant="outline" onClick={() => setIsRegisterOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Novo Atendimento</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados da busca */}
      {hasSearched && (
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <h3 className="text-lg font-semibold mb-3">
              Resultados ({searchResults.length})
            </h3>
            {searchResults.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum paciente encontrado. Cadastre um novo paciente acima.
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((item) => (
                  <div
                    key={item.patientId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                        {item.patientName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.patientName}</p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <span className="font-mono">{item.patientCode}</span>
                          <span>{new Date(item.dateOfBirth).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-13 sm:ml-0">
                      {item.inAttendance ? (
                        <Badge variant="secondary">Atendimento ativo</Badge>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => handleOpenAttendance(item)}>
                            <Stethoscope className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Abrir Atendimento</span>
                            <span className="sm:hidden">Atender</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => handleEmergency(item)}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            <span className="hidden sm:inline">Emergência</span>
                            <span className="sm:hidden">Urg.</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fila de Triagem */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Fila de Triagem
          {queueItems.length > 0 && (
            <Badge variant="outline" className="ml-2">{queueItems.length}</Badge>
          )}
        </h2>
        {loadingQueue ? (
          <p className="text-muted-foreground">Carregando fila...</p>
        ) : (
          <ReceptionQueueList
            title="Aguardando triagem"
            items={queueItems}
            emptyMessage="Nenhum paciente na fila de triagem."
          />
        )}
      </div>

      {/* Dialog: Cadastro */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
            <DialogDescription>Cadastre o paciente para abrir um novo atendimento.</DialogDescription>
          </DialogHeader>
          <PatientRegistrationForm
            onSubmit={handleRegisterPatient}
            onCancel={() => setIsRegisterOpen(false)}
            onExistingPatient={(patient) => {
              setIsRegisterOpen(false);
              setSelectedPatient(patient);
              resetForm();
              setVitalsOpen(canRegisterClinicalTriage);
              setIsAttendanceOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Atendimento + Triagem Unificado */}
      <Dialog open={isAttendanceOpen} onOpenChange={(open) => {
        setIsAttendanceOpen(open);
        if (!open) { setSelectedPatient(null); resetForm(); }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Abrir Atendimento
            </DialogTitle>
            <DialogDescription>
              Preencha a queixa e, opcionalmente, os sinais vitais para triagem imediata.
            </DialogDescription>
          </DialogHeader>

          {/* Dados do paciente */}
          {selectedPatient && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Paciente</p>
                    <p className="font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Código</p>
                    <p className="font-mono font-semibold">{selectedPatient.patientCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {/* Queixa principal */}
            <div>
              <Label htmlFor="complaint">Queixa principal *</Label>
              <Textarea
                id="complaint"
                placeholder="Ex: Dor abdominal há 2 dias, febre..."
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
              />
            </div>

            {/* Sinais Vitais (colapsavel) */}
            {canRegisterClinicalTriage && (
            <Collapsible open={vitalsOpen} onOpenChange={setVitalsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" type="button">
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Sinais Vitais + Triagem
                    {!vitalsOpen && <span className="text-xs text-muted-foreground">(opcional)</span>}
                  </span>
                  <ChevronRight className={`h-4 w-4 transition-transform ${vitalsOpen ? "rotate-90" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Sinais vitais - grid responsivo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor="bp">PA *</Label>
                    <Input id="bp" placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="hr">FC (bpm) *</Label>
                    <Input id="hr" type="number" min="20" max="250" placeholder="80" value={hr}
                      onChange={(e) => { setHr(e.target.value); validateVital('hr', e.target.value, 20, 250, 'FC'); }}
                      className={vitalErrors.hr ? 'border-destructive' : ''} />
                    {vitalErrors.hr && <p className="text-xs text-destructive mt-1">{vitalErrors.hr}</p>}
                  </div>
                  <div>
                    <Label htmlFor="rr">FR (irpm) *</Label>
                    <Input id="rr" type="number" min="5" max="80" placeholder="16" value={rr} onChange={(e) => setRr(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="temp">T°C *</Label>
                    <Input id="temp" type="number" step="0.1" min="32" max="43" placeholder="36.5" value={temp}
                      onChange={(e) => { setTemp(e.target.value); validateVital('temp', e.target.value, 32, 43, 'Temp'); }}
                      className={vitalErrors.temp ? 'border-destructive' : ''} />
                    {vitalErrors.temp && <p className="text-xs text-destructive mt-1">{vitalErrors.temp}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label htmlFor="spo2">SPO2 (%) *</Label>
                    <Input id="spo2" type="number" min="50" max="100" placeholder="98" value={spo2}
                      onChange={(e) => { setSpo2(e.target.value); validateVital('spo2', e.target.value, 50, 100, 'SpO₂'); }}
                      className={vitalErrors.spo2 ? 'border-destructive' : ''} />
                    {vitalErrors.spo2 && <p className="text-xs text-destructive mt-1">{vitalErrors.spo2}</p>}
                  </div>
                  <div>
                    <Label htmlFor="weight">Peso (kg) *</Label>
                    <Input id="weight" type="number" step="0.1" min="0" max="500" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="height">Estatura (cm) *</Label>
                    <Input id="height" type="number" min="20" max="250" placeholder="170" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="hgt">HGT (mg/dL) *</Label>
                    <Input id="hgt" type="number" min="0" max="1000" placeholder="100" value={hgt} onChange={(e) => setHgt(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="glasgow">Glasgow</Label>
                    <Input id="glasgow" type="number" min="3" max="15" value={glasgow} onChange={(e) => setGlasgow(e.target.value)} />
                  </div>
                </div>

                {/* Classificacao Manchester */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Classificação Manchester</Label>
                    {bp && hr && glasgow && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleSuggestColor}>
                        Sugerir cor
                      </Button>
                    )}
                  </div>
                  <Select value={manchesterColor} onValueChange={(v) => setManchesterColor(v as ManchesterColor)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classificação" />
                    </SelectTrigger>
                    <SelectContent>
                      {MANCHESTER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${opt.color}`} />
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {manchesterColor && (
                    <div>
                      <Label htmlFor="justification">Justificativa</Label>
                      <Textarea
                        id="justification"
                        placeholder="Justificativa da classificação..."
                        rows={2}
                        value={triageJustification}
                        onChange={(e) => setTriageJustification(e.target.value)}
                      />
                    </div>
                  )}

                  {suggestedColor && manchesterColor && suggestedColor !== manchesterColor && (
                    <div>
                      <Label htmlFor="overrideReason">
                        Motivo da alteração <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="overrideReason"
                        placeholder="Justifique por que a classificação difere da sugestão do sistema..."
                        rows={2}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttendanceOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAttendance}
              disabled={submitting || !chiefComplaint.trim()}
            >
              {submitting ? "Criando..." : vitalsOpen && manchesterColor ? "Criar Atendimento + Triagem" : "Criar Atendimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Emergência */}
      <EmergencyBypassDialog
        patient={selectedPatient}
        open={isBypassOpen}
        onOpenChange={(open) => {
          setIsBypassOpen(open);
          if (!open) setSelectedPatient(null);
        }}
        onSuccess={() => { loadQueue(); if (hasSearched) handleSearch(); }}
      />
    </div>
  );
}

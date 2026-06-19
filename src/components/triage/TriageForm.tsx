/**
 * TriageForm Component - Épico B
 * Form for registering vital signs and Manchester classification
 *
 * Requirements (ENENHARIA.md linha 147):
 * - PA, FC, Glasgow são obrigatórios
 * - FR, Temp, SpO2 são opcionais
 * - Manchester color + justificativa obrigatórios
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VitalSigns,
  ManchesterColor,
  TriageRegisterRequest,
  MANCHESTER_COLORS,
  validateVitalSigns,
  TriageDiscriminators,
  TriageComplaintCategory,
} from '@/types/triage';
import { triageService } from '@/services/triageService';
import { AlertCircle, Heart, Activity, Thermometer, Wind, Droplet, Brain } from 'lucide-react';
import { DemoAutofillButton } from '@/demo/DemoAutofillButton';
import { getDemoRunId } from '@/demo/demoMode';
import { getTriageExample } from '@/demo/demoFixtures';

interface TriageFormProps {
  visitId: string;
  patientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Valida range e retorna mensagem de erro ou null
function validateRange(value: string, min: number, max: number, label: string): string | null {
  if (value === '') return null;
  const n = parseFloat(value);
  if (isNaN(n)) return `${label}: valor inválido`;
  if (n < min || n > max) return `${label}: deve estar entre ${min} e ${max}`;
  return null;
}

export function TriageForm({ visitId, patientName, onSuccess, onCancel }: TriageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});

  const setFieldError = (field: string, msg: string | null) =>
    setFieldErrors(prev => ({ ...prev, [field]: msg }));

  // Vital Signs State
  const [bloodPressureSys, setBloodPressureSys] = useState('');
  const [bloodPressureDia, setBloodPressureDia] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [glasgow, setGlasgow] = useState('');

  // Queixa e discriminadores
  const [complaintCategory, setComplaintCategory] = useState<TriageComplaintCategory | ''>('');
  const [complaintText, setComplaintText] = useState('');
  const [painScore, setPainScore] = useState('');
  const [discriminators, setDiscriminators] = useState<TriageDiscriminators>({
    cardiacArrest: false,
    activeSeizure: false,
    severeBleeding: false,
    severeTrauma: false,
    chestPain: false,
    strokeSymptoms: false,
    shortnessOfBreath: false,
    immunosuppressed: false,
    pregnant: false,
    severePain: false,
    moderatePain: false,
    highFeverImmunosuppressed: false,
  });

  // Manchester Classification State
  const [triageColor, setTriageColor] = useState<ManchesterColor | ''>('');
  const [triageJustification, setTriageJustification] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [userSelectedColor, setUserSelectedColor] = useState(false);

  const [suggestedColorBackend, setSuggestedColorBackend] = useState<ManchesterColor | null>(null);
  const [suggestionJustification, setSuggestionJustification] = useState<string | null>(null);
  const [suggestedPhysiologyScore, setSuggestedPhysiologyScore] = useState<number | null>(null);
  const [suggestedAgeGroup, setSuggestedAgeGroup] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleFillExample = () => {
    const example = getTriageExample(getDemoRunId()).data;
    setError(null);
    setSuggestionError(null);
    setFieldErrors({});
    setBloodPressureSys(example.bloodPressureSys);
    setBloodPressureDia(example.bloodPressureDia);
    setHeartRate(example.heartRate);
    setRespiratoryRate(example.respiratoryRate);
    setTemperature(example.temperature);
    setOxygenSaturation(example.oxygenSaturation);
    setBloodGlucose(example.bloodGlucose);
    setWeight(example.weight);
    setHeight(example.height);
    setGlasgow(example.glasgow);
    setComplaintCategory(example.complaintCategory);
    setComplaintText(example.complaintText);
    setPainScore(example.painScale);
    setDiscriminators((prev) => ({
      ...prev,
      moderatePain: true,
      severePain: false,
      chestPain: false,
      shortnessOfBreath: false,
    }));
    setTriageColor(example.manchesterColor);
    setSuggestedColorBackend(example.manchesterColor);
    setSuggestionJustification(example.notes);
    setTriageJustification(example.notes);
    setOverrideReason(example.overrideReason);
    setUserSelectedColor(true);
  };

  const hasMandatoryVitals =
    bloodPressureSys.trim() !== '' &&
    bloodPressureDia.trim() !== '' &&
    heartRate.trim() !== '' &&
    glasgow.trim() !== '';

  const hasManchesterSelection = Boolean(triageColor) && triageJustification.trim().length >= 10;

  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const isFormValid = hasMandatoryVitals && hasManchesterSelection && !hasFieldErrors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Build vital signs object
    const vitalSigns: VitalSigns = {
      bloodPressure: `${bloodPressureSys}/${bloodPressureDia}`,
      heartRate: parseInt(heartRate),
      glasgowComaScale: parseInt(glasgow),
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
      temperature: temperature ? parseFloat(temperature) : undefined,
      oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
      bloodGlucose: bloodGlucose ? parseInt(bloodGlucose) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
    };

    // Frontend validation
    const validationErrors = validateVitalSigns(vitalSigns);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '));
      return;
    }

    // Manchester validation
    if (!triageColor) {
      setError('Classificação Manchester é obrigatória');
      return;
    }

    if (!triageJustification || triageJustification.trim().length < 10) {
      setError('Justificativa deve ter no mínimo 10 caracteres');
      return;
    }

    if (suggestedColorBackend && triageColor !== suggestedColorBackend) {
      if (!overrideReason || overrideReason.trim().length < 5) {
        setError('Justificativa de override é obrigatória quando a cor difere da sugestão.');
        return;
      }
    }

    // Build request
    const request: TriageRegisterRequest = {
      vitalSigns,
      complaintCategory: complaintCategory || undefined,
      complaintText: complaintText.trim() || undefined,
      painScore: painScore ? parseInt(painScore) : undefined,
      discriminators,
      triageColor,
      triageJustification: triageJustification.trim(),
      overrideReason: overrideReason.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await triageService.registerTriage(visitId, request);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao registrar triagem');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suggest Manchester color based on vital signs (helper)
  const getSuggestedColor = (): ManchesterColor | null => {
    const g = parseInt(glasgow);
    const spo2 = oxygenSaturation ? parseInt(oxygenSaturation) : null;
    const hr = heartRate ? parseInt(heartRate) : null;
    const sys = bloodPressureSys ? parseInt(bloodPressureSys) : null;

    // Coma / TCE grave
    if (g && g <= 8) return 'RED';

    // Hipoxemia severa
    if (spo2 && spo2 < 85) return 'RED';

    // Bradicardia/Taquicardia severa
    if (hr && (hr < 40 || hr > 150)) return 'RED';

    // Choque
    if (sys && sys < 80) return 'RED';

    // Sinais de alerta (laranja)
    if (spo2 && spo2 < 90) return 'ORANGE';
    if (hr && (hr < 50 || hr > 120)) return 'ORANGE';

    return null;
  };

  const suggestedColor = getSuggestedColor();

  // Sugestão automática no backend (fonte de verdade)
  useEffect(() => {
    const controller = new AbortController();
    const shouldSuggest =
      bloodPressureSys && bloodPressureDia && heartRate && glasgow;

    if (!shouldSuggest) {
      setSuggestedColorBackend(null);
      setSuggestionJustification(null);
      setSuggestedPhysiologyScore(null);
      setSuggestedAgeGroup(null);
      return () => controller.abort();
    }

    const timeout = setTimeout(async () => {
      setIsSuggesting(true);
      setSuggestionError(null);

      const vitalSigns: VitalSigns = {
        bloodPressure: `${bloodPressureSys}/${bloodPressureDia}`,
        heartRate: parseInt(heartRate),
        glasgowComaScale: parseInt(glasgow),
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : undefined,
      };

      try {
        const response = await triageService.suggestForVisit(
          visitId,
          {
            vitalSigns,
            complaintCategory: complaintCategory || undefined,
            complaintText: complaintText.trim() || undefined,
            painScore: painScore ? parseInt(painScore) : undefined,
            discriminators,
          },
          { signal: controller.signal }
        );

        setSuggestedColorBackend(response.suggestedColor);
        setSuggestionJustification(response.justification);
        setSuggestedPhysiologyScore(response.physiologyScore ?? null);
        setSuggestedAgeGroup(response.ageGroup ?? null);

        // Preenche cor se o usuário ainda não escolheu manualmente
        if (!userSelectedColor) {
          setTriageColor(response.suggestedColor);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSuggestionError(err.message || 'Não foi possível sugerir a cor automaticamente.');
        }
      } finally {
        setIsSuggesting(false);
      }
    }, 400); // debounce para evitar chamadas em excesso

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [
    bloodPressureSys,
    bloodPressureDia,
    heartRate,
    respiratoryRate,
    temperature,
    oxygenSaturation,
    bloodGlucose,
    weight,
    height,
    glasgow,
    complaintCategory,
    complaintText,
    painScore,
    discriminators,
    userSelectedColor,
    visitId,
  ]);

  // Sugestão simples (frontend) como fallback visual
  useEffect(() => {
    if (!triageColor && suggestedColor) {
      setTriageColor(suggestedColor);
    }
  }, [suggestedColor, triageColor]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Triagem Manchester - {patientName}</CardTitle>
          <DemoAutofillButton
            onFill={handleFillExample}
            aria-label="Preencher exemplo de triagem"
          />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Vital Signs Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sinais Vitais</h3>

            {/* Blood Pressure (OBRIGATÓRIO) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bp-sys" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  PA Sistólica (mmHg) *
                </Label>
                <Input
                  id="bp-sys"
                  type="number"
                  value={bloodPressureSys}
                  onChange={(e) => setBloodPressureSys(e.target.value)}
                  placeholder="120"
                  required
                  min="50"
                  max="250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-dia" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  PA Diastólica (mmHg) *
                </Label>
                <Input
                  id="bp-dia"
                  type="number"
                  value={bloodPressureDia}
                  onChange={(e) => setBloodPressureDia(e.target.value)}
                  placeholder="80"
                  required
                  min="30"
                  max="150"
                />
              </div>
            </div>

            {/* Heart Rate (OBRIGATÓRIO) */}
            <div className="space-y-2">
              <Label htmlFor="hr" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                Frequência Cardíaca (bpm) *
              </Label>
              <Input
                id="hr"
                type="number"
                value={heartRate}
                onChange={(e) => {
                  setHeartRate(e.target.value);
                  setFieldError('hr', validateRange(e.target.value, 20, 250, 'FC'));
                }}
                placeholder="72"
                required
                min="20"
                max="250"
                className={fieldErrors.hr ? 'border-destructive' : ''}
              />
              {fieldErrors.hr && <p className="text-xs text-destructive">{fieldErrors.hr}</p>}
            </div>

            {/* Glasgow (OBRIGATÓRIO) */}
            <div className="space-y-2">
              <Label htmlFor="glasgow" className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-red-500" />
                Escala de Coma de Glasgow (3-15) *
              </Label>
              <Input
                id="glasgow"
                type="number"
                value={glasgow}
                onChange={(e) => {
                  setGlasgow(e.target.value);
                  setFieldError('glasgow', validateRange(e.target.value, 3, 15, 'Glasgow'));
                }}
                placeholder="15"
                required
                min="3"
                max="15"
                className={fieldErrors.glasgow ? 'border-destructive' : ''}
              />
              {fieldErrors.glasgow
                ? <p className="text-xs text-destructive">{fieldErrors.glasgow}</p>
                : <p className="text-sm text-gray-500">15 = Totalmente consciente | 3-8 = Coma</p>
              }
            </div>

            {/* Respiratory Rate (OPCIONAL) */}
            <div className="space-y-2">
              <Label htmlFor="rr" className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Frequência Respiratória (irpm)
              </Label>
              <Input
                id="rr"
                type="number"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(e.target.value)}
                placeholder="16"
                min="5"
                max="60"
              />
            </div>

            {/* Temperature (OPCIONAL) */}
            <div className="space-y-2">
              <Label htmlFor="temp" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Temperatura (°C)
              </Label>
              <Input
                id="temp"
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => {
                  setTemperature(e.target.value);
                  setFieldError('temp', validateRange(e.target.value, 32, 43, 'Temperatura'));
                }}
                placeholder="36.5"
                min="32"
                max="43"
                className={fieldErrors.temp ? 'border-destructive' : ''}
              />
              {fieldErrors.temp && <p className="text-xs text-destructive">{fieldErrors.temp}</p>}
            </div>

            {/* Oxygen Saturation (OPCIONAL) */}
            <div className="space-y-2">
              <Label htmlFor="spo2" className="flex items-center gap-2">
                <Droplet className="h-4 w-4" />
                SpO₂ (%)
              </Label>
              <Input
                id="spo2"
                type="number"
                value={oxygenSaturation}
                onChange={(e) => {
                  setOxygenSaturation(e.target.value);
                  setFieldError('spo2', validateRange(e.target.value, 50, 100, 'SpO₂'));
                }}
                placeholder="98"
                min="50"
                max="100"
                className={fieldErrors.spo2 ? 'border-destructive' : ''}
              />
              {fieldErrors.spo2 && <p className="text-xs text-destructive">{fieldErrors.spo2}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodGlucose" className="flex items-center gap-2">
                  <Droplet className="h-4 w-4" />
                  Glicemia capilar (mg/dL)
                </Label>
                <Input
                  id="bloodGlucose"
                  type="number"
                  value={bloodGlucose}
                  onChange={(e) => {
                    setBloodGlucose(e.target.value);
                    setFieldError('bloodGlucose', validateRange(e.target.value, 20, 600, 'Glicemia'));
                  }}
                  placeholder="100"
                  min="20"
                  max="600"
                  className={fieldErrors.bloodGlucose ? 'border-destructive' : ''}
                />
                {fieldErrors.bloodGlucose && <p className="text-xs text-destructive">{fieldErrors.bloodGlucose}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Peso (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    setFieldError('weight', validateRange(e.target.value, 1, 300, 'Peso'));
                  }}
                  placeholder="70"
                  min="1"
                  max="300"
                  className={fieldErrors.weight ? 'border-destructive' : ''}
                />
                {fieldErrors.weight && <p className="text-xs text-destructive">{fieldErrors.weight}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Altura (cm)
                </Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    setFieldError('height', validateRange(e.target.value, 30, 250, 'Altura'));
                  }}
                  placeholder="170"
                  min="30"
                  max="250"
                  className={fieldErrors.height ? 'border-destructive' : ''}
                />
                {fieldErrors.height && <p className="text-xs text-destructive">{fieldErrors.height}</p>}
              </div>
            </div>
          </div>

          {/* Manchester Classification Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Classificação Manchester</h3>

            {/* Complaint Category */}
            <div className="space-y-2">
              <Label htmlFor="complaintCategory">Categoria da queixa</Label>
              <Select
                value={complaintCategory}
                onValueChange={(value) => setComplaintCategory(value as TriageComplaintCategory)}
              >
                <SelectTrigger id="complaintCategory">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHEST_PAIN">Dor torácica</SelectItem>
                  <SelectItem value="DYSPNEA">Dispneia</SelectItem>
                  <SelectItem value="FEVER">Febre</SelectItem>
                  <SelectItem value="TRAUMA">Trauma</SelectItem>
                  <SelectItem value="NEURO">Neurológico</SelectItem>
                  <SelectItem value="ABDOMINAL">Dor abdominal</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Complaint Text */}
            <div className="space-y-2">
              <Label htmlFor="complaintText">Queixa principal (opcional)</Label>
              <Input
                id="complaintText"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Ex: Dor torácica, falta de ar, trauma..."
              />
            </div>

            {/* Pain Score */}
            <div className="space-y-2">
              <Label htmlFor="painScore">Escala de dor (0-10)</Label>
              <Input
                id="painScore"
                type="number"
                value={painScore}
                onChange={(e) => setPainScore(e.target.value)}
                min="0"
                max="10"
                placeholder="0"
              />
            </div>

            {/* Discriminators */}
            <div className="space-y-2">
              <Label>Discriminadores clínicos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'cardiacArrest', label: 'Parada cardiorrespiratória' },
                  { key: 'activeSeizure', label: 'Convulsão ativa' },
                  { key: 'severeBleeding', label: 'Hemorragia grave' },
                  { key: 'severeTrauma', label: 'Trauma grave / politrauma' },
                  { key: 'strokeSymptoms', label: 'Sinais de AVC agudo' },
                  { key: 'chestPain', label: 'Dor torácica típica' },
                  { key: 'shortnessOfBreath', label: 'Dispneia' },
                  { key: 'immunosuppressed', label: 'Imunossuprimido' },
                  { key: 'pregnant', label: 'Gestante' },
                  { key: 'severePain', label: 'Dor intensa (EVA ≥ 8)' },
                  { key: 'moderatePain', label: 'Dor moderada (EVA 6-7)' },
                  { key: 'highFeverImmunosuppressed', label: 'Febre > 39°C imunossuprimido' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={item.key}
                      checked={(discriminators as any)[item.key]}
                      onCheckedChange={(checked) =>
                        setDiscriminators((prev) => ({
                          ...prev,
                          [item.key]: Boolean(checked),
                        }))
                      }
                    />
                    <Label htmlFor={item.key} className="text-sm">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Color Alert */}
            {(suggestedColorBackend || suggestedColor) && (
              <Alert variant={suggestionError ? 'destructive' : 'default'}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {suggestionError && <span>{suggestionError}</span>}
                  {!suggestionError && (
                    <>
                      <strong>Sugestão automática:</strong>{' '}
                      <strong
                        className={
                          suggestedColorBackend
                            ? MANCHESTER_COLORS[suggestedColorBackend].textColor
                            : MANCHESTER_COLORS[suggestedColor!].textColor
                        }
                      >
                        {suggestedColorBackend
                          ? MANCHESTER_COLORS[suggestedColorBackend].label
                          : suggestedColor
                          ? MANCHESTER_COLORS[suggestedColor].label
                          : '—'}
                      </strong>{' '}
                      {isSuggesting ? '(calculando...)' : '(pré-selecionada, ajuste se necessário)'}
                      {suggestionJustification && <div>{suggestionJustification}</div>}
                      {(suggestedPhysiologyScore !== null || suggestedAgeGroup) && (
                        <div className="text-xs text-muted-foreground">
                          {suggestedPhysiologyScore !== null && (
                            <span>Score fisiológico: {suggestedPhysiologyScore} </span>
                          )}
                          {suggestedAgeGroup && <span>({suggestedAgeGroup})</span>}
                        </div>
                      )}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Manchester Color Selector */}
            <div className="space-y-2">
              <Label htmlFor="color">Cor de Classificação *</Label>
              <Select
                value={triageColor}
                onValueChange={(value) => {
                  setUserSelectedColor(true);
                  setTriageColor(value as ManchesterColor);
                }}
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder="Selecione a cor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MANCHESTER_COLORS).map((info) => (
                    <SelectItem key={info.color} value={info.color}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${info.bgColor}`} />
                        <span>{info.label}</span>
                        <span className="text-sm text-gray-500">
                          ({info.maxWaitTime === 0 ? 'Imediato' : `${info.maxWaitTime}min`})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Justification */}
            <div className="space-y-2">
              <Label htmlFor="justification">Justificativa *</Label>
              <Textarea
                id="justification"
                value={triageJustification}
                onChange={(e) => setTriageJustification(e.target.value)}
                placeholder="Descreva os motivos para a classificação escolhida (mínimo 10 caracteres)"
                required
                rows={4}
                minLength={10}
              />
              <p className="text-sm text-gray-500">
                {triageJustification.length}/10 caracteres mínimos
              </p>
            </div>

            {/* Override Reason */}
            {suggestedColorBackend && triageColor && triageColor !== suggestedColorBackend && (
              <div className="space-y-2">
                <Label htmlFor="overrideReason">Justificativa de override *</Label>
                <Textarea
                  id="overrideReason"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explique por que a cor foi diferente da sugestão."
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  Obrigatório — mínimo 5 caracteres.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isFormValid && (
            <p className="text-sm text-muted-foreground">
              Preencha os sinais vitais obrigatórios, a cor de Manchester e a justificativa para habilitar o envio.
            </p>
          )}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="flex-1"
            >
              {isSubmitting ? 'Salvando...' : 'Registrar Triagem'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

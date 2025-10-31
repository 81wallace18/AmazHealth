/**
 * TriageForm Component - Épico B
 * Form for registering vital signs and Manchester classification
 *
 * Requirements (ENENHARIA.md linha 147):
 * - PA, FC, Glasgow são obrigatórios
 * - FR, Temp, SpO2 são opcionais
 * - Manchester color + justificativa obrigatórios
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from '@/types/triage';
import { triageService } from '@/services/triageService';
import { AlertCircle, Heart, Activity, Thermometer, Wind, Droplet, Brain } from 'lucide-react';

interface TriageFormProps {
  visitId: string;
  patientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TriageForm({ visitId, patientName, onSuccess, onCancel }: TriageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vital Signs State
  const [bloodPressureSys, setBloodPressureSys] = useState('');
  const [bloodPressureDia, setBloodPressureDia] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [glasgow, setGlasgow] = useState('');

  // Manchester Classification State
  const [triageColor, setTriageColor] = useState<ManchesterColor | ''>('');
  const [triageJustification, setTriageJustification] = useState('');

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

    // Build request
    const request: TriageRegisterRequest = {
      vitalSigns,
      triageColor,
      triageJustification: triageJustification.trim(),
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Triagem Manchester - {patientName}</CardTitle>
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
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="72"
                required
                min="20"
                max="250"
              />
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
                onChange={(e) => setGlasgow(e.target.value)}
                placeholder="15"
                required
                min="3"
                max="15"
              />
              <p className="text-sm text-gray-500">
                15 = Totalmente consciente | 3-8 = Coma
              </p>
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
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="36.5"
                min="32"
                max="43"
              />
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
                onChange={(e) => setOxygenSaturation(e.target.value)}
                placeholder="98"
                min="50"
                max="100"
              />
            </div>
          </div>

          {/* Manchester Classification Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Classificação Manchester</h3>

            {/* Suggested Color Alert */}
            {suggestedColor && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sugestão:</strong> Com base nos sinais vitais, recomendamos classificação{' '}
                  <strong className={MANCHESTER_COLORS[suggestedColor].textColor}>
                    {MANCHESTER_COLORS[suggestedColor].label}
                  </strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Manchester Color Selector */}
            <div className="space-y-2">
              <Label htmlFor="color">Cor de Classificação *</Label>
              <Select value={triageColor} onValueChange={(value) => setTriageColor(value as ManchesterColor)}>
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
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
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

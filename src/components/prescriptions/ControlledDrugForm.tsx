import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface ControlledDrugFormData {
  clinicalJustification: string;
  treatmentDuration: string;
  posology: string;
  observations?: string;
}

interface ControlledDrugFormProps {
  value?: ControlledDrugFormData | null;
  onChange: (value: ControlledDrugFormData) => void;
}

const defaultData: ControlledDrugFormData = {
  clinicalJustification: '',
  treatmentDuration: '',
  posology: '',
  observations: '',
};

export function ControlledDrugForm({ value, onChange }: ControlledDrugFormProps) {
  const [data, setData] = useState<ControlledDrugFormData>(value ?? defaultData);

  useEffect(() => {
    if (value) {
      setData(value);
    }
  }, [value]);

  const handleChange = (field: keyof ControlledDrugFormData, newValue: string) => {
    const updated = { ...data, [field]: newValue };
    setData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h4 className="text-sm font-semibold">Ficha de controle especial</h4>
      <div className="space-y-2">
        <Label htmlFor="clinicalJustification">Justificativa clínica *</Label>
        <Textarea
          id="clinicalJustification"
          placeholder="Descreva a justificativa clínica"
          rows={3}
          value={data.clinicalJustification}
          onChange={(event) => handleChange('clinicalJustification', event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="treatmentDuration">Duração do tratamento *</Label>
        <Input
          id="treatmentDuration"
          placeholder="Ex: 7 dias"
          value={data.treatmentDuration}
          onChange={(event) => handleChange('treatmentDuration', event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="posology">Posologia detalhada *</Label>
        <Textarea
          id="posology"
          placeholder="Informe dose, via e frequência"
          rows={2}
          value={data.posology}
          onChange={(event) => handleChange('posology', event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          placeholder="Observações adicionais (opcional)"
          rows={2}
          value={data.observations ?? ''}
          onChange={(event) => handleChange('observations', event.target.value)}
        />
      </div>
    </div>
  );
}


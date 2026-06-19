import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface BloodComponentFormData {
  componentType: string;
  volume: string;
  unit: string;
  clinicalIndication: string;
  hemocenter?: string;
  bloodType?: string;
  compatibility?: string;
  observations?: string;
}

interface BloodComponentFormProps {
  value?: BloodComponentFormData | null;
  onChange: (value: BloodComponentFormData) => void;
}

const defaultData: BloodComponentFormData = {
  componentType: '',
  volume: '',
  unit: 'mL',
  clinicalIndication: '',
  hemocenter: '',
  bloodType: '',
  compatibility: '',
  observations: '',
};

const componentOptions = [
  'Concentrado de Hemácias',
  'Plasma Fresco',
  'Plaquetas',
  'Crioprecipitado',
  'Outros',
];

const unitOptions = ['mL', 'UI', 'Bolsas'];

export function BloodComponentForm({ value, onChange }: BloodComponentFormProps) {
  const [data, setData] = useState<BloodComponentFormData>(value ?? defaultData);

  useEffect(() => {
    if (value) {
      setData(value);
    }
  }, [value]);

  const handleChange = (field: keyof BloodComponentFormData, newValue: string) => {
    const updated = { ...data, [field]: newValue };
    setData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h4 className="text-sm font-semibold">Ficha de hemocomponentes</h4>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de componente *</Label>
          <Select
            value={data.componentType}
            onValueChange={(val) => handleChange('componentType', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {componentOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Volume *</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              className="col-span-2"
              placeholder="Ex: 300"
              value={data.volume}
              onChange={(event) => handleChange('volume', event.target.value)}
            />
            <Select
              value={data.unit}
              onValueChange={(val) => handleChange('unit', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Indicação clínica *</Label>
        <Textarea
          placeholder="Descreva a indicação clínica para o hemocomponente"
          rows={3}
          value={data.clinicalIndication}
          onChange={(event) => handleChange('clinicalIndication', event.target.value)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Hemocentro / Unidade</Label>
          <Input
            placeholder="Nome do hemocentro responsável"
            value={data.hemocenter}
            onChange={(event) => handleChange('hemocenter', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo sanguíneo / compatibilidade</Label>
          <Input
            placeholder="Ex: O+, compatível com..."
            value={data.bloodType}
            onChange={(event) => handleChange('bloodType', event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Observações adicionais (opcional)"
          rows={2}
          value={data.observations ?? ''}
          onChange={(event) => handleChange('observations', event.target.value)}
        />
      </div>
    </div>
  );
}


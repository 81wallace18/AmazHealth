import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientFormData } from "@/hooks/usePatients";
import { RaceColor, RaceColorLabels, MaritalStatus, MaritalStatusLabels, EducationLevel, EducationLevelLabels } from "@/types/patient";

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<PatientFormData>;
}

const DRAFT_KEY = "patient-form-draft";

const defaults = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  cpf: '',
  cns: '',
  rg: '',
  phone: '',
  email: '',
  address: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  bloodType: '',
  allergies: '',
  medicalHistory: '',
  status: 'active',
  motherName: '',
  fatherName: '',
  birthCity: '',
  birthState: '',
  birthCountry: '',
  raceColor: '',
  maritalStatus: '',
  educationLevel: '',
  occupation: '',
  occupationCboCode: '',
};

function loadDraft(): Partial<typeof defaults> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function PatientForm({ onSubmit, loading = false, initialData }: PatientFormProps) {
  const [draftRestored, setDraftRestored] = useState(() => {
    if (initialData) return false;
    return loadDraft() !== null;
  });

  const [formData, setFormData] = useState(() => {
    if (initialData) return { ...defaults, ...initialData };
    const draft = loadDraft();
    return draft ? { ...defaults, ...draft } : { ...defaults };
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialData) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    localStorage.removeItem(DRAFT_KEY);
    setDraftRestored(false);
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({ ...defaults });
    setDraftRestored(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-none overflow-hidden">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
        </CardTitle>
        {draftRestored && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 mt-2">
            Rascunho restaurado — você está retomando um preenchimento anterior.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome *</Label>
              <Input
                id="first_name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome *</Label>
              <Input
                id="last_name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Data de Nascimento *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                  <SelectItem value="O">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                placeholder="00000000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cns">CNS</Label>
              <Input
                id="cns"
                value={formData.cns}
                onChange={(e) => handleChange('cns', e.target.value)}
                placeholder="Cartão Nacional de Saúde"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={formData.rg}
                onChange={(e) => handleChange('rg', e.target.value)}
              />
            </div>
          </div>

          {/* Filiação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mother_name">Nome da Mãe *</Label>
              <Input
                id="mother_name"
                value={formData.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_name">Nome do Pai</Label>
              <Input
                id="father_name"
                value={formData.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
              />
            </div>
          </div>

          {/* Naturalidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_city">Cidade de Nascimento</Label>
              <Input
                id="birth_city"
                value={formData.birthCity}
                onChange={(e) => handleChange('birthCity', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_state">UF Nascimento</Label>
              <Input
                id="birth_state"
                value={formData.birthState}
                onChange={(e) => handleChange('birthState', e.target.value)}
                placeholder="UF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birth_country">País de Nascimento</Label>
              <Input
                id="birth_country"
                value={formData.birthCountry}
                onChange={(e) => handleChange('birthCountry', e.target.value)}
              />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_number">Número</Label>
              <Input
                id="address_number"
                value={formData.addressNumber}
                onChange={(e) => handleChange('addressNumber', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_complement">Complemento</Label>
              <Input
                id="address_complement"
                value={formData.addressComplement}
                onChange={(e) => handleChange('addressComplement', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                placeholder="12345-678"
              />
            </div>
          </div>

          {/* Contato de Emergência */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Contato de Emergência</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Telefone de Emergência</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
              />
            </div>
          </div>

          {/* Informações Médicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
              <Select value={formData.bloodType} onValueChange={(value) => handleChange('bloodType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo sanguíneo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="deceased">Falecido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
              placeholder="Descreva alergias conhecidas..."
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="medical_history">Histórico Médico</Label>
              <Textarea
                id="medical_history"
                value={formData.medicalHistory}
                onChange={(e) => handleChange('medicalHistory', e.target.value)}
                placeholder="Histórico médico relevante..."
              />
          </div>

          {/* Dados Demográficos e Socioeconômicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="race_color">Raça/Cor</Label>
              <Select value={formData.raceColor} onValueChange={(value) => handleChange('raceColor', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a raça/cor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(RaceColor).map((value) => (
                    <SelectItem key={value} value={value}>{RaceColorLabels[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marital_status">Estado Civil</Label>
              <Select value={formData.maritalStatus} onValueChange={(value) => handleChange('maritalStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MaritalStatus).map((value) => (
                    <SelectItem key={value} value={value}>{MaritalStatusLabels[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education_level">Escolaridade</Label>
              <Select value={formData.educationLevel} onValueChange={(value) => handleChange('educationLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EducationLevel).map((value) => (
                    <SelectItem key={value} value={value}>{EducationLevelLabels[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Profissão</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                placeholder="Ex: Enfermeiro, Professor..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {draftRestored && (
              <Button type="button" variant="outline" onClick={handleClearDraft}>
                Limpar Rascunho
              </Button>
            )}
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Salvando...' : 'Salvar Paciente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

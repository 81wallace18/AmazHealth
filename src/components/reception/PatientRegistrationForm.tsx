import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import {
  Gender,
  RaceColor,
  MaritalStatus,
  EducationLevel,
  PatientCreateRequest,
  GenderLabels,
  RaceColorLabels,
  MaritalStatusLabels,
  EducationLevelLabels,
  BrazilianStates,
  BloodTypes
} from '@/types/patient';
import { patientService } from '@/services/patientService';
import { DemoAutofillButton } from '@/demo/DemoAutofillButton';
import { getDemoRunId } from '@/demo/demoMode';
import { getReceptionPatientExample } from '@/demo/demoFixtures';

const patientSchema = z.object({
  // Obrigatorios (topo)
  fullName: z.string().min(3, 'Nome completo é obrigatório').refine(
    (val) => val.trim().split(/\s+/).length >= 2,
    'Informe nome e sobrenome'
  ),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.nativeEnum(Gender, { required_error: 'Sexo é obrigatório' }),
  motherName: z.string().min(2, 'Nome da mãe é obrigatório'),
  cns: z.string().min(1, 'Cartão SUS é obrigatório'),
  cpf: z.string().optional(),

  // Opcionais
  rg: z.string().optional(),
  fatherName: z.string().optional(),
  birthCity: z.string().optional(),
  birthState: z.string().optional(),
  birthCountry: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  raceColor: z.nativeEnum(RaceColor).optional(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional(),
  educationLevel: z.nativeEnum(EducationLevel).optional(),
  occupation: z.string().optional(),
  occupationCboCode: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  onSubmit: (data: PatientCreateRequest) => Promise<void>;
  onCancel?: () => void;
  onExistingPatient?: (patient: any) => void;
  initialData?: Partial<PatientFormData>;
  duplicates?: any[];
}

export function PatientRegistrationForm({
  onSubmit,
  onCancel,
  onExistingPatient,
  initialData,
  duplicates = []
}: PatientRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [optionalsOpen, setOptionalsOpen] = useState(false);
  const [foundPatient, setFoundPatient] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      birthCountry: 'Brasil',
      ...initialData,
    },
  });

  // Auto-busca por CNS ou CPF
  const searchByDocument = async (value: string, type: 'cns' | 'cpf') => {
    const digits = value.replace(/\D/g, '');
    if ((type === 'cpf' && digits.length === 11) || (type === 'cns' && digits.length >= 15)) {
      try {
        const result = await patientService.search({ query: digits, size: 1 });
        if (result.content.length > 0) {
          const p = result.content[0];
          setFoundPatient(p);
          // Preenche formulario com dados do paciente encontrado
          setValue('fullName', `${p.firstName} ${p.lastName}`);
          setValue('gender', p.gender);
          setValue('motherName', p.motherName || '');
          setValue('dateOfBirth', p.dateOfBirth?.split('T')[0] || '');
          setValue('cns', p.cns || '');
          setValue('cpf', p.cpf || '');
          setValue('fatherName', p.fatherName || '');
          setValue('address', p.address || '');
          setValue('birthCity', p.birthCity || '');
          setValue('maritalStatus', p.maritalStatus);
          setValue('phone', p.phone || '');
        } else {
          setFoundPatient(null);
        }
      } catch {
        setFoundPatient(null);
      }
    }
  };

  const handleFormSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      const parts = data.fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      const { fullName, ...rest } = data;
      await onSubmit({
        ...rest,
        firstName,
        lastName,
        cpf: rest.cpf?.replace(/\D/g, '') || undefined,
        cns: rest.cns?.replace(/\D/g, '') || undefined,
        phone: rest.phone?.replace(/\D/g, '') || undefined,
        zipCode: rest.zipCode?.replace(/\D/g, '') || undefined,
      } as PatientCreateRequest);
    } finally {
      setLoading(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setValue('cpf', value);
    }
  };

  const handleFillExample = () => {
    const example = getReceptionPatientExample(getDemoRunId()).data;
    setFoundPatient(null);
    setOptionalsOpen(true);
    reset({
      birthCountry: 'Brasil',
      cns: example.cns,
      cpf: '',
      fullName: example.fullName,
      gender: example.gender as Gender,
      motherName: example.motherName,
      dateOfBirth: example.dateOfBirth,
      address: example.address,
      phone: example.phone,
      birthCity: example.birthCity,
      maritalStatus: example.maritalStatus as MaritalStatus,
      raceColor: example.raceColor as RaceColor,
      educationLevel: example.educationLevel as EducationLevel,
      allergies: example.allergies,
      fatherName: '',
      email: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="flex justify-end">
        <DemoAutofillButton
          onFill={handleFillExample}
          aria-label="Preencher exemplo de paciente"
        />
      </div>

      {duplicates.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Encontramos {duplicates.length} paciente(s) similar(es).
          </AlertDescription>
        </Alert>
      )}

      {/* Cartao SUS + CPF (primeiro - identifica o paciente) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cns">Cartão SUS *</Label>
          <Input
            id="cns"
            {...register('cns')}
            placeholder="000 0000 0000 0000"
            maxLength={15}
            onBlur={(e) => searchByDocument(e.target.value, 'cns')}
          />
          {errors.cns && <p className="text-xs text-red-500">{errors.cns.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            {...register('cpf')}
            onChange={handleCpfChange}
            placeholder="000.000.000-00"
            maxLength={14}
            onBlur={(e) => searchByDocument(e.target.value, 'cpf')}
          />
        </div>
      </div>

      {/* Nome + Sexo */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-3 space-y-1">
          <Label htmlFor="fullName">Nome *</Label>
          <Input id="fullName" {...register('fullName')} placeholder="Nome completo do paciente" />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="gender">Sexo *</Label>
          <Select value={watch('gender')} onValueChange={(v) => setValue('gender', v as Gender)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {Object.entries(GenderLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
        </div>
      </div>

      {/* Endereco */}
      <div className="space-y-1">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" {...register('address')} placeholder="Rua, número, bairro..." />
      </div>

      {/* Mae */}
      <div className="space-y-1">
        <Label htmlFor="motherName">Nome da Mãe *</Label>
        <Input id="motherName" {...register('motherName')} placeholder="Nome completo da mãe" />
        {errors.motherName && <p className="text-xs text-red-500">{errors.motherName.message}</p>}
      </div>

      {/* Pai */}
      <div className="space-y-1">
        <Label htmlFor="fatherName">Nome do Pai</Label>
        <Input id="fatherName" {...register('fatherName')} placeholder="Nome completo do pai" />
      </div>

      {/* Nascimento + Naturalidade + Es. Civil */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
          <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
          {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="birthCity">Naturalidade</Label>
          <Input id="birthCity" {...register('birthCity')} placeholder="Cidade" />
        </div>
        <div className="space-y-1">
          <Label>Estado Civil</Label>
          <Select value={watch('maritalStatus')} onValueChange={(v) => setValue('maritalStatus', v as MaritalStatus)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {Object.entries(MaritalStatusLabels).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campos opcionais (colapsavel) */}
      <Collapsible open={optionalsOpen} onOpenChange={setOptionalsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" type="button" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <ChevronRight className={`h-4 w-4 mr-2 transition-transform ${optionalsOpen ? "rotate-90" : ""}`} />
            Campos opcionais (contato, dados sociais, clínicos)
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Contato */}
          <div className="space-y-3 border-l-2 border-muted pl-4">
            <p className="text-sm font-medium text-muted-foreground">Contato</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...register('phone')} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.com" />
              </div>
            </div>
          </div>

          {/* Dados sociais */}
          <div className="space-y-3 border-l-2 border-muted pl-4">
            <p className="text-sm font-medium text-muted-foreground">Dados sociais</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Raça/Cor</Label>
                <Select value={watch('raceColor')} onValueChange={(v) => setValue('raceColor', v as RaceColor)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RaceColorLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Escolaridade</Label>
                <Select value={watch('educationLevel')} onValueChange={(v) => setValue('educationLevel', v as EducationLevel)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EducationLevelLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>RG</Label>
                <Input id="rg" {...register('rg')} placeholder="00.000.000-0" />
              </div>
            </div>
          </div>

          {/* Dados clinicos */}
          <div className="space-y-3 border-l-2 border-muted pl-4">
            <p className="text-sm font-medium text-muted-foreground">Dados clínicos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo Sanguíneo</Label>
                <Select value={watch('bloodType')} onValueChange={(v) => setValue('bloodType', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {BloodTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Alergias</Label>
                <Input id="allergies" {...register('allergies')} placeholder="Alergias conhecidas" />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Aviso paciente encontrado */}
      {foundPatient && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Paciente <strong>{foundPatient.firstName} {foundPatient.lastName}</strong> ({foundPatient.patientCode}) já existe no sistema.
          </AlertDescription>
        </Alert>
      )}

      {/* Botoes */}
      <div className="flex justify-between gap-4 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        )}
        {foundPatient && onExistingPatient ? (
          <Button
            type="button"
            className="ml-auto"
            onClick={() => onExistingPatient(foundPatient)}
          >
            Abrir Atendimento
          </Button>
        ) : (
          <Button type="submit" disabled={loading} className="ml-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar e Abrir Atendimento
          </Button>
        )}
      </div>
    </form>
  );
}

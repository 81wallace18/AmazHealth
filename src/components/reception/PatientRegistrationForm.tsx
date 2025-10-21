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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
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

// Schema de validação
const patientSchema = z.object({
  // Dados Essenciais (Aba 1)
  firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  dateOfBirth: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.nativeEnum(Gender, { required_error: 'Sexo é obrigatório' }),
  motherName: z.string().min(2, 'Nome da mãe é obrigatório'),

  // Documentos (Aba 1)
  cpf: z.string().optional(),
  cns: z.string().optional(),
  rg: z.string().optional(),

  // Naturalidade
  birthCity: z.string().optional(),
  birthState: z.string().optional(),
  birthCountry: z.string().optional(),

  // Contato
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),

  // Endereço Completo (Aba 2)
  address: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),

  // Dados Demográficos e Socioeconômicos (Aba 3)
  fatherName: z.string().optional(),
  raceColor: z.nativeEnum(RaceColor).optional(),
  maritalStatus: z.nativeEnum(MaritalStatus).optional(),
  educationLevel: z.nativeEnum(EducationLevel).optional(),
  occupation: z.string().optional(),
  occupationCboCode: z.string().optional(),

  // Dados Clínicos (Aba 4)
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
}).refine((data) => data.cpf || data.cns, {
  message: 'CPF ou CNS é obrigatório',
  path: ['cpf'],
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  onSubmit: (data: PatientCreateRequest) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<PatientFormData>;
  duplicates?: any[];
}

export function PatientRegistrationForm({
  onSubmit,
  onCancel,
  initialData,
  duplicates = []
}: PatientRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('essential');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      birthCountry: 'Brasil',
      ...initialData,
    },
  });

  const handleFormSubmit = async (data: PatientFormData) => {
    try {
      setLoading(true);
      await onSubmit(data as PatientCreateRequest);
    } finally {
      setLoading(false);
    }
  };

  // Máscara de CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      setValue('cpf', value);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <CardHeader>
        <CardTitle>Cadastro de Paciente</CardTitle>
        <CardDescription>
          Preencha os dados do paciente. Campos marcados com * são obrigatórios.
        </CardDescription>
      </CardHeader>

      {duplicates.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Encontramos {duplicates.length} paciente(s) similar(es).
            Verifique se não é cadastro duplicado.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="essential">Dados Essenciais</TabsTrigger>
          <TabsTrigger value="address">Endereço</TabsTrigger>
          <TabsTrigger value="social">Dados Sociais</TabsTrigger>
          <TabsTrigger value="clinical">Dados Clínicos</TabsTrigger>
        </TabsList>

        {/* Aba 1: Dados Essenciais */}
        <TabsContent value="essential" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Nome do paciente"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Sobrenome do paciente"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Sexo *</Label>
                  <Select
                    value={watch('gender')}
                    onValueChange={(value) => setValue('gender', value as Gender)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GenderLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName">Nome da Mãe * (Essencial para DO)</Label>
                <Input
                  id="motherName"
                  {...register('motherName')}
                  placeholder="Nome completo da mãe"
                />
                {errors.motherName && (
                  <p className="text-sm text-red-500">{errors.motherName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName">Nome do Pai (Opcional para DO)</Label>
                <Input
                  id="fatherName"
                  {...register('fatherName')}
                  placeholder="Nome completo do pai"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos (CPF ou CNS obrigatório)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    {...register('cpf')}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-red-500">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cns">CNS (Cartão SUS)</Label>
                  <Input
                    id="cns"
                    {...register('cns')}
                    placeholder="000 0000 0000 0000"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    {...register('rg')}
                    placeholder="00.000.000-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Naturalidade (Para DO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthCity">Cidade de Nascimento</Label>
                  <Input
                    id="birthCity"
                    {...register('birthCity')}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthState">UF de Nascimento</Label>
                  <Select
                    value={watch('birthState')}
                    onValueChange={(value) => setValue('birthState', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BrazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthCountry">País</Label>
                  <Input
                    id="birthCountry"
                    {...register('birthCountry')}
                    defaultValue="Brasil"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Endereço */}
        <TabsContent value="address" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Endereço Completo (Essencial para DO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="address">Logradouro</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Rua, Avenida, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressNumber">Número</Label>
                  <Input
                    id="addressNumber"
                    {...register('addressNumber')}
                    placeholder="000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressComplement">Complemento</Label>
                  <Input
                    id="addressComplement"
                    {...register('addressComplement')}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    {...register('neighborhood')}
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select
                    value={watch('state')}
                    onValueChange={(value) => setValue('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BrazilianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    {...register('zipCode')}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Dados Sociais */}
        <TabsContent value="social" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Demográficos e Socioeconômicos (Para DO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raceColor">Raça/Cor</Label>
                  <Select
                    value={watch('raceColor')}
                    onValueChange={(value) => setValue('raceColor', value as RaceColor)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RaceColorLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Situação Conjugal</Label>
                  <Select
                    value={watch('maritalStatus')}
                    onValueChange={(value) => setValue('maritalStatus', value as MaritalStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MaritalStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="educationLevel">Escolaridade (Última série concluída)</Label>
                <Select
                  value={watch('educationLevel')}
                  onValueChange={(value) => setValue('educationLevel', value as EducationLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EducationLevelLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Ocupação Habitual</Label>
                  <Input
                    id="occupation"
                    {...register('occupation')}
                    placeholder="Ex: Aposentado, Desempregado, Profissão..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupationCboCode">Código CBO 2002</Label>
                  <Input
                    id="occupationCboCode"
                    {...register('occupationCboCode')}
                    placeholder="0000-00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 4: Dados Clínicos */}
        <TabsContent value="clinical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
                <Select
                  value={watch('bloodType')}
                  onValueChange={(value) => setValue('bloodType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {BloodTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias</Label>
                <Textarea
                  id="allergies"
                  {...register('allergies')}
                  placeholder="Descreva alergias conhecidas..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Histórico Médico</Label>
                <Textarea
                  id="medicalHistory"
                  {...register('medicalHistory')}
                  placeholder="Descreva histórico médico relevante..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CardContent className="flex justify-between gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading} className="ml-auto">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cadastrar Paciente
        </Button>
      </CardContent>
    </form>
  );
}

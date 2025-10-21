import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaskedInput } from "@/components/ui/masked-input";
import { DuplicatePatientAlert } from "@/components/patients/DuplicatePatientAlert";
import { patientSchema, patientDefaultValues, type PatientFormData } from "@/schemas/patientSchema";
import { patientService } from "@/services/patientService";
import { useToast } from "@/hooks/use-toast";
import {
  Gender,
  GenderLabels,
  RaceColor,
  RaceColorLabels,
  MaritalStatus,
  MaritalStatusLabels,
  EducationLevel,
  EducationLevelLabels,
  BrazilianStates,
  BloodTypes,
  type Patient
} from "@/types/patient";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PatientFormProps {
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<Patient>;
}

/**
 * Formulário completo de cadastro de pacientes (US-A2)
 * Integrado com React Hook Form + Zod + Validação de Duplicatas
 */
export function PatientFormNew({ onSubmit, loading = false, initialData }: PatientFormProps) {
  const { toast } = useToast();
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<Patient[]>([]);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [pendingData, setPendingData] = useState<PatientFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: initialData ? {
      ...patientDefaultValues,
      ...initialData
    } : patientDefaultValues
  });

  // Observar campos para verificação de duplicatas
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const dateOfBirth = watch('dateOfBirth');

  // Verificar duplicatas quando os campos críticos mudarem
  useEffect(() => {
    const checkDuplicates = async () => {
      if (!firstName || !lastName || !dateOfBirth || firstName.length < 2 || lastName.length < 2) {
        return;
      }

      // Não verificar duplicatas ao editar
      if (initialData?.id) {
        return;
      }

      setCheckingDuplicates(true);
      try {
        const found = await patientService.checkDuplicates(firstName, lastName, dateOfBirth);
        if (found && found.length > 0) {
          setDuplicates(found);
        } else {
          setDuplicates([]);
        }
      } catch (error) {
        console.error('Erro ao verificar duplicatas:', error);
      } finally {
        setCheckingDuplicates(false);
      }
    };

    // Debounce de 800ms
    const timer = setTimeout(checkDuplicates, 800);
    return () => clearTimeout(timer);
  }, [firstName, lastName, dateOfBirth, initialData]);

  const handleFormSubmit = async (data: PatientFormData) => {
    // Se há duplicatas, mostrar alerta
    if (duplicates.length > 0 && !pendingData) {
      setPendingData(data);
      setShowDuplicateAlert(true);
      return;
    }

    try {
      await onSubmit(data);
      reset();
      setDuplicates([]);
      setPendingData(null);
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
    }
  };

  const handleSelectExisting = (patient: Patient) => {
    toast({
      title: "Paciente selecionado",
      description: `Usando cadastro existente: ${patient.firstName} ${patient.lastName}`,
    });
    // Aqui você pode redirecionar para a tela de visualização do paciente
  };

  const handleConfirmNew = async () => {
    if (pendingData) {
      try {
        await onSubmit(pendingData);
        reset();
        setDuplicates([]);
        setPendingData(null);
      } catch (error) {
        console.error('Erro ao salvar paciente:', error);
      }
    }
  };

  return (
    <>
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            {initialData ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Campos marcados com * são obrigatórios
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">

            {/* Alerta de duplicatas em tempo real */}
            {duplicates.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ Atenção!</strong> Encontramos {duplicates.length} paciente(s) com dados similares.
                  Verifique antes de continuar.
                </AlertDescription>
              </Alert>
            )}

            {/* SEÇÃO 1: DADOS PESSOAIS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">📝 Dados Pessoais</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Ex: João"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Ex: Silva"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero *</Label>
                  <Select
                    onValueChange={(value) => setValue('gender', value as Gender)}
                    defaultValue={initialData?.gender || Gender.UNKNOWN}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
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
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motherName">Nome da Mãe *</Label>
                  <Input
                    id="motherName"
                    {...register('motherName')}
                    placeholder="Nome completo da mãe"
                  />
                  <p className="text-xs text-muted-foreground">
                    Obrigatório para emissão de atestado de óbito
                  </p>
                  {errors.motherName && (
                    <p className="text-sm text-destructive">{errors.motherName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherName">Nome do Pai</Label>
                  <Input
                    id="fatherName"
                    {...register('fatherName')}
                    placeholder="Nome completo do pai (opcional)"
                  />
                  {errors.fatherName && (
                    <p className="text-sm text-destructive">{errors.fatherName.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DOCUMENTOS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">📄 Documentos</h3>
              <p className="text-sm text-muted-foreground">
                * É obrigatório informar <strong>CPF ou CNS (Cartão SUS)</strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <MaskedInput
                    id="cpf"
                    mask="cpf"
                    onValueChange={(masked, unmasked) => setValue('cpf', unmasked)}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && (
                    <p className="text-sm text-destructive">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cns">Cartão SUS (CNS)</Label>
                  <MaskedInput
                    id="cns"
                    mask="cns"
                    onValueChange={(masked, unmasked) => setValue('cns', unmasked)}
                    placeholder="000 0000 0000 0000"
                  />
                  {errors.cns && (
                    <p className="text-sm text-destructive">{errors.cns.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    {...register('rg')}
                    placeholder="Documento de identidade"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: NATURALIDADE */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">🌍 Naturalidade</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthCity">Cidade de Nascimento</Label>
                  <Input
                    id="birthCity"
                    {...register('birthCity')}
                    placeholder="Ex: São Paulo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthState">Estado de Nascimento</Label>
                  <Select onValueChange={(value) => setValue('birthState', value)}>
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
                  <Label htmlFor="birthCountry">País de Nascimento</Label>
                  <Input
                    id="birthCountry"
                    {...register('birthCountry')}
                    placeholder="Brasil"
                    defaultValue="Brasil"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: CONTATO */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">📞 Contato</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <MaskedInput
                    id="phone"
                    mask="phone"
                    onValueChange={(masked, unmasked) => setValue('phone', unmasked)}
                    placeholder="(00) 00000-0000"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="exemplo@email.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 5: ENDEREÇO COMPLETO */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">📍 Endereço</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <MaskedInput
                    id="zipCode"
                    mask="cep"
                    onValueChange={(masked, unmasked) => setValue('zipCode', unmasked)}
                    placeholder="00000-000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Busca automática de endereço (futuro)
                  </p>
                  {errors.zipCode && (
                    <p className="text-sm text-destructive">{errors.zipCode.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Logradouro</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Rua, Avenida, Travessa..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressNumber">Número</Label>
                  <Input
                    id="addressNumber"
                    {...register('addressNumber')}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressComplement">Complemento</Label>
                  <Input
                    id="addressComplement"
                    {...register('addressComplement')}
                    placeholder="Apto 45, Bloco B..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    {...register('neighborhood')}
                    placeholder="Nome do bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado (UF)</Label>
                  <Select onValueChange={(value) => setValue('state', value)}>
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
              </div>
            </div>

            {/* SEÇÃO 6: DADOS DEMOGRÁFICOS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">👤 Dados Demográficos e Socioeconômicos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raceColor">Raça/Cor *</Label>
                  <Select
                    onValueChange={(value) => setValue('raceColor', value as RaceColor)}
                    defaultValue={initialData?.raceColor || RaceColor.UNKNOWN}
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
                  <p className="text-xs text-muted-foreground">
                    Obrigatório para prontuário e declaração de óbito
                  </p>
                  {errors.raceColor && (
                    <p className="text-sm text-destructive">{errors.raceColor.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Estado Civil</Label>
                  <Select onValueChange={(value) => setValue('maritalStatus', value as MaritalStatus)}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">Escolaridade</Label>
                  <Select onValueChange={(value) => setValue('educationLevel', value as EducationLevel)}>
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

                <div className="space-y-2">
                  <Label htmlFor="occupation">Ocupação</Label>
                  <Input
                    id="occupation"
                    {...register('occupation')}
                    placeholder="Ex: Engenheiro, Comerciante..."
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 7: DADOS CLÍNICOS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">⚕️ Dados Clínicos</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Tipo Sanguíneo</Label>
                  <Select onValueChange={(value) => setValue('bloodType', value)}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias Conhecidas</Label>
                <Textarea
                  id="allergies"
                  {...register('allergies')}
                  placeholder="Descreva alergias a medicamentos, alimentos ou outras substâncias..."
                  rows={3}
                />
                {errors.allergies && (
                  <p className="text-sm text-destructive">{errors.allergies.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Histórico Médico</Label>
                <Textarea
                  id="medicalHistory"
                  {...register('medicalHistory')}
                  placeholder="Histórico de doenças, cirurgias, tratamentos anteriores..."
                  rows={4}
                />
                {errors.medicalHistory && (
                  <p className="text-sm text-destructive">{errors.medicalHistory.message}</p>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting || loading}
              >
                Limpar Formulário
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || loading || checkingDuplicates}
                className="min-w-[150px]"
              >
                {(isSubmitting || loading) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {checkingDuplicates && "Verificando duplicatas..."}
                {!checkingDuplicates && (isSubmitting || loading) && "Salvando..."}
                {!checkingDuplicates && !isSubmitting && !loading && "Salvar Paciente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de alerta de duplicatas */}
      <DuplicatePatientAlert
        open={showDuplicateAlert}
        onOpenChange={setShowDuplicateAlert}
        duplicates={duplicates}
        onSelectExisting={handleSelectExisting}
        onConfirmNew={handleConfirmNew}
      />
    </>
  );
}

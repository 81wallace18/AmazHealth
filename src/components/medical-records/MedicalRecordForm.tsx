import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { medicalRecordService } from '@/services/medicalRecordService';
import { DiagnosisPicker } from '@/components/medical-records/DiagnosisPicker';
import type { IcdSystem } from '@/types/icd';
import type { RecordType } from '@/types/medicalRecord';
import { RECORD_TYPE_LABELS } from '@/types/medicalRecord';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, FileText } from 'lucide-react';

const formSchema = z.object({
  visitId: z.string().uuid('ID da visita inválido'),
  recordType: z.enum([
    'TRIAGE',
    'ANAMNESIS',
    'EVOLUTION',
    'DISCHARGE_SUMMARY',
    'PROCEDURE',
    'OTHER',
  ] as const),

  // SOAP - Opcionais
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z
    .string()
    .min(10, 'Mínimo 10 caracteres')
    .optional()
    .or(z.literal('')),
  physicalExamination: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  primaryDiagnosisCode: z.string().optional(),
  primaryDiagnosisDescription: z.string().optional(),
  primaryDiagnosisSystem: z.enum(['ICD10', 'ICD11']).optional(),
  secondaryDiagnosisCodes: z.array(z.string()).optional(),

  // Obrigatório
  notes: z
    .string()
    .min(20, 'Mínimo 20 caracteres')
    .max(10000, 'Máximo 10.000 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

interface MedicalRecordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string;
  patientName?: string;
  onSuccess?: () => void;
  defaultValues?: Partial<FormData>;
  recordId?: string; // Se fornecido, é edição
}

/**
 * Formulário para criar/editar registro do prontuário eletrônico
 *
 * Features:
 * - Estrutura SOAP em abas separadas
 * - Editor rico (Tiptap) para notas
 * - Validação Zod
 * - Modo criação e edição
 * - Contador de caracteres
 *
 * Uso:
 * ```tsx
 * <MedicalRecordForm
 *   open={showForm}
 *   onOpenChange={setShowForm}
 *   visitId={visit.id}
 *   patientName={patient.fullName}
 *   onSuccess={() => refetch()}
 * />
 * ```
 */
export function MedicalRecordForm({
  open,
  onOpenChange,
  visitId,
  patientName,
  onSuccess,
  defaultValues,
  recordId,
}: MedicalRecordFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('soap');
  const [secondaryCodeInput, setSecondaryCodeInput] = useState('');

  const isEditing = !!recordId;
  const canOnlyRecordEvolution =
    !user?.roles?.includes('DOCTOR') &&
    !user?.roles?.includes('ADMIN') &&
    (user?.roles?.includes('NURSE') || user?.roles?.includes('NURSE_MANAGER'));
  const allowedRecordTypes = (
    Object.entries(RECORD_TYPE_LABELS) as [RecordType, string][]
  ).filter(([value]) => !canOnlyRecordEvolution || value === 'EVOLUTION');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitId,
      recordType: 'EVOLUTION',
      notes: '',
      ...defaultValues,
      primaryDiagnosisSystem: defaultValues?.primaryDiagnosisSystem ?? 'ICD10',
      secondaryDiagnosisCodes: defaultValues?.secondaryDiagnosisCodes ?? [],
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    try {
      if (isEditing) {
        await medicalRecordService.update(recordId, data);
        toast.success('Registro atualizado!', {
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        await medicalRecordService.create(data);
        toast.success('Registro salvo!', {
          description: 'O registro foi adicionado ao prontuário.',
        });
      }

      form.reset();
      onOpenChange(false);
        onSuccess?.();
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Sem permissão', {
          description: 'Apenas o autor pode editar este registro nas primeiras 24h.',
        });
      } else if (error.response?.status === 400) {
        // Tratamento melhorado de erros de validação
        const errorData = error.response?.data;
        let errorMsg = 'Verifique os campos obrigatórios.';

        if (typeof errorData === 'string') {
          errorMsg = errorData;
        } else if (errorData?.message) {
          errorMsg = errorData.message;
        } else if (errorData?.details && Array.isArray(errorData.details)) {
          errorMsg = errorData.details.map((d: any) => d.message || d).join(', ');
        } else if (errorData?.error) {
          errorMsg = errorData.error;
        }

        toast.error('Erro de validação', {
          description: errorMsg,
          duration: 5000,
        });
      } else {
        toast.error('Erro ao salvar', {
          description: error.response?.data?.message || 'Tente novamente.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const addSecondaryCode = () => {
    const code = secondaryCodeInput.trim();
    if (!code) return;
    const current = form.getValues('secondaryDiagnosisCodes') || [];
    if (current.includes(code)) {
      setSecondaryCodeInput('');
      return;
    }
    form.setValue('secondaryDiagnosisCodes', [...current, code]);
    setSecondaryCodeInput('');
  };

  const removeSecondaryCode = (code: string) => {
    const current = form.getValues('secondaryDiagnosisCodes') || [];
    form.setValue('secondaryDiagnosisCodes', current.filter((c) => c !== code));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditing ? 'Editar Registro' : 'Novo Registro no Prontuário'}
          </DialogTitle>
          {patientName && (
            <DialogDescription>Paciente: {patientName}</DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Registro */}
            <FormField
              control={form.control}
              name="recordType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Registro *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={canOnlyRecordEvolution}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allowedRecordTypes.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {canOnlyRecordEvolution && (
                    <FormDescription>
                      Neste contexto, enfermagem pode registrar apenas evolução.
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Abas SOAP vs Texto Livre */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="soap">Estruturado (SOAP)</TabsTrigger>
                <TabsTrigger value="notes">Texto Livre *</TabsTrigger>
              </TabsList>

              {/* Aba SOAP */}
              <TabsContent value="soap" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Campos estruturados seguindo metodologia SOAP. Todos opcionais.
                </p>

                {/* S - Subjetivo */}
                <FormField
                  control={form.control}
                  name="chiefComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>S - Queixa Principal</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Cefaleia há 3 dias"
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Motivo da consulta relatado pelo paciente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="historyOfPresentIllness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>S - História da Doença Atual</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Histórico detalhado dos sintomas..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Evolução dos sintomas, duração, fatores de melhora/piora
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* O - Objetivo */}
                <FormField
                  control={form.control}
                  name="physicalExamination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O - Exame Físico</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Inspeção, palpação, ausculta..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Achados do exame físico realizado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* A - Avaliação */}
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>A - Diagnóstico / Hipótese Diagnóstica</FormLabel>
                      <FormDescription className="text-xs">
                        Separe a descrição clínica do código CID-10/CID-11 para maior rastreabilidade.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="CID-10/CID-11, diagnóstico clínico..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* P - Plano */}
                <FormField
                  control={form.control}
                  name="treatment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>P - Plano / Conduta</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tratamento, medicações, exames solicitados..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Plano terapêutico e orientações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CID primário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryDiagnosisCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CID Primário</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: I64"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryDiagnosisDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição CID Primário</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Acidente vascular cerebral..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Busca CID */}
                <FormField
                  control={form.control}
                  name="primaryDiagnosisSystem"
                  render={({ field }) => {
                    const systemValue = (field.value ?? 'ICD10') as IcdSystem;
                    return (
                      <FormItem>
                        <FormLabel>Buscar CID</FormLabel>
                        <DiagnosisPicker
                          system={systemValue}
                          onSystemChange={field.onChange}
                          onSelect={(item) => {
                            form.setValue('primaryDiagnosisSystem', item.system);
                            form.setValue('primaryDiagnosisCode', item.code);
                            form.setValue('primaryDiagnosisDescription', item.description);
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* CID-10 secundários */}
                <div className="space-y-2">
                  <FormLabel>CIDs Secundários</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: I63.9"
                      value={secondaryCodeInput}
                      onChange={(e) => setSecondaryCodeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSecondaryCode())}
                    />
                    <Button type="button" variant="outline" onClick={addSecondaryCode}>
                      Adicionar
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="secondaryDiagnosisCodes"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-wrap gap-2">
                          {(field.value || []).map((code) => (
                            <div key={code} className="flex items-center gap-2 bg-secondary px-2 py-1 rounded-md text-sm">
                              <span>{code}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSecondaryCode(code)}
                              >
                                Remover
                              </Button>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </TabsContent>

              {/* Aba Texto Livre (Obrigatório) */}
              <TabsContent value="notes" className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas do Registro *</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Digite as anotações do atendimento... (mínimo 20 caracteres)"
                          minLength={20}
                          maxLength={10000}
                        />
                      </FormControl>
                      <FormDescription>
                        Campo obrigatório. Use este espaço para anotações livres ou
                        quando os campos SOAP não forem aplicáveis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Salvar Registro'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

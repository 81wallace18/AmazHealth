import { useState } from 'react';
import { CheckCircle2, ChevronRight, Copy, Loader2, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { userService } from '@/services/userService';
import { useOrgConfig } from '@/hooks/useOrgConfig';
import type { RoleType } from '@/types/user';

const ROLE_LABELS: Record<RoleType, string> = {
  admin: 'Administrador',
  gestao: 'Gestão',
  doctor: 'Médico',
  nurse: 'Enfermeiro',
  nurse_manager: 'Coord. Enfermagem',
  pharmacist: 'Farmacêutico',
  receptionist: 'Recepcionista',
  hospital_manager: 'Gestão Hospitalar',
  finance: 'Financeiro',
  staff: 'Funcionário',
};

const step1Schema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').max(100),
  lastName: z.string().min(1, 'Sobrenome é obrigatório').max(100),
  role: z.enum(['admin', 'gestao', 'doctor', 'nurse', 'nurse_manager', 'pharmacist', 'receptionist', 'hospital_manager', 'finance', 'staff'] as const, {
    required_error: 'Função é obrigatória',
  }),
  specialization: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

const step2Schema = z.object({
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  cpf: z.string().optional(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

interface AddMemberWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type WizardStep = 1 | 2 | 3;

interface CreatedResult {
  tempPassword?: string;
  activationUrl?: string;
  email: string;
}

export function AddMemberWizard({ open, onOpenChange, onSuccess }: AddMemberWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedResult | null>(null);

  const { hasPolicy } = useOrgConfig();
  const skipActivation = hasPolicy('skip_activation_email');
  const allowCpfLogin = hasPolicy('allow_cpf_login');

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { firstName: '', lastName: '', role: 'doctor', specialization: '', phone: '' },
  });

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: { email: '', cpf: '' },
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      resetWizard();
    }
    onOpenChange(open);
  };

  const resetWizard = () => {
    setStep(1);
    setStep1Data(null);
    setStep2Data(null);
    setResult(null);
    form1.reset({ firstName: '', lastName: '', role: 'doctor', specialization: '', phone: '' });
    form2.reset({ email: '', cpf: '' });
  };

  const onStep1Submit = (values: Step1Values) => {
    setStep1Data(values);
    setStep(2);
  };

  const onStep2Submit = (values: Step2Values) => {
    setStep2Data(values);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!step1Data) return;
    setSubmitting(true);
    try {
      const fullName = `${step1Data.firstName} ${step1Data.lastName}`;
      const response = await userService.create({
        fullName,
        email: step2Data?.email || undefined,
        cpf: step2Data?.cpf || undefined,
        role: step1Data.role,
        staffData: {
          firstName: step1Data.firstName,
          lastName: step1Data.lastName,
          specialization: step1Data.specialization || undefined,
          phone: step1Data.phone || undefined,
        },
      });
      setResult({
        tempPassword: response.tempPassword,
        activationUrl: response.activationUrl,
        email: response.email,
      });
      setStep(3);
      onSuccess();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Erro ao criar membro da equipe.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    resetWizard();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar membro da equipe
          </DialogTitle>
        </DialogHeader>

        {/* Indicador de etapas */}
        {!result && (
          <div className="flex items-center gap-2 mb-2">
            {([1, 2, 3] as WizardStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step > s ? 'bg-green-500 text-white' :
                  step === s ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-xs ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Profissional' : s === 2 ? 'Acesso' : 'Revisão'}
                </span>
                {i < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        )}

        {/* Etapa 1 — Dados profissionais */}
        {step === 1 && (
          <Form {...form1}>
            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form1.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl><Input placeholder="João" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form1.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome *</FormLabel>
                    <FormControl><Input placeholder="Silva" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form1.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Função *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecione a função" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(ROLE_LABELS) as [RoleType, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form1.control} name="specialization" render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialização <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <FormControl><Input placeholder="Ex: Clínica Geral, Emergência..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form1.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <FormControl><Input placeholder="(91) 99999-9999" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end pt-2">
                <Button type="submit">
                  Próximo <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Etapa 2 — Acesso ao sistema */}
        {step === 2 && (
          <Form {...form2}>
            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className={`rounded-lg p-3 text-sm ${skipActivation ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
                {skipActivation
                  ? 'Conta criada imediatamente com senha temporária para entrega presencial.'
                  : 'Um link de ativação será enviado ao profissional para ele criar a própria senha.'}
              </div>

              <FormField control={form2.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email {skipActivation && <span className="text-muted-foreground text-xs">(opcional)</span>}
                  </FormLabel>
                  <FormControl><Input type="email" placeholder="profissional@hospital.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {allowCpfLogin && (
                <FormField control={form2.control} name="cpf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF <span className="text-muted-foreground text-xs">(permite login por CPF)</span></FormLabel>
                    <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Voltar</Button>
                <Button type="submit">
                  Revisar <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Etapa 3 — Revisão ou Resultado */}
        {step === 3 && !result && step1Data && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{step1Data.firstName} {step1Data.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Função</span>
                <Badge variant="secondary">{ROLE_LABELS[step1Data.role]}</Badge>
              </div>
              {step1Data.specialization && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Especialização</span>
                  <span>{step1Data.specialization}</span>
                </div>
              )}
              {step2Data?.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{step2Data.email}</span>
                </div>
              )}
              {step2Data?.cpf && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF</span>
                  <span>{step2Data.cpf}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ativação</span>
                <span className="text-xs">{skipActivation ? 'Senha temporária presencial' : 'Link por email'}</span>
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Voltar</Button>
              <Button onClick={handleConfirm} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</> : 'Confirmar e criar'}
              </Button>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Membro adicionado com sucesso!</span>
            </div>

            {result.tempPassword ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Entregue a senha temporária abaixo pessoalmente. O profissional precisará trocá-la no primeiro acesso.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-center px-3 py-2 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold tracking-widest text-sm">
                    {result.tempPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(result.tempPassword!); toast.success('Copiado!'); }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Envie o link abaixo para o profissional ativar a conta e criar a senha.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs px-2 py-1.5 rounded bg-muted truncate">
                    {result.activationUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(result.activationUrl!); toast.success('Link copiado!'); }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-1">
              <Button variant="outline" onClick={handleAddAnother}>Adicionar outro</Button>
              <Button onClick={() => handleClose(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

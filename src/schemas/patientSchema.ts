import { z } from 'zod';
import {
  validateCPF,
  validateCEP,
  validatePhone,
  validateDateOfBirth,
  validateEmail
} from '@/utils/validators';
import { Gender, RaceColor, MaritalStatus, EducationLevel } from '@/types/patient';

/**
 * Schema de validação completo para cadastro de pacientes
 * Alinhado com ENENHARIA.md - Épico A
 */
export const patientSchema = z.object({
  // ============================================
  // DADOS PESSOAIS OBRIGATÓRIOS (US-A2)
  // ============================================
  firstName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos'),

  lastName: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(100, 'Sobrenome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Sobrenome contém caracteres inválidos'),

  dateOfBirth: z.string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine(validateDateOfBirth, {
      message: 'Data de nascimento inválida (não pode ser futura e idade máxima de 150 anos)'
    }),

  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: 'Selecione o gênero' })
  }),

  // ============================================
  // DADOS FAMILIARES (Obrigatório para DO)
  // ============================================
  motherName: z.string()
    .min(5, 'Nome da mãe é obrigatório (mínimo 5 caracteres)')
    .max(200, 'Nome da mãe muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome da mãe contém caracteres inválidos'),

  fatherName: z.string()
    .max(200, 'Nome do pai muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]*$/, 'Nome do pai contém caracteres inválidos')
    .optional()
    .or(z.literal('')),

  // ============================================
  // DOCUMENTOS (CPF OU CNS OBRIGATÓRIO)
  // ============================================
  cpf: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || validateCPF(val),
      { message: 'CPF inválido' }
    )
    .or(z.literal('')),

  cns: z.string()
    .max(15, 'CNS deve ter no máximo 15 caracteres')
    .optional()
    .or(z.literal('')),

  rg: z.string()
    .max(20, 'RG muito longo')
    .optional()
    .or(z.literal('')),

  // ============================================
  // NATURALIDADE
  // ============================================
  birthCity: z.string()
    .max(100, 'Nome da cidade muito longo')
    .optional()
    .or(z.literal('')),

  birthState: z.string()
    .max(2, 'UF deve ter 2 caracteres')
    .optional()
    .or(z.literal('')),

  birthCountry: z.string()
    .max(100, 'Nome do país muito longo')
    .optional()
    .or(z.literal('')),

  // ============================================
  // CONTATO
  // ============================================
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || validatePhone(val),
      { message: 'Telefone inválido (formato: (00) 00000-0000)' }
    )
    .or(z.literal('')),

  email: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || validateEmail(val),
      { message: 'Email inválido' }
    )
    .or(z.literal('')),

  // ============================================
  // ENDEREÇO COMPLETO (Essencial para DO)
  // ============================================
  zipCode: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || validateCEP(val),
      { message: 'CEP inválido (formato: 00000-000)' }
    )
    .or(z.literal('')),

  address: z.string()
    .max(200, 'Endereço muito longo')
    .optional()
    .or(z.literal('')),

  addressNumber: z.string()
    .max(10, 'Número muito longo')
    .optional()
    .or(z.literal('')),

  addressComplement: z.string()
    .max(100, 'Complemento muito longo')
    .optional()
    .or(z.literal('')),

  neighborhood: z.string()
    .max(100, 'Bairro muito longo')
    .optional()
    .or(z.literal('')),

  city: z.string()
    .max(100, 'Cidade muito longa')
    .optional()
    .or(z.literal('')),

  state: z.string()
    .max(2, 'Estado deve ter 2 caracteres (UF)')
    .optional()
    .or(z.literal('')),

  // ============================================
  // DADOS DEMOGRÁFICOS (Para prontuário/DO)
  // ============================================
  raceColor: z.nativeEnum(RaceColor, {
    errorMap: () => ({ message: 'Selecione a raça/cor' })
  }),

  maritalStatus: z.nativeEnum(MaritalStatus)
    .optional()
    .or(z.literal('')),

  // ============================================
  // DADOS SOCIOECONÔMICOS (Para DO)
  // ============================================
  educationLevel: z.nativeEnum(EducationLevel)
    .optional()
    .or(z.literal('')),

  occupation: z.string()
    .max(100, 'Ocupação muito longa')
    .optional()
    .or(z.literal('')),

  occupationCboCode: z.string()
    .max(10, 'Código CBO inválido')
    .optional()
    .or(z.literal('')),

  // ============================================
  // DADOS CLÍNICOS
  // ============================================
  bloodType: z.string()
    .optional()
    .or(z.literal('')),

  allergies: z.string()
    .max(1000, 'Texto de alergias muito longo')
    .optional()
    .or(z.literal('')),

  medicalHistory: z.string()
    .max(2000, 'Histórico médico muito longo')
    .optional()
    .or(z.literal('')),

  // ============================================
  // STATUS
  // ============================================
  status: z.enum(['active', 'inactive', 'deceased'])
    .default('active')
    .optional()

}).refine(
  // REGRA CRÍTICA: CPF OU CNS OBRIGATÓRIO (US-A2)
  (data) => {
    const hasCPF = data.cpf && data.cpf.trim() !== '';
    const hasCNS = data.cns && data.cns.trim() !== '';
    return hasCPF || hasCNS;
  },
  {
    message: 'É obrigatório informar CPF ou CNS (Cartão SUS)',
    path: ['cpf'] // Exibe erro no campo CPF
  }
);

/**
 * Tipo inferido do schema (para TypeScript)
 */
export type PatientFormData = z.infer<typeof patientSchema>;

/**
 * Valores padrão para o formulário
 */
export const patientDefaultValues: Partial<PatientFormData> = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: Gender.UNKNOWN,
  motherName: '',
  fatherName: '',
  cpf: '',
  cns: '',
  rg: '',
  birthCity: '',
  birthState: '',
  birthCountry: 'Brasil',
  phone: '',
  email: '',
  zipCode: '',
  address: '',
  addressNumber: '',
  addressComplement: '',
  neighborhood: '',
  city: '',
  state: '',
  raceColor: RaceColor.UNKNOWN,
  maritalStatus: MaritalStatus.UNKNOWN,
  educationLevel: EducationLevel.UNKNOWN,
  occupation: '',
  occupationCboCode: '',
  bloodType: '',
  allergies: '',
  medicalHistory: '',
  status: 'active'
};

/**
 * Mensagens de erro personalizadas em português
 */
export const patientErrorMessages = {
  required: 'Este campo é obrigatório',
  invalidCPF: 'CPF inválido',
  invalidCNS: 'CNS (Cartão SUS) inválido',
  invalidCEP: 'CEP inválido',
  invalidPhone: 'Telefone inválido',
  invalidEmail: 'Email inválido',
  invalidDate: 'Data inválida',
  cpfOrCnsRequired: 'Informe pelo menos CPF ou CNS',
  tooShort: 'Texto muito curto',
  tooLong: 'Texto muito longo',
  invalidCharacters: 'Caracteres inválidos'
};

/**
 * Tipos para Patient com campos estendidos conforme Declaração de Óbito
 */

// Enums para campos padronizados
export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
  OTHER = 'O',
  UNKNOWN = 'UNKNOWN'
}

export enum RaceColor {
  WHITE = 'branca',
  BLACK = 'preta',
  BROWN = 'parda',
  YELLOW = 'amarela',
  INDIGENOUS = 'indigena',
  UNKNOWN = 'ignorado'
}

export enum MaritalStatus {
  SINGLE = 'solteiro',
  MARRIED = 'casado',
  WIDOWED = 'viuvo',
  DIVORCED = 'divorciado',
  LEGALLY_SEPARATED = 'separado_judicialmente',
  UNKNOWN = 'ignorado'
}

export enum EducationLevel {
  NONE = 'nenhuma',
  ELEMENTARY_INCOMPLETE = 'fundamental_incompleto',
  ELEMENTARY_COMPLETE = 'fundamental_completo',
  HIGH_SCHOOL_INCOMPLETE = 'medio_incompleto',
  HIGH_SCHOOL_COMPLETE = 'medio_completo',
  COLLEGE_INCOMPLETE = 'superior_incompleto',
  COLLEGE_COMPLETE = 'superior_completo',
  UNKNOWN = 'ignorado'
}

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DECEASED = 'deceased'
}

// Interface completa do Patient
export interface Patient {
  id: string;
  organizationId: string;

  // Identificação (obrigatórios)
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;

  // Documentos
  cpf?: string;
  cns?: string; // Cartão Nacional de Saúde
  rg?: string;
  patientCode: string; // Gerado pelo sistema

  // Dados Familiares (essenciais para DO)
  motherName: string; // Obrigatório
  fatherName?: string;

  // Naturalidade
  birthCity?: string;
  birthState?: string;
  birthCountry?: string;

  // Contato
  phone?: string;
  email?: string;

  // Endereço Completo (essencial para DO)
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Dados Demográficos (para DO)
  raceColor?: RaceColor;
  maritalStatus?: MaritalStatus;

  // Dados Socioeconômicos (para DO)
  educationLevel?: EducationLevel;
  occupation?: string;
  occupationCboCode?: string; // Código CBO 2002

  // Dados Clínicos
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;

  // Status e Controle
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
}

// DTO para criação de paciente
export interface PatientCreateRequest {
  // Obrigatórios
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  motherName: string;

  // Documentos (CPF ou CNS obrigatório)
  cpf?: string;
  cns?: string;
  rg?: string;

  // Dados Familiares
  fatherName?: string;

  // Naturalidade
  birthCity?: string;
  birthState?: string;
  birthCountry?: string;

  // Contato
  phone?: string;
  email?: string;

  // Endereço
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Dados Demográficos
  raceColor?: RaceColor;
  maritalStatus?: MaritalStatus;

  // Dados Socioeconômicos
  educationLevel?: EducationLevel;
  occupation?: string;
  occupationCboCode?: string;

  // Dados Clínicos
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
}

// DTO para atualização
export interface PatientUpdateRequest extends Partial<PatientCreateRequest> {}

// DTO para busca
export interface PatientSearchParams {
  query?: string;
  type?: 'cpf' | 'cns' | 'name' | 'motherName';
  status?: PatientStatus;
  page?: number;
  size?: number;
}

// Response de identificação
export interface PatientIdentification {
  patientId: string;
  patientCode: string;
  attendanceNumber: string;
  fullName: string;
  dateOfBirth: string;
  barcode: string;
  printedAt: string;
  printedBy: string;
}

// Labels para exibição
export const GenderLabels: Record<Gender, string> = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Feminino',
  [Gender.OTHER]: 'Outro',
  [Gender.UNKNOWN]: 'Não Informado'
};

export const RaceColorLabels: Record<RaceColor, string> = {
  [RaceColor.WHITE]: 'Branca',
  [RaceColor.BLACK]: 'Preta',
  [RaceColor.BROWN]: 'Parda',
  [RaceColor.YELLOW]: 'Amarela',
  [RaceColor.INDIGENOUS]: 'Indígena',
  [RaceColor.UNKNOWN]: 'Não Informado'
};

export const MaritalStatusLabels: Record<MaritalStatus, string> = {
  [MaritalStatus.SINGLE]: 'Solteiro(a)',
  [MaritalStatus.MARRIED]: 'Casado(a)',
  [MaritalStatus.WIDOWED]: 'Viúvo(a)',
  [MaritalStatus.DIVORCED]: 'Divorciado(a)',
  [MaritalStatus.LEGALLY_SEPARATED]: 'Separado(a) Judicialmente',
  [MaritalStatus.UNKNOWN]: 'Não Informado'
};

export const EducationLevelLabels: Record<EducationLevel, string> = {
  [EducationLevel.NONE]: 'Nenhuma',
  [EducationLevel.ELEMENTARY_INCOMPLETE]: 'Fundamental Incompleto (1ª a 8ª série)',
  [EducationLevel.ELEMENTARY_COMPLETE]: 'Fundamental Completo',
  [EducationLevel.HIGH_SCHOOL_INCOMPLETE]: 'Médio Incompleto (2º grau)',
  [EducationLevel.HIGH_SCHOOL_COMPLETE]: 'Médio Completo',
  [EducationLevel.COLLEGE_INCOMPLETE]: 'Superior Incompleto',
  [EducationLevel.COLLEGE_COMPLETE]: 'Superior Completo',
  [EducationLevel.UNKNOWN]: 'Não Informado'
};

// Estados do Brasil
export const BrazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
];

// Tipos sanguíneos
export const BloodTypes = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

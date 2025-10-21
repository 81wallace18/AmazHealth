/**
 * Validadores para documentos brasileiros
 * Utilizados nas validações do schema Zod
 */

/**
 * Valida CPF (Cadastro de Pessoa Física)
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;

  return true;
}

/**
 * Valida CNS (Cartão Nacional de Saúde)
 * @param cns - CNS com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validateCNS(cns: string): boolean {
  if (!cns) return false;

  // Remove caracteres não numéricos
  const cleaned = cns.replace(/\D/g, '');

  // CNS deve ter 15 dígitos
  if (cleaned.length !== 15) return false;

  // CNS começando com 1 ou 2 (definitivo)
  if (cleaned[0] === '1' || cleaned[0] === '2') {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(cleaned[i]) * (15 - i);
    }
    return sum % 11 === 0;
  }

  // CNS começando com 7, 8 ou 9 (provisório)
  if (cleaned[0] === '7' || cleaned[0] === '8' || cleaned[0] === '9') {
    let sum = 0;
    for (let i = 0; i < 15; i++) {
      sum += parseInt(cleaned[i]) * (15 - i);
    }
    return sum % 11 === 0;
  }

  return false;
}

/**
 * Valida CEP (Código de Endereçamento Postal)
 * @param cep - CEP com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validateCEP(cep: string): boolean {
  if (!cep) return false;

  // Remove caracteres não numéricos
  const cleaned = cep.replace(/\D/g, '');

  // CEP deve ter 8 dígitos
  return cleaned.length === 8;
}

/**
 * Valida telefone brasileiro
 * @param phone - Telefone com ou sem formatação
 * @returns true se válido, false caso contrário
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Telefone deve ter 10 (fixo) ou 11 (celular) dígitos
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Valida se a data de nascimento é válida
 * @param dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns true se válido, false caso contrário
 */
export function validateDateOfBirth(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  const now = new Date();

  // Verifica se a data é válida
  if (isNaN(date.getTime())) return false;

  // Calcula idade em anos
  const age = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

  // Idade deve estar entre 0 e 150 anos
  return age >= 0 && age <= 150;
}

/**
 * Valida email
 * @param email - Email a ser validado
 * @returns true se válido, false caso contrário
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Aplica máscara de CPF
 * @param value - Valor sem formatação
 * @returns CPF formatado (000.000.000-00)
 */
export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);

  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }

  return value;
}

/**
 * Aplica máscara de CNS
 * @param value - Valor sem formatação
 * @returns CNS formatado (000 0000 0000 0000)
 */
export function formatCNS(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})(\d{4})$/);

  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }

  return value;
}

/**
 * Aplica máscara de CEP
 * @param value - Valor sem formatação
 * @returns CEP formatado (00000-000)
 */
export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{5})(\d{3})$/);

  if (match) {
    return `${match[1]}-${match[2]}`;
  }

  return value;
}

/**
 * Aplica máscara de telefone
 * @param value - Valor sem formatação
 * @returns Telefone formatado (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  // Celular (11 dígitos)
  if (cleaned.length === 11) {
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }

  // Fixo (10 dígitos)
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }

  return value;
}

/**
 * Remove formatação de string
 * @param value - Valor formatado
 * @returns Valor sem formatação (apenas números)
 */
export function removeFormatting(value: string): string {
  return value.replace(/\D/g, '');
}

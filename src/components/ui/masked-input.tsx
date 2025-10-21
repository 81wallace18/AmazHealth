import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatCPF,
  formatCNS,
  formatCEP,
  formatPhone,
  removeFormatting
} from "@/utils/validators";

export type MaskType = 'cpf' | 'cns' | 'cep' | 'phone' | 'rg' | 'none';

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: MaskType;
  onValueChange?: (value: string, unmaskedValue: string) => void;
}

/**
 * Input com máscara automática para documentos brasileiros
 * Suporta: CPF, CNS, CEP, Telefone
 */
const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onValueChange, value, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value?.toString() || '');

    // Aplica a máscara apropriada
    const applyMask = (rawValue: string): string => {
      const cleaned = removeFormatting(rawValue);

      switch (mask) {
        case 'cpf':
          // Limita a 11 dígitos
          const cpfCleaned = cleaned.slice(0, 11);
          return formatCPF(cpfCleaned);

        case 'cns':
          // Limita a 15 dígitos
          const cnsCleaned = cleaned.slice(0, 15);
          return formatCNS(cnsCleaned);

        case 'cep':
          // Limita a 8 dígitos
          const cepCleaned = cleaned.slice(0, 8);
          return formatCEP(cepCleaned);

        case 'phone':
          // Limita a 11 dígitos (celular)
          const phoneCleaned = cleaned.slice(0, 11);
          return formatPhone(phoneCleaned);

        case 'rg':
          // RG aceita letras e números, limita a 20 caracteres
          return rawValue.slice(0, 20);

        case 'none':
        default:
          return rawValue;
      }
    };

    // Atualiza o valor quando a prop value muda (controlled component)
    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(applyMask(value.toString()));
      }
    }, [value, mask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const masked = applyMask(rawValue);
      const unmasked = removeFormatting(rawValue);

      setDisplayValue(masked);

      if (onValueChange) {
        onValueChange(masked, unmasked);
      }
    };

    return (
      <Input
        type="text"
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        className={cn(className)}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };

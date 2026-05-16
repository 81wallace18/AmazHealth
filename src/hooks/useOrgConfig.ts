import { useAuth } from './useAuth';

/**
 * Acesso aos 3 eixos de feature flags da organização ativa:
 *
 *   - `hasModule(name)`     — domínio funcional (URGENCIA, FARMACIA, ...)
 *   - `hasIntegration(name)` — conectores externos (HORUS_PHARMACY, HORUS_LEGACY, ESUS_AF, ESUS_PEC, ...)
 *   - `hasPolicy(key)`       — policy booleana (night_shift_review, ...)
 *   - `getPolicy(key)`       — valor cru da policy (qualquer tipo)
 *
 * Backwards-compat: enquanto orgs não popularam os arrays, retorna `false` (UI fica oculta
 * por padrão para orgs novas; UBS Serra já tem tudo populado pelo seed da V77).
 *
 * Constantes públicas em `INTEGRATIONS` e `POLICIES` para evitar typos espalhados.
 */
export const INTEGRATIONS = {
  HORUS_PHARMACY: 'HORUS_PHARMACY',
  HORUS_LEGACY: 'HORUS_LEGACY',
  ESUS_AF: 'ESUS_AF',
  ESUS_PEC: 'ESUS_PEC',
} as const;

export const POLICIES = {
  NIGHT_SHIFT_REVIEW: 'night_shift_review',
  NURSING_TECHNICIAN_CAN_TRIAGE: 'nursing_technician_can_triage',
  NURSING_TECHNICIAN_CAN_RECORD_EVOLUTION: 'nursing_technician_can_record_evolution',
  NURSING_TECHNICIAN_CAN_DISPENSE: 'nursing_technician_can_dispense',
} as const;

export type IntegrationName = (typeof INTEGRATIONS)[keyof typeof INTEGRATIONS];
export type PolicyKey = (typeof POLICIES)[keyof typeof POLICIES];

export function useOrgConfig() {
  const { user } = useAuth();

  const hasModule = (name: string): boolean =>
    Array.isArray(user?.enabledModules) && (user!.enabledModules as string[]).includes(name);

  const hasIntegration = (name: string): boolean =>
    Array.isArray(user?.integrations) && (user!.integrations as string[]).includes(name);

  const getPolicy = <T = unknown>(key: string, defaultValue?: T): T | undefined => {
    const policies = user?.operationalPolicies;
    if (!policies || typeof policies !== 'object') return defaultValue;
    const value = (policies as Record<string, unknown>)[key];
    return (value as T) ?? defaultValue;
  };

  const hasPolicy = (key: string): boolean => Boolean(getPolicy<boolean>(key, false));

  return {
    hasModule,
    hasIntegration,
    hasPolicy,
    getPolicy,
  };
}

/**
 * Lista de usuários conhecidos (já logados neste device) — para o picker estilo Netflix.
 *
 * Persistência: localStorage. Não armazena senhas nem tokens — só metadata pra renderizar o picker.
 * Cap de 10 usuários, ordenado por último login. "Esquecer" remove do device.
 */

const STORAGE_KEY = 'amazhealth_known_users';
const MAX_USERS = 10;

export interface KnownUser {
  /** Identificador usado no login (username ou email). */
  login: string;
  /** Nome completo pra display (ex: "Dr. Wallace Patrick"). */
  fullName?: string;
  /** Nome da organização ativa pra dar contexto. */
  organizationName?: string;
  /** Iniciais pra avatar quando não houver foto. */
  initials?: string;
  /** Epoch ms do último login bem-sucedido. */
  lastLoginAt: number;
}

function loadAll(): KnownUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as KnownUser[];
  } catch {
    return [];
  }
}

function saveAll(users: KnownUser[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function computeInitials(fullName?: string, login?: string): string {
  const source = (fullName ?? login ?? '?').trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const knownUsers = {
  list(): KnownUser[] {
    return loadAll().sort((a, b) => b.lastLoginAt - a.lastLoginAt);
  },

  upsert(input: { login: string; fullName?: string; organizationName?: string }): void {
    const all = loadAll();
    const idx = all.findIndex((u) => u.login.toLowerCase() === input.login.toLowerCase());
    const entry: KnownUser = {
      login: input.login,
      fullName: input.fullName ?? all[idx]?.fullName,
      organizationName: input.organizationName ?? all[idx]?.organizationName,
      initials: computeInitials(input.fullName, input.login),
      lastLoginAt: Date.now(),
    };
    if (idx >= 0) {
      all[idx] = entry;
    } else {
      all.push(entry);
    }
    // Mantém até MAX_USERS, descartando os mais antigos
    const sorted = all.sort((a, b) => b.lastLoginAt - a.lastLoginAt).slice(0, MAX_USERS);
    saveAll(sorted);
  },

  forget(login: string): void {
    const all = loadAll().filter((u) => u.login.toLowerCase() !== login.toLowerCase());
    saveAll(all);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};

import api from './api';
import { desktopBridge } from './desktopBridge';
import type { OperationType, OutboxEntry, SyncEngineState, SyncReport, OutboxStatus } from '../services/sync';

/**
 * Facade que decide entre POST direto (online) e enqueue na outbox local (offline ou desktop não-conectado).
 *
 * Regras:
 *  - Em ambiente browser puro (sem desktopBridge): sempre POST direto.
 *  - Em ambiente desktop online: POST direto. Em paralelo, sync_now() processa eventual outbox legada.
 *  - Em ambiente desktop offline: enqueue na outbox. Retorna optimistic response com client_uuid.
 *
 * O caller pode ignorar a distinção; o tipo `MutationResult` carrega ambos os mundos.
 */

export interface MutationResult<T = unknown> {
  /** true se foi aplicado no backend imediatamente. */
  acked: boolean;
  /** ID provisório (clientUuid) usado quando enfileirado offline; ou ID definitivo do servidor. */
  id: string;
  /** Resposta direta do backend (apenas quando `acked === true`). */
  data?: T;
}

export interface EnqueueOptions {
  /** Timestamp clínico real da ação (epoch ms). Default: agora. */
  clientCreatedAt?: number;
}

const ENDPOINT_MAP: Record<OperationType, { method: 'POST' | 'PUT'; path: (payload: any) => string }> = {
  createVisit: { method: 'POST', path: () => '/attendances' },
  recordTriage: { method: 'POST', path: () => '/triage' },
  registerEvolution: { method: 'POST', path: (p) => `/medical-records/${p.visitId}/evolution` },
  createPrescription: { method: 'POST', path: () => '/prescriptions' },
  dispenseMedication: { method: 'POST', path: (p) => `/pharmacy/dispense/${p.prescriptionId}` },
  emergencyBypass: { method: 'POST', path: () => '/attendances/emergency-bypass' },
  finalizeVisit: { method: 'POST', path: (p) => `/attendances/${p.visitId}/finalize` },
};

async function isCurrentlyOnline(): Promise<boolean> {
  // Hint do navegador é o sinal mais barato.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return true;
}

async function postDirect<T>(operationType: OperationType, payload: any): Promise<T> {
  const cfg = ENDPOINT_MAP[operationType];
  const path = cfg.path(payload);
  const response = await api.request<T>({ method: cfg.method, url: path, data: payload });
  return response.data;
}

async function enqueueOffline(
  operationType: OperationType,
  payload: unknown,
  options: EnqueueOptions
): Promise<string> {
  return desktopBridge.invoke<string>('outbox_enqueue', {
    request: {
      operation_type: operationType,
      payload,
      client_created_at: options.clientCreatedAt ?? Date.now(),
    },
  });
}

export const apiClient = {
  async mutate<T = unknown>(
    operationType: OperationType,
    payload: any,
    options: EnqueueOptions = {}
  ): Promise<MutationResult<T>> {
    const desktop = desktopBridge.isAvailable();
    const online = await isCurrentlyOnline();

    if (online) {
      try {
        const data = await postDirect<T & { id?: string }>(operationType, payload);
        const id = (data as any)?.id ?? (data as any)?.uuid ?? '';
        return { acked: true, id: String(id), data };
      } catch (e) {
        // Em desktop, qualquer erro de rede vira enqueue. Em browser puro, propaga.
        if (!desktop || !isNetworkError(e)) throw e;
      }
    }

    if (!desktop) {
      throw new Error('Operação offline solicitada em ambiente sem suporte (browser puro).');
    }

    const clientUuid = await enqueueOffline(operationType, payload, options);
    return { acked: false, id: clientUuid };
  },

  async outboxList(filter?: { status?: OutboxStatus; limit?: number }): Promise<OutboxEntry[]> {
    if (!desktopBridge.isAvailable()) return [];
    return desktopBridge.invoke<OutboxEntry[]>('outbox_list', { filter });
  },

  async syncNow(): Promise<SyncReport | null> {
    if (!desktopBridge.isAvailable()) return null;
    return desktopBridge.invoke<SyncReport>('sync_now');
  },

  async syncState(): Promise<SyncEngineState | null> {
    if (!desktopBridge.isAvailable()) return null;
    return desktopBridge.invoke<SyncEngineState>('sync_engine_state');
  },

  async configureSync(baseUrl: string, accessToken: string): Promise<void> {
    if (!desktopBridge.isAvailable()) return;
    await desktopBridge.invoke('sync_configure', { baseUrl, accessToken });
  },

  async updateSyncToken(accessToken: string): Promise<void> {
    if (!desktopBridge.isAvailable()) return;
    await desktopBridge.invoke('sync_update_token', { accessToken });
  },
};

function isNetworkError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as { code?: string; response?: unknown; message?: string };
  if (err.response) return false; // tem response → não é falha de rede
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
  if (typeof err.message === 'string' && /network|timeout|fetch failed/i.test(err.message)) return true;
  return false;
}

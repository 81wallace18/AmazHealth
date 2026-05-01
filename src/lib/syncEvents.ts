import { desktopBridge } from './desktopBridge';
import { queryClient } from './persistedQueryClient';
import { toast } from 'sonner';

export const SYNC_EVENTS = {
  RAN: 'outbox://sync-ran',
  CONFLICT: 'outbox://conflict',
  REJECTED: 'outbox://rejected',
  ACKED: 'outbox://acked',
} as const;

interface ResultPayload {
  clientUuid?: string;
  client_uuid?: string;
  status?: string;
  error?: string | null;
}

interface ReportPayload {
  attempted: number;
  acked: number;
  conflicted: number;
  rejected: number;
  failed: number;
}

let installed = false;
const unlisteners: Array<() => void> = [];

export async function installSyncEventListeners(): Promise<void> {
  if (installed) return;
  if (!desktopBridge.isAvailable()) return;
  installed = true;

  const subscriptions = await Promise.all([
    desktopBridge.listen<ResultPayload>(SYNC_EVENTS.ACKED, (payload) => {
      queryClient.invalidateQueries();
      // toast silencioso — não interromper trabalho do usuário
      console.debug('[sync] ACKED', payload);
    }),
    desktopBridge.listen<ResultPayload>(SYNC_EVENTS.CONFLICT, (payload) => {
      toast.warning(
        'Conflito detectado em mutation pendente. Veja Fila de sincronização.',
        { description: payload.error ?? undefined, duration: 8000 }
      );
    }),
    desktopBridge.listen<ResultPayload>(SYNC_EVENTS.REJECTED, (payload) => {
      toast.error(
        'Mutation rejeitada pelo servidor.',
        { description: payload.error ?? undefined, duration: 10000 }
      );
    }),
    desktopBridge.listen<ReportPayload>(SYNC_EVENTS.RAN, (payload) => {
      if (payload.acked > 0) {
        queryClient.invalidateQueries();
      }
    }),
  ]);

  unlisteners.push(...subscriptions);
}

export function uninstallSyncEventListeners(): void {
  while (unlisteners.length) {
    const fn = unlisteners.pop();
    fn?.();
  }
  installed = false;
}

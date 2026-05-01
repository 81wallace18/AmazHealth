import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { apiClient } from '@/lib/apiClient';
import { desktopBridge } from '@/lib/desktopBridge';
import type { SyncEngineState } from '@/services/sync';

const REFRESH_MS = 5_000;

export function SyncBanner() {
  const { online } = useOnlineStatus();
  const [engineState, setEngineState] = useState<SyncEngineState | null>(null);
  const desktop = desktopBridge.isAvailable();

  useEffect(() => {
    if (!desktop) return;
    let cancelled = false;
    async function tick() {
      try {
        const s = await apiClient.syncState();
        if (!cancelled) setEngineState(s);
      } catch {
        // silent
      }
    }
    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [desktop]);

  if (!desktop && online) return null; // browser online → sem banner
  if (online && (engineState?.pending_count ?? 0) === 0) return null;

  const pending = engineState?.pending_count ?? 0;
  const running = engineState?.running ?? false;

  if (!online) {
    return (
      <div className="flex items-center justify-between gap-2 bg-amber-100 px-4 py-2 text-sm text-amber-900 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">Modo offline</span>
          {pending > 0 && <span>· {pending} {pending === 1 ? 'ação pendente' : 'ações pendentes'}</span>}
        </div>
        <span className="text-xs text-amber-800">Suas ações serão sincronizadas automaticamente quando a conexão voltar.</span>
      </div>
    );
  }

  if (running) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 text-sm text-blue-900 border-b border-blue-200">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Sincronizando {pending} {pending === 1 ? 'ação' : 'ações'}…</span>
      </div>
    );
  }

  if (pending > 0) {
    return (
      <div className="flex items-center justify-between gap-2 bg-blue-50 px-4 py-2 text-sm text-blue-900 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          <span>{pending} {pending === 1 ? 'ação aguardando' : 'ações aguardando'} sincronização</span>
        </div>
        <button
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          onClick={() => apiClient.syncNow().catch(() => {})}
        >
          Sincronizar agora
        </button>
      </div>
    );
  }

  return null;
}

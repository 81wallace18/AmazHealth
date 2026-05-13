import { useEffect, useRef, useState } from 'react';

const HEALTH_PATH = '/status';
const PING_INTERVAL_MS = 15_000;
const PING_TIMEOUT_MS = 5_000;

function resolveHealthUrl(): string {
  const base = import.meta.env.VITE_API_URL || '/api/v1';
  return `${String(base).replace(/\/$/, '')}${HEALTH_PATH}`;
}

export interface OnlineStatus {
  online: boolean;
  lastCheckedAt: number | null;
  lastErrorAt: number | null;
}

/**
 * Pinga `${VITE_API_URL}/status` a cada 15s e reflete o estado online/offline.
 *
 * Combina com `navigator.onLine` (sinal do SO) — se navegador disser offline, marca offline
 * imediatamente sem esperar o próximo ping.
 */
export function useOnlineStatus(): OnlineStatus {
  const [state, setState] = useState<OnlineStatus>(() => ({
    online: navigator.onLine,
    lastCheckedAt: null,
    lastErrorAt: null,
  }));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = resolveHealthUrl();

    async function ping() {
      if (cancelled) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'omit',
        });
        if (cancelled) return;
        const ok = response.ok;
        setState((prev) => ({
          online: ok,
          lastCheckedAt: Date.now(),
          lastErrorAt: ok ? prev.lastErrorAt : Date.now(),
        }));
      } catch {
        if (cancelled) return;
        setState((prev) => ({
          online: false,
          lastCheckedAt: Date.now(),
          lastErrorAt: Date.now(),
        }));
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    ping();
    const intervalId = window.setInterval(ping, PING_INTERVAL_MS);

    function handleBrowserOnline() {
      ping();
    }
    function handleBrowserOffline() {
      setState((prev) => ({ ...prev, online: false, lastErrorAt: Date.now() }));
    }
    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
    };
  }, []);

  return state;
}

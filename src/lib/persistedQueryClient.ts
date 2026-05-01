import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { desktopBridge } from './desktopBridge';

/**
 * QueryClient compartilhado pela aplicação.
 *
 * Em modo desktop (Tauri 2), o cache é persistido no SQLite local via comandos do sidecar
 * (db_query / db_execute na tabela sync_metadata). Em modo browser, recai para localStorage.
 *
 * `staleTime` por entidade fica nas chamadas de useQuery; aqui só o default global.
 */

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5min default — entidades clínicas sobrescrevem
      gcTime: 1000 * 60 * 60 * 24, // 24h — manter cache em disco mesmo após unmount
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: 'always',
    },
  },
});

const SYNC_META_KEY = 'tanstack_query_cache';

const desktopAsyncStorage = {
  async getItem(_key: string): Promise<string | null> {
    if (!desktopBridge.isAvailable()) return null;
    try {
      const rows = await desktopBridge.invoke<Array<{ value: string }>>('db_query', {
        sql: 'SELECT value FROM sync_metadata WHERE key = ?1',
        params: [SYNC_META_KEY],
      });
      return rows[0]?.value ?? null;
    } catch {
      return null;
    }
  },
  async setItem(_key: string, value: string): Promise<void> {
    if (!desktopBridge.isAvailable()) return;
    const now = Date.now();
    await desktopBridge.invoke('db_execute', {
      sql:
        'INSERT INTO sync_metadata(key, value, updated_at) VALUES(?1, ?2, ?3) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      params: [SYNC_META_KEY, value, now],
    });
  },
  async removeItem(_key: string): Promise<void> {
    if (!desktopBridge.isAvailable()) return;
    await desktopBridge.invoke('db_execute', {
      sql: 'DELETE FROM sync_metadata WHERE key = ?1',
      params: [SYNC_META_KEY],
    });
  },
};

const browserAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

export const persister = createAsyncStoragePersister({
  storage: desktopBridge.isAvailable() ? desktopAsyncStorage : browserAsyncStorage,
  key: SYNC_META_KEY,
  throttleTime: 1000,
});

export const persistOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
};

/**
 * Bridge entre o frontend React e o sidecar Rust do AmazHealth Desktop (Tauri 2).
 *
 * Uso típico:
 *
 *   if (desktopBridge.isAvailable()) {
 *     await desktopBridge.invoke('open_database', { password });
 *   }
 *
 * Em modo browser (web puro), `isAvailable()` retorna `false` e `invoke` lança.
 */

type TauriInvoke = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

interface DesktopBridge {
  isAvailable: () => boolean;
  invoke: TauriInvoke;
  listen: <T>(event: string, handler: (payload: T) => void) => Promise<() => void>;
}

let cachedInvoke: TauriInvoke | null = null;
let cachedListen: ((event: string, handler: (payload: unknown) => void) => Promise<() => void>) | null = null;

function detectTauri(): boolean {
  if (typeof window === 'undefined') return false;
  // Tauri 2 marker — preferido. Em Tauri 1 era window.__TAURI__.
  // @ts-expect-error — marker injetado pelo runtime Tauri
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

async function loadInvoke(): Promise<TauriInvoke> {
  if (cachedInvoke) return cachedInvoke;
  // Import dinâmico — em build web, esse módulo nem precisa existir.
  const mod = await import(/* @vite-ignore */ '@tauri-apps/api/core');
  cachedInvoke = mod.invoke as TauriInvoke;
  return cachedInvoke;
}

async function loadListen() {
  if (cachedListen) return cachedListen;
  const mod = await import(/* @vite-ignore */ '@tauri-apps/api/event');
  cachedListen = async (event, handler) => {
    const unlisten = await mod.listen(event, (e: { payload: unknown }) => handler(e.payload));
    return unlisten;
  };
  return cachedListen;
}

export const desktopBridge: DesktopBridge = {
  isAvailable: detectTauri,

  invoke: async <T,>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
    if (!detectTauri()) {
      throw new Error(`desktopBridge.invoke('${cmd}') called outside Tauri runtime`);
    }
    const invoke = await loadInvoke();
    return invoke<T>(cmd, args);
  },

  listen: async <T,>(event: string, handler: (payload: T) => void): Promise<() => void> => {
    if (!detectTauri()) {
      return () => {};
    }
    const listen = await loadListen();
    return listen(event, handler as (payload: unknown) => void);
  },
};

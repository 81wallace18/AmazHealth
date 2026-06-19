import { useEffect, useRef } from 'react';

interface IdleTimeoutOptions {
  /** Milissegundos sem atividade até disparar `onTimeout`. Default 15min. */
  idleMs?: number;
  /** Milissegundos antes do timeout pra avisar via `onWarning`. Default 1min. */
  warningMs?: number;
  /** Disparado uma vez quando o usuário está prestes a expirar. */
  onWarning?: () => void;
  /** Disparado quando expira (chame logout aqui). */
  onTimeout: () => void;
  /** Habilitar/desabilitar o monitoramento. Default true. */
  enabled?: boolean;
}

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

/**
 * Monitora atividade do usuário e dispara logout após inatividade configurada.
 *
 * Ataca o cenário de PC esquecido aberto na UBS — após 15min sem mouse/keyboard, força
 * logout e (no desktop) fecha a conexão SQLCipher liberando o token de sessão. Usuário
 * teria que digitar a senha de novo no picker.
 *
 * Eventos monitorados são throttled internamente (resync do timer no máximo 1x por segundo)
 * pra não causar overhead em apps com muito mouse-move.
 */
export function useIdleTimeout({
  idleMs = 15 * 60 * 1000,
  warningMs = 60 * 1000,
  onWarning,
  onTimeout,
  enabled = true,
}: IdleTimeoutOptions) {
  const lastActivityRef = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const reset = () => {
      lastActivityRef.current = Date.now();
      warnedRef.current = false;
    };

    let throttled = 0;
    const handler = () => {
      const now = Date.now();
      if (now - throttled < 500) return;
      throttled = now;
      reset();
    };

    const tick = () => {
      const now = Date.now();
      const idle = now - lastActivityRef.current;
      if (idle >= idleMs) {
        onTimeout();
        return;
      }
      if (!warnedRef.current && idle >= idleMs - warningMs) {
        warnedRef.current = true;
        onWarning?.();
      }
      timerRef.current = setTimeout(tick, 1000);
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, handler, { passive: true })
    );
    timerRef.current = setTimeout(tick, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, idleMs, warningMs, onTimeout, onWarning]);
}

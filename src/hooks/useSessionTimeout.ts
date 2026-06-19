import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface UseSessionTimeoutOptions {
  /**
   * Tempo de inatividade em milissegundos antes de deslogar
   * @default 900000 (15 minutos)
   */
  timeout?: number;

  /**
   * Tempo em milissegundos para mostrar aviso antes do logout
   * @default 60000 (1 minuto)
   */
  warningTime?: number;

  /**
   * Eventos que resetam o timer de inatividade
   * @default ['mousedown', 'keydown', 'scroll', 'touchstart']
   */
  events?: string[];

  /**
   * Callback executado quando a sessão expira.
   */
  onTimeout?: () => void;
}

/**
 * Hook para gerenciar timeout de sessão automático
 *
 * Para sistemas hospitalares (HIS):
 * - Protege contra acesso não autorizado quando usuário se afasta
 * - Exigido por LGPD e boas práticas de segurança médica
 * - Avisa antes de deslogar para não perder trabalho
 *
 * Uso:
 * ```tsx
 * function App() {
 *   useSessionTimeout({
 *     timeout: 15 * 60 * 1000, // 15 minutos
 *     warningTime: 60 * 1000,  // 1 minuto de aviso
 *   });
 * }
 * ```
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    timeout = 15 * 60 * 1000, // 15 minutos default
    warningTime = 60 * 1000, // 1 minuto default
    events = ['mousedown', 'keydown', 'scroll', 'touchstart'],
    onTimeout,
  } = options;

  const { signOut, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(warningTime);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const resetTimer = () => {
    // Limpa timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    setShowWarning(false);
    setTimeLeftMs(warningTime);

    // Timer de aviso
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeLeftMs(warningTime);
      countdownRef.current = setInterval(() => {
        setTimeLeftMs((prev) => {
          if (prev <= 1000) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }, timeout - warningTime);

    // Timer de logout
    timeoutRef.current = setTimeout(() => {
      console.log('[SessionTimeout] Deslogando por inatividade');
      if (onTimeout) {
        onTimeout();
      } else {
        signOut();
      }
    }, timeout);
  };

  useEffect(() => {
    // Só ativa se estiver autenticado
    if (!isAuthenticated) {
      return;
    }

    // Inicia timer
    resetTimer();

    // Adiciona listeners para resetar timer
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, timeout, warningTime, events, onTimeout, signOut]);

  return {
    showWarning,
    resetTimer,
    timeLeftMs,
  };
}

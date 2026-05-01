import { QueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Pre-fetch das entidades necessárias para o fluxo offline imediatamente após login bem-sucedido.
 *
 * Roda apenas no desktop ou quando explicitamente disparado — em ambiente web puro o cache padrão
 * já cobre os fluxos sem necessidade de pre-fetch.
 *
 * Falhas individuais são silenciosas: cache parcial é aceitável.
 */
export async function postLoginPrefetch(queryClient: QueryClient): Promise<void> {
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['patients', 'active'],
      queryFn: async () => (await api.get('/patients?active=true')).data,
      staleTime: 1000 * 60 * 60, // 1h
    }),
    queryClient.prefetchQuery({
      queryKey: ['pharmacy', 'stock'],
      queryFn: async () => (await api.get('/pharmacy/stock')).data,
      staleTime: 1000 * 60 * 5, // 5min
    }),
    queryClient.prefetchQuery({
      queryKey: ['sectors'],
      queryFn: async () => (await api.get('/sectors')).data,
      staleTime: 1000 * 60 * 60 * 24, // 24h
    }),
    queryClient.prefetchQuery({
      queryKey: ['duties', 'active'],
      queryFn: async () => (await api.get('/duties/active')).data,
      staleTime: 1000 * 60 * 60, // 1h
    }),
  ]);
}

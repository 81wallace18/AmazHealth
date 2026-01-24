import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Centralized error handling for API calls
 * Handles 401 (unauthorized) and 403 (forbidden) consistently
 */
export function useApiError() {
  const navigate = useNavigate();

  const handleError = (error: any) => {
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          toast.error('Sessão expirada. Faça login novamente.');
          navigate('/auth');
          break;
          
        case 403:
          toast.error('Você não tem permissão para realizar esta ação.');
          break;
          
        case 404:
          toast.error('Recurso não encontrado.');
          break;
          
        case 422:
          const errors = error.response.data?.errors;
          if (errors && Array.isArray(errors)) {
            errors.forEach((err: any) => {
              toast.error(err.message || err);
            });
          } else {
            toast.error(error.response.data?.message || 'Dados inválidos.');
          }
          break;
          
        case 500:
          toast.error('Erro interno do servidor. Tente novamente mais tarde.');
          break;
          
        default:
          toast.error(error.response.data?.message || 'Ocorreu um erro inesperado.');
      }
    } else if (error.request) {
      toast.error('Falha de conexão. Verifique sua internet.');
    } else {
      toast.error('Ocorreu um erro inesperado.');
    }
  };

  return { handleError };
}

import { toast } from 'sonner';

/**
 * Handles Supabase errors in a standard way
 * @param error The error object from Supabase
 * @param defaultMessage A fallback message if error is not well formed
 */
export const handleSupabaseError = (error: unknown, defaultMessage = 'Ocorreu um erro desconhecido'): void => {
  console.error('Supabase error:', error);
  
  // Se o erro for PGRST116 (nenhum resultado), não mostrar toast
  // pois em algumas consultas isso é esperado
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
    console.log('No results found, but this may be expected');
    return;
  }
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : defaultMessage;
  
  toast.error(errorMessage);
};

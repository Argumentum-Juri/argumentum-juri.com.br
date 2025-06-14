// src/utils/utils.ts
// import { toast } from 'sonner'; // Remova o import de toast daqui, se ele só for usado aqui

/**
 * Processes Supabase errors and returns a user-friendly message string.
 * @param error The error object from Supabase
 * @param defaultMessage A fallback message if error is not well formed
 * @returns A string containing the error message, or null if the error should be ignored (e.g., PGRST116).
 */
export const handleSupabaseError = (error: unknown, defaultMessage = 'Ocorreu um erro desconhecido'): string | null => {
  console.error('Supabase error (processed by handleSupabaseError):', error);
  
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
    console.log('No results found (PGRST116), this may be expected. No message returned.');
    return null; // Retorna null para indicar que o erro deve ser ignorado pela UI
  }
  
  if (error instanceof Error) {
    return error.message; // Retorna a mensagem do erro
  }
  
  if (typeof error === 'string') { // Se o próprio erro já for uma string
    return error;
  }

  // Se for um objeto de erro do Supabase (AuthError, PostgrestError, etc.)
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return defaultMessage; // Retorna a mensagem padrão
};
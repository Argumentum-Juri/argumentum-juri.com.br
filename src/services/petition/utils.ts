
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export const handleSupabaseError = (error: unknown, defaultMessage: string): void => {
  console.error('Supabase error:', error);
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : defaultMessage;
  
  toast.error(errorMessage);
};

export const extractAuthorInfo = (authorId: string) => {
  return {
    id: authorId,
    name: '', // Will be populated from the query join
    email: '',
    avatar_url: '',
  };
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    handleSupabaseError(error, 'Erro ao obter usuário atual');
    return null;
  }
  
  return session?.user?.id || null;
};

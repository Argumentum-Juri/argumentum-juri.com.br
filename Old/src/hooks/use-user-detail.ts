
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFetchWithId } from './use-fetch-with-id';

export interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export const useUserDetail = (userId: string) => {
  // Validação específica para UUID
  const validateUserId = useCallback((id: string) => {
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }, []);

  // Função de fetch específica para usuários
  const fetchUserData = useCallback(async (id: string, options?: { signal?: AbortSignal }) => {
    const signal = options?.signal;
    
    console.log('[useUserDetail] 📡 Buscando dados do usuário...');

    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, is_admin, created_at, updated_at')
      .eq('id', id)
      .abortSignal(signal)
      .maybeSingle();

    if (signal?.aborted) {
      throw new Error('AbortError');
    }

    if (userError) {
      console.error('[useUserDetail] ❌ Erro ao buscar usuário:', userError);
      throw userError;
    }

    if (!userData) {
      throw new Error('Usuário não encontrado');
    }

    return userData as UserDetail;
  }, []);

  // Usar o hook base
  const {
    data: user,
    isLoading,
    error,
    refresh
  } = useFetchWithId({
    id: userId,
    fetchFunction: fetchUserData,
    validateId: validateUserId,
    routePattern: '/users/{id}' // Ajustar conforme suas rotas
  });

  return {
    user,
    isLoading,
    error,
    refresh
  };
};

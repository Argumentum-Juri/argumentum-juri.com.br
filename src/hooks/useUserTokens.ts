
import { useState, useEffect, useCallback } from 'react';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserTokens = () => {
  const { user, authInitialized } = useGoAuth();
  const [tokens, setTokens] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTokens = useCallback(async () => {
    if (!authInitialized || !user?.id) {
      console.log('[useUserTokens] ⏭️ Auth não inicializado ou sem usuário, parando fetch');
      setIsLoading(false);
      return;
    }

    console.log('[useUserTokens] 🪙 Buscando tokens do usuário:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_tokens')
        .select('tokens')
        .eq('user_id', user.id)
        .single();

      console.log('[useUserTokens] 📊 Response da query:', { data, fetchError });

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('[useUserTokens] 🆕 Usuário não tem registro, criando com 0 tokens');
          // Usuário não tem registro na tabela user_tokens, criar um
          const { data: insertData, error: insertError } = await supabase
            .from('user_tokens')
            .insert({ user_id: user.id, tokens: 0 })
            .select('tokens')
            .single();

          if (insertError) {
            console.error('[useUserTokens] ❌ Erro ao criar registro:', insertError);
            throw insertError;
          }
          const finalTokens = insertData?.tokens || 0;
          console.log('[useUserTokens] ✅ Registro criado com tokens:', finalTokens);
          setTokens(finalTokens);
        } else {
          console.error('[useUserTokens] ❌ Erro na query:', fetchError);
          throw fetchError;
        }
      } else {
        const finalTokens = data?.tokens || 0;
        console.log('[useUserTokens] ✅ Tokens encontrados no DB:', finalTokens);
        setTokens(finalTokens);
      }

      console.log('[useUserTokens] ✅ Tokens carregados com sucesso');
    } catch (err) {
      console.error('[useUserTokens] ❌ Erro ao buscar tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar tokens');
      setTokens(0); // Reset em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, authInitialized]);

  useEffect(() => {
    fetchUserTokens();
  }, [fetchUserTokens]);

  // Real-time listener com subscription assíncrona
  useEffect(() => {
    if (!authInitialized || !user?.id) {
      console.log('[useUserTokens] ⏭️ Real-time: Auth não inicializado ou sem usuário');
      return;
    }

    console.log('[useUserTokens] 🔔 Configurando real-time listener para user:', user.id);

    const channelName = `user_tokens_${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'user_tokens',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[useUserTokens] 🔔 Real-time UPDATE payload:', payload);
          const newRecord = payload.new as any;
          if (newRecord?.tokens !== undefined) {
            console.log('[useUserTokens] 🎯 Tokens atualizados:', newRecord.tokens);
            setTokens(newRecord.tokens);
          }
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'user_tokens',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[useUserTokens] 🔔 Real-time INSERT payload:', payload);
          const newRecord = payload.new as any;
          if (newRecord?.tokens !== undefined) {
            console.log('[useUserTokens] 🎯 Novo registro criado:', newRecord.tokens);
            setTokens(newRecord.tokens);
          }
        }
      );

    // Subscribe usando callback para status monitoring
    channel.subscribe((status) => {
      console.log('[useUserTokens] 📡 Status do canal real-time:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('[useUserTokens] ✅ Canal real-time SUBSCRIBED com sucesso');
      } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        console.error('[useUserTokens] ❌ Erro no canal real-time, fazendo fallback');
        // Fallback: refetch manual após erro
        setTimeout(() => {
          console.log('[useUserTokens] 🔄 Fallback: refazendo fetch após erro real-time');
          fetchUserTokens();
        }, 1000);
      }
    });

    // Cleanup: remover o canal quando o componente for desmontado
    return () => {
      console.log('[useUserTokens] 🧹 Removendo canal real-time:', channelName);
      supabase.removeChannel(channel);
    };
  }, [user?.id, authInitialized, fetchUserTokens]);

  const refreshTokens = useCallback(async (forceRefresh?: boolean) => {
    console.log('[useUserTokens] 🔄 refreshTokens chamado, forceRefresh:', forceRefresh);
    await fetchUserTokens();
  }, [fetchUserTokens]);

  return {
    tokens,
    isLoading,
    error,
    refreshTokens
  };
};

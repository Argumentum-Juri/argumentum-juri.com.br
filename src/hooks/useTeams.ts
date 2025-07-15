
import { useAPIContext } from '@/contexts/APIContext';
import { useTeamsAPI } from '@/hooks/useTeamsAPI';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const useTeams = () => {
  console.log('[useTeams] 🚀 Hook useTeams inicializou');
  
  const { useNewTeamsAPI } = useAPIContext();
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  
  console.log('[useTeams] 📋 Contextos:', { 
    useNewTeamsAPI, 
    hasUser: !!user, 
    authInitialized, 
    authLoading 
  });
  
  // Hook da nova API
  const newAPIHook = useTeamsAPI();
  
  // Hook legacy usando Supabase direto
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchTeamsLegacy = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      console.log('[useTeams] ⏸️ Legacy: Aguardando auth...', { authInitialized, authLoading, userId: user?.id });
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      console.log('[useTeams] ⏭️ Legacy: Já foi buscado, pulando...');
      return;
    }

    console.log(`[useTeams] 🚀 Fetching teams via Legacy API`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);
      
      if (isMountedRef.current) {
        if (error) throw error;
        
        console.log(`[useTeams] ✅ Success: ${data?.length || 0} teams (Legacy)`);
        setTeams(data || []);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[useTeams] ❌ Error (Legacy):`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading]);

  const refreshTeamsLegacy = useCallback(async () => {
    console.log(`[useTeams] 🔄 Manual refresh (Legacy)`);
    hasFetchedRef.current = false;
    await fetchTeamsLegacy(true);
  }, [fetchTeamsLegacy]);

  useEffect(() => {
    console.log('[useTeams] 🎯 useEffect principal disparado');
    if (!useNewTeamsAPI && authInitialized && !authLoading && user?.id) {
      console.log('[useTeams] 🏗️ Iniciando fetch legacy...');
      fetchTeamsLegacy(false);
    }
  }, [useNewTeamsAPI, authInitialized, authLoading, user?.id, fetchTeamsLegacy]);

  useEffect(() => {
    return () => {
      console.log('[useTeams] 💀 Cleanup');
      isMountedRef.current = false;
    };
  }, []);

  const legacyHook = {
    teams,
    isLoading,
    error,
    refreshTeams: refreshTeamsLegacy
  };
  
  // Log para debug de qual API está sendo usada
  console.log(`[useTeams] 📋 Using API: ${useNewTeamsAPI ? 'NEW (Go)' : 'LEGACY (Supabase)'}`);
  
  // Retornar o hook apropriado baseado no contexto
  if (useNewTeamsAPI) {
    console.log('[useTeams] 🆕 Retornando hook da nova API');
    return newAPIHook;
  } else {
    console.log('[useTeams] 🏗️ Retornando hook legacy');
    return legacyHook;
  }
};

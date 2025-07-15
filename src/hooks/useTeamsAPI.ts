
import { useState, useEffect, useCallback, useRef } from 'react';
import { goApiClient } from '@/lib/goApiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const useTeamsAPI = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchTeams = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useTeamsAPI] 🚀 Fetching teams via API`);
    console.log('[useTeamsAPI] Access token:', goApiClient.currentToken);
    setIsLoading(true);
    setError(null);

    try {
      const result = await goApiClient.getTeams();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const teamsData = result.data || [];
      
      // Logs temporários para debug
      console.log('useTeamsAPI RAW RESULT:', teamsData);
      console.log('AuthContext teamIds:', user);
      
      if (isMountedRef.current) {
        console.log(`[useTeamsAPI] ✅ Success: ${teamsData.length} teams`);
        setTeams(teamsData);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[useTeamsAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        
        if (!errorMessage.includes('autorizado')) {
          toast.error("Erro ao carregar equipes");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading, user]);

  const refreshTeams = useCallback(async () => {
    console.log(`[useTeamsAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchTeams(true);
  }, [fetchTeams]);

  useEffect(() => {
    console.log(`[useTeamsAPI] 🎯 Main effect triggered`);
    
    if (authInitialized && !authLoading && user?.id) {
      fetchTeams(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchTeams]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    teams,
    isLoading,
    error,
    refreshTeams
  };
};

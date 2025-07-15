
import { useAPIContext } from '@/contexts/APIContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const usePetitionSettings = () => {
  const { useNewPetitionsAPI } = useAPIContext();
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  
  // Por enquanto, configurações ainda usam Supabase direto
  // Pode ser migrado para Edge Functions no futuro se necessário
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[usePetitionSettings] 🚀 Fetching settings`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('petition_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (isMountedRef.current) {
        if (error && error.code !== 'PGRST116') throw error;
        
        console.log(`[usePetitionSettings] ✅ Success: Settings loaded`);
        setSettings(data || null);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[usePetitionSettings] ❌ Error:`, err);
      
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

  const refreshSettings = useCallback(async () => {
    console.log(`[usePetitionSettings] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchSettings(true);
  }, [fetchSettings]);

  useEffect(() => {
    if (authInitialized && !authLoading && user?.id) {
      fetchSettings(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchSettings]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    settings,
    isLoading,
    error,
    refreshSettings
  };
};

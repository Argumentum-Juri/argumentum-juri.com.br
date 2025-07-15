
import { useState, useEffect, useCallback, useRef } from 'react';
import { PetitionDetail } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const usePetitionDetailAPI = (id: string) => {
  const [petition, setPetition] = useState<PetitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchPetitionData = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id || !id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[usePetitionDetailAPI] 🚀 Fetching petition ${id} via API`);
    setIsLoading(true);
    setError(null);

    try {
      const petitionData = await apiClient.getPetitionById(id);
      
      if (isMountedRef.current) {
        console.log(`[usePetitionDetailAPI] ✅ Success: ${petitionData.title}`);
        setPetition(petitionData);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[usePetitionDetailAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        
        if (!errorMessage.includes('autorizado')) {
          toast.error("Erro ao carregar detalhes da petição");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [id, user?.id, authInitialized, authLoading]);

  const refresh = useCallback(async () => {
    console.log(`[usePetitionDetailAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchPetitionData(true);
  }, [fetchPetitionData]);

  // Effect principal
  useEffect(() => {
    console.log(`[usePetitionDetailAPI] 🎯 Main effect triggered for ID: ${id}`);
    hasFetchedRef.current = false; // Reset quando ID muda
    
    if (authInitialized && !authLoading && user?.id && id) {
      fetchPetitionData(false);
    }
  }, [id, authInitialized, authLoading, user?.id, fetchPetitionData]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    petition,
    isLoading,
    error,
    refresh
  };
};

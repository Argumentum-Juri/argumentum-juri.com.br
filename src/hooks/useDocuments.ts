
import { useAPIContext } from '@/contexts/APIContext';
import { useDocumentsAPI } from '@/hooks/useDocumentsAPI';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const useDocuments = (petitionId?: string) => {
  const { useNewDocumentsAPI } = useAPIContext();
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  
  // Hook da nova API
  const newAPIHook = useDocumentsAPI(petitionId);
  
  // Hook legacy usando Supabase direto
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchDocumentsLegacy = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useDocuments] 🚀 Fetching documents via Legacy API`);
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from('petition_documents').select('*');
      
      if (petitionId) {
        query = query.eq('petition_id', petitionId);
      }
      
      const { data, error } = await query;
      
      if (isMountedRef.current) {
        if (error) throw error;
        
        console.log(`[useDocuments] ✅ Success: ${data?.length || 0} documents (Legacy)`);
        setDocuments(data || []);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[useDocuments] ❌ Error (Legacy):`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [petitionId, user?.id, authInitialized, authLoading]);

  const refreshDocumentsLegacy = useCallback(async () => {
    console.log(`[useDocuments] 🔄 Manual refresh (Legacy)`);
    hasFetchedRef.current = false;
    await fetchDocumentsLegacy(true);
  }, [fetchDocumentsLegacy]);

  useEffect(() => {
    if (!useNewDocumentsAPI && authInitialized && !authLoading && user?.id) {
      hasFetchedRef.current = false; // Reset when petitionId changes
      fetchDocumentsLegacy(false);
    }
  }, [useNewDocumentsAPI, petitionId, authInitialized, authLoading, user?.id, fetchDocumentsLegacy]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const legacyHook = {
    documents,
    isLoading,
    error,
    refreshDocuments: refreshDocumentsLegacy
  };
  
  // Retornar o hook apropriado baseado no contexto
  return useNewDocumentsAPI ? newAPIHook : legacyHook;
};

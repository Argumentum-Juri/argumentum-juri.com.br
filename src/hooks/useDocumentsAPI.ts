
import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';

export const useDocumentsAPI = (petitionId?: string) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchDocuments = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[useDocumentsAPI] 🚀 Fetching documents via API`);
    setIsLoading(true);
    setError(null);

    try {
      let documentsData;
      if (petitionId) {
        documentsData = await apiClient.getPetitionDocuments(petitionId);
      } else {
        documentsData = await apiClient.getDocuments();
      }
      
      if (isMountedRef.current) {
        console.log(`[useDocumentsAPI] ✅ Success: ${documentsData.length} documents`);
        setDocuments(documentsData);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[useDocumentsAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        
        if (!errorMessage.includes('autorizado')) {
          toast.error("Erro ao carregar documentos");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [petitionId, user?.id, authInitialized, authLoading]);

  const refreshDocuments = useCallback(async () => {
    console.log(`[useDocumentsAPI] 🔄 Manual refresh`);
    hasFetchedRef.current = false;
    await fetchDocuments(true);
  }, [fetchDocuments]);

  useEffect(() => {
    console.log(`[useDocumentsAPI] 🎯 Main effect triggered for petition: ${petitionId}`);
    hasFetchedRef.current = false; // Reset when petitionId changes
    
    if (authInitialized && !authLoading && user?.id) {
      fetchDocuments(false);
    }
  }, [petitionId, authInitialized, authLoading, user?.id, fetchDocuments]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    documents,
    isLoading,
    error,
    refreshDocuments
  };
};

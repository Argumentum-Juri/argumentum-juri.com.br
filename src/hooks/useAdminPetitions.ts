
import { useState, useEffect, useCallback, useRef } from 'react';
import { Petition } from '@/types';
import { goApiClient } from '@/lib/goApiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';

interface AdminPetitionsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useAdminPetitions = (params: AdminPetitionsParams = {}) => {
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  // Verificar se o usuário é admin
  const isAdmin = user?.isAdmin || false;

  const fetchAdminPetitions = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id || !isAdmin) {
      console.log('[useAdminPetitions] Skipping fetch:', { 
        authInitialized, 
        authLoading, 
        hasUser: !!user?.id, 
        isAdmin 
      });
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log('[useAdminPetitions] 🚀 Fetching admin petitions via GoAPI');
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await goApiClient.getPetitions({
        page: params.page || 1,
        limit: params.limit || 100,
        sortDirection: params.sortDirection || 'desc',
        ...(params.status && { status: params.status }),
        ...(params.search && { search: params.search }),
        ...(params.sortBy && { sortBy: params.sortBy })
      });
      
      console.log('[useAdminPetitions] 🔍 RAW RESULT:', result);
      
      if (isMountedRef.current) {
        if (result.error) {
          console.error('[useAdminPetitions] ❌ Error:', result.error);
          setError(new Error(result.error));
          setPetitions([]);
          
          if (!result.error.includes('autorizado')) {
            toast.error("Erro ao carregar petições do admin");
          }
        } else if (result.data != null) {
          // Lógica para extrair o array de petições
          let petitionsArray: Petition[] = [];
          
          if (Array.isArray(result.data)) {
            petitionsArray = result.data;
            console.log('[useAdminPetitions] ✅ Direct array detected');
          } else if (result.data && typeof result.data === 'object' && 'data' in result.data) {
            const dataObj = result.data as { data?: any[] };
            if (Array.isArray(dataObj.data)) {
              petitionsArray = dataObj.data;
              console.log('[useAdminPetitions] ✅ Nested data array detected');
            }
          }
          
          console.log(`[useAdminPetitions] ✅ Success: ${petitionsArray.length} petitions`);
          setPetitions(petitionsArray);
          setError(null);
          hasFetchedRef.current = true;
        } else {
          console.log('[useAdminPetitions] ⚠️ No data received');
          setPetitions([]);
          setError(null);
        }
      }
      
    } catch (err) {
      console.error('[useAdminPetitions] ❌ Error:', err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar petições';
        setError(new Error(errorMessage));
        setPetitions([]);
        
        if (!errorMessage.includes('autorizado')) {
          toast.error("Erro ao carregar petições do admin");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [authInitialized, authLoading, user?.id, isAdmin, params]);

  const refreshPetitions = useCallback(() => {
    console.log('[useAdminPetitions] 🔄 Manual refresh requested');
    hasFetchedRef.current = false;
    fetchAdminPetitions(true);
  }, [fetchAdminPetitions]);

  // Effect principal
  useEffect(() => {
    console.log('[useAdminPetitions] 🎯 Main effect triggered');
    console.log('[useAdminPetitions] Status:', { 
      authInitialized, 
      authLoading, 
      hasUser: !!user?.id, 
      isAdmin,
      userEmail: user?.email
    });
    
    if (authInitialized && !authLoading && user?.id && isAdmin) {
      fetchAdminPetitions(false);
    } else if (authInitialized && !authLoading && !user?.id) {
      setPetitions([]);
      setError(null);
      setIsLoading(false);
    } else if (authInitialized && !authLoading && user?.id && !isAdmin) {
      console.log('[useAdminPetitions] ❌ User is not admin');
      setError(new Error('Acesso negado: usuário não é administrador'));
      setPetitions([]);
      setIsLoading(false);
    }
  }, [authInitialized, authLoading, user?.id, isAdmin, fetchAdminPetitions]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return { 
    petitions, 
    isLoading, 
    error,
    refreshPetitions,
    isAdmin
  };
};

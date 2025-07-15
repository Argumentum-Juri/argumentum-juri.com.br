
import { useState, useEffect, useCallback, useRef } from 'react';
import { Petition } from '@/types';
import { goApiClient } from '@/lib/goApiClient';
import { toast } from 'sonner';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { useLocation } from 'react-router-dom';

export const usePetitionsAPI = () => {
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const location = useLocation();
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  // Verificar se estamos em uma rota válida
  const isValidRoute = useCallback(() => {
    const currentPath = location.pathname;
    const validPaths = ['/petitions', '/', '/dashboard'];
    return validPaths.includes(currentPath);
  }, [location.pathname]);

  const fetchPetitions = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id || !isValidRoute()) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[usePetitionsAPI] 🚀 Fetching petitions via GoAPI`);
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await goApiClient.getPetitions({
        page: 1,
        limit: 100,
        sortDirection: 'desc'
      });
      
      // DEBUG: Vamos ver exatamente o que chega
      console.log('[usePetitionsAPI] 🔍 RAW RESULT:', result);
      console.log('[usePetitionsAPI] 🔍 result.data type:', typeof result.data);
      console.log('[usePetitionsAPI] 🔍 result.data:', result.data);
      
      if (isMountedRef.current) {
        if (result.error) {
          console.error(`[usePetitionsAPI] ❌ Error:`, result.error);
          setError(new Error(result.error));
          setPetitions([]);
          
          if (!result.error.includes('autorizado')) {
            toast.error("Erro ao carregar petições");
          }
        } else if (result.data != null) {
          // Lógica mais segura para extrair o array de petições
          let petitionsArray: Petition[] = [];
          
          // Se result.data for um array direto
          if (Array.isArray(result.data)) {
            petitionsArray = result.data;
            console.log('[usePetitionsAPI] ✅ Direct array detected');
          } 
          // Se result.data for um objeto com propriedade data que é array
          else if (result.data && typeof result.data === 'object' && 'data' in result.data) {
            const dataObj = result.data as { data?: any[] };
            if (Array.isArray(dataObj.data)) {
              petitionsArray = dataObj.data;
              console.log('[usePetitionsAPI] ✅ Nested data array detected');
            }
          }
          
          console.log(`[usePetitionsAPI] ✅ Extracted petitions array:`, petitionsArray);
          console.log(`[usePetitionsAPI] ✅ Success: ${petitionsArray.length} petitions`);
          
          setPetitions(petitionsArray);
          setError(null);
          hasFetchedRef.current = true;
        } else {
          console.log(`[usePetitionsAPI] ⚠️ No data received`);
          setPetitions([]);
          setError(null);
        }
      }
      
    } catch (err) {
      console.error(`[usePetitionsAPI] ❌ Error:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar petições';
        setError(new Error(errorMessage));
        setPetitions([]);
        
        if (!errorMessage.includes('autorizado')) {
          toast.error("Erro ao carregar petições");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [authInitialized, authLoading, user?.id, isValidRoute]);

  const refreshPetitions = useCallback(() => {
    console.log(`[usePetitionsAPI] 🔄 Manual refresh requested`);
    hasFetchedRef.current = false;
    fetchPetitions(true);
  }, [fetchPetitions]);

  // Effect principal
  useEffect(() => {
    console.log(`[usePetitionsAPI] 🎯 Main effect triggered`);
    
    if (authInitialized && !authLoading && user?.id && isValidRoute()) {
      fetchPetitions(false);
    } else if (authInitialized && !authLoading && !user?.id) {
      setPetitions([]);
      setError(null);
      setIsLoading(false);
    } else if (!isValidRoute()) {
      setIsLoading(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchPetitions, isValidRoute]);

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
    refreshPetitions
  };
};

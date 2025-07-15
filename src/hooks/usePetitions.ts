
import { useAPIContext } from '@/contexts/APIContext';
import { usePetitionsAPI } from '@/hooks/usePetitionsAPI';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Petition, PetitionStatus } from '@/types';
// TROCA PARA NOVO CONTEXTO:
import { useGoAuth } from '@/contexts/GoAuthContext';

export const usePetitions = () => {
  const { useNewPetitionsAPI } = useAPIContext();
  // Agora usa GoAuthContext!
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  
  // Hook da nova API
  const newAPIHook = usePetitionsAPI();
  
  // Hook legacy usando Supabase direto
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchPetitionsLegacy = useCallback(async (forceRefresh = false) => {
    if (!authInitialized || authLoading || !user?.id) {
      return;
    }

    if (!forceRefresh && hasFetchedRef.current) {
      return;
    }

    console.log(`[usePetitions] 🚀 Fetching petitions via Legacy API`);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('petitions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (isMountedRef.current) {
        if (error) throw error;
        
        // Converter os dados para o formato esperado
        const convertedPetitions: Petition[] = (data || []).map(petition => ({
          id: petition.id,
          title: petition.title,
          description: petition.description,
          status: petition.status as PetitionStatus,
          created_at: petition.created_at,
          updated_at: petition.updated_at,
          createdAt: petition.created_at,
          updatedAt: petition.updated_at,
          legal_area: petition.legal_area,
          petition_type: petition.petition_type,
          has_process: petition.has_process,
          process_number: petition.process_number,
          team_id: petition.team_id,
          user_id: petition.user_id,
          // Converter form_answers de Json para Record<string, any>
          form_answers: petition.form_answers ? 
            (typeof petition.form_answers === 'string' ? 
              JSON.parse(petition.form_answers) : 
              petition.form_answers as Record<string, any>) : 
            {},
          // Campos opcionais
          category: petition.category,
          content: petition.content,
          current_signatures: petition.current_signatures,
          form_schema: petition.form_schema,
          form_type: petition.form_type,
          target: petition.target,
          rejection_count: petition.rejection_count
        }));
        
        console.log(`[usePetitions] ✅ Success: ${convertedPetitions.length} petitions (Legacy)`);
        setPetitions(convertedPetitions);
        setError(null);
        hasFetchedRef.current = true;
      }
      
    } catch (err) {
      console.error(`[usePetitions] ❌ Error (Legacy):`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(new Error(errorMessage));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id, authInitialized, authLoading]);

  const refreshPetitionsLegacy = useCallback(async () => {
    console.log(`[usePetitions] 🔄 Manual refresh (Legacy)`);
    hasFetchedRef.current = false;
    await fetchPetitionsLegacy(true);
  }, [fetchPetitionsLegacy]);

  useEffect(() => {
    if (!useNewPetitionsAPI && authInitialized && !authLoading && user?.id) {
      fetchPetitionsLegacy(false);
    }
  }, [useNewPetitionsAPI, authInitialized, authLoading, user?.id, fetchPetitionsLegacy]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const legacyHook = {
    petitions,
    isLoading,
    error,
    refreshPetitions: refreshPetitionsLegacy
  };
  
  // Retornar o hook apropriado baseado no contexto
  return useNewPetitionsAPI ? newAPIHook : legacyHook;
};


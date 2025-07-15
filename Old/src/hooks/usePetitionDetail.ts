
import { useState, useEffect, useCallback } from 'react';
import { petitionService } from '@/services';
import { toast } from 'sonner';
import { PetitionDetail, PetitionStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePetitionDetail = (id: string) => {
  const [petition, setPetition] = useState<PetitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [approveLoading, setApproveLoading] = useState<boolean>(false);
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const { isAdmin, user } = useAuth();
  
  const fetchPetition = useCallback(async () => {
    if (!id || id === 'undefined') {
      console.error("Invalid petition ID:", id);
      setError(new Error("ID da petição inválido"));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null); // Limpar erros anteriores
    
    try {
      console.log("Fetching petition detail for ID:", id);
      let petitionData;
      
      // Verificar se o usuário é dono da petição ou admin
      if (user && id) {
        // Tentar buscar a petição diretamente
        const { data, error: petitionError } = await supabase
          .from('petitions')
          .select(`
            *,
            user:user_id (
              id, name, email, avatar_url
            ),
            petition_attachments (*)
          `)
          .eq('id', id)
          .single();
          
        if (petitionError) {
          console.error("Error fetching petition:", petitionError);
          throw new Error("Falha ao carregar a petição");
        }
        
        console.log("Fetched petition raw data:", data);
        
        if (data) {
          petitionData = {
            id: data.id,
            title: data.title,
            description: data.description,
            legal_area: data.legal_area,
            petition_type: data.petition_type,
            has_process: data.has_process,
            process_number: data.process_number,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            user_id: data.user_id,
            team_id: data.team_id,
            user: data.user,
            attachments: data.petition_attachments
          };
        }
      } else {
        petitionData = await petitionService.getPetitionDetail(id);
      }
      
      console.log("Processed petition data:", petitionData);
      
      if (!petitionData) {
        throw new Error("Petição não encontrada");
      }
      
      setPetition(petitionData);
      
      // Fetch documents for this petition in a separate try/catch to avoid failing the whole request
      try {
        console.log("Fetching documents for petition ID:", id);
        const docsData = await petitionService.getPetitionDocuments(id);
        console.log("Fetched documents data:", docsData);
        setDocuments(docsData || []);
      } catch (docError) {
        console.error("Erro ao carregar documentos:", docError);
        // Não interromper o fluxo principal se houver erro apenas nos documentos
        setDocuments([]);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error(`Error fetching petition details: ${err.message}`);
      setError(err);
      toast.error(`Erro ao carregar petição: ${err.message}`);
      setIsLoading(false);
    }
  }, [id, user]);
  
  useEffect(() => {
    if (id) {
      fetchPetition();
    } else {
      setError(new Error("ID da petição não fornecido"));
      setIsLoading(false);
    }
  }, [id, fetchPetition]);
  
  const handleApprovePetition = async () => {
    setApproveLoading(true);
    try {
      await petitionService.updatePetitionStatus(id, PetitionStatus.APPROVED);
      await fetchPetition();
      toast.success("Petição aprovada com sucesso!");
      return true;
    } catch (err: any) {
      console.error(`Error approving petition: ${err.message}`);
      toast.error(`Erro ao aprovar petição: ${err.message}`);
      return false;
    } finally {
      setApproveLoading(false);
    }
  };
  
  const handleRejectPetition = async (reason: string) => {
    setRejectLoading(true);
    try {
      await petitionService.updatePetitionStatus(id, PetitionStatus.REJECTED);
      await petitionService.addComment(id, reason);
      await fetchPetition();
      toast.success("Petição rejeitada.");
      return true;
    } catch (err: any) {
      console.error(`Error rejecting petition: ${err.message}`);
      toast.error(`Erro ao rejeitar petição: ${err.message}`);
      return false;
    } finally {
      setRejectLoading(false);
    }
  };
  
  const refresh = useCallback(async () => {
    return fetchPetition();
  }, [fetchPetition]);
  
  return {
    petition,
    isLoading,
    error,
    approveLoading,
    rejectLoading,
    handleApprovePetition,
    handleRejectPetition,
    documents,
    refresh,
    isAdmin
  };
};


import { useState, useEffect, useCallback } from 'react';
import { petitionService } from '@/services';
import { toast } from 'sonner';
import { PetitionDetail, PetitionStatus, PetitionAttachment, PetitionComment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Tipo personalizado para os erros
export type PetitionError = {
  type: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'GENERIC';
  message: string;
};

export const usePetitionDetail = (id: string) => {
  const [petition, setPetition] = useState<PetitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<PetitionError | null>(null);
  const [approveLoading, setApproveLoading] = useState<boolean>(false);
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const { isAdmin, user } = useAuth();
  
  const fetchPetition = useCallback(async () => {
    if (!id || id === 'undefined') {
      console.error("Invalid petition ID:", id);
      setError({ 
        type: 'NOT_FOUND',
        message: "ID da petição inválido" 
      });
      setIsLoading(false);
      return;
    }
    
    if (!user) {
      console.error("User not authenticated");
      setError({
        type: 'PERMISSION_DENIED',
        message: "Usuário não autenticado"
      });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null); // Limpar erros anteriores
    
    try {
      console.log("Fetching petition detail for ID:", id);
      
      // 1. Primeiro, buscar a petição principal com dados básicos
      const { data: petitionData, error: petitionError } = await supabase
        .from('petitions')
        .select(`
          id,
          title,
          description,
          legal_area,
          petition_type,
          has_process,
          process_number,
          status,
          created_at,
          updated_at,
          user_id,
          team_id,
          user:user_id (
            id, name, email, avatar_url
          ),
          form_answers
        `)
        .eq('id', id)
        .single();
        
      if (petitionError) {
        console.error("Error fetching petition:", petitionError);
        if (petitionError.code === 'PGRST116') {
          setError({
            type: 'NOT_FOUND', 
            message: "Petição não encontrada"
          });
        } else {
          setError({
            type: 'GENERIC',
            message: `Falha ao carregar a petição: ${petitionError.message}`
          });
        }
        setIsLoading(false);
        return;
      }
      
      if (!petitionData) {
        console.error("Petition not found");
        setError({
          type: 'NOT_FOUND',
          message: "Petição não encontrada"
        });
        setIsLoading(false);
        return;
      }
      
      // 2. Verificar permissão de acesso:
      // - Admin pode ver todas as petições
      // - Usuário pode ver suas próprias petições
      // - Usuário pode ver petições de equipes que é membro
      let hasAccess = false;
      
      if (isAdmin) {
        console.log("Admin access granted");
        hasAccess = true;
      } else if (petitionData.user_id === user.id) {
        console.log("Owner access granted");
        hasAccess = true;
      } else if (petitionData.team_id) {
        console.log("Checking team access for team:", petitionData.team_id);
        
        // Verificar se o usuário é membro da equipe
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('id, role')
          .eq('team_id', petitionData.team_id)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (memberError) {
          console.error("Error checking team membership:", memberError);
          console.log("User ID:", user.id);
          console.log("Team ID:", petitionData.team_id);
        } else if (memberData) {
          console.log("Team member access granted with role:", memberData.role);
          hasAccess = true;
        } else {
          console.log("User is not a member of the team");
          console.log("User ID:", user.id);
          console.log("Team ID:", petitionData.team_id);
        }
      }
      
      // Se não tiver acesso, retornar erro de permissão
      if (!hasAccess) {
        console.error("Access denied for petition:", id);
        setError({
          type: 'PERMISSION_DENIED',
          message: "Você não tem permissão para acessar esta petição"
        });
        setIsLoading(false);
        return;
      }
      
      // Convert status to PetitionStatus enum value
      const statusAsEnum = petitionData.status as PetitionStatus;
      
      const petitionResult: PetitionDetail = {
        id: petitionData.id,
        title: petitionData.title,
        description: petitionData.description,
        legal_area: petitionData.legal_area,
        petition_type: petitionData.petition_type,
        has_process: petitionData.has_process,
        process_number: petitionData.process_number,
        status: statusAsEnum,
        created_at: petitionData.created_at,
        updated_at: petitionData.updated_at,
        // For backwards compatibility
        createdAt: petitionData.created_at,
        updatedAt: petitionData.updated_at,
        user_id: petitionData.user_id,
        team_id: petitionData.team_id,
        user: petitionData.user,
        form_answers: petitionData.form_answers as Record<string, any> || {},
        attachments: [],
        comments: []
      };
      
      // 3. Buscar anexos da petição
      const { data: attachmentsData } = await supabase
        .from('petition_attachments')
        .select('*')
        .eq('petition_id', id);
        
      if (attachmentsData && attachmentsData.length > 0) {
        petitionResult.attachments = attachmentsData as PetitionAttachment[];
      }
      
      // 4. Buscar comentários (com dados do autor)
      const { data: commentsData } = await supabase
        .from('petition_comments')
        .select(`
          id, 
          petition_id,
          author_id,
          content,
          created_at,
          updated_at
        `)
        .eq('petition_id', id);
        
      if (commentsData && commentsData.length > 0) {
        // Obter IDs únicos de todos os autores
        const authorIds = [...new Set(commentsData.map(c => c.author_id))];
        
        // Buscar perfis dos autores
        const { data: authorsData } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .in('id', authorIds);
        
        // Criar mapa de autores
        const authorsMap: Record<string, any> = {};
        if (authorsData) {
          authorsData.forEach(author => {
            authorsMap[author.id] = author;
          });
        }
        
        // Adicionar dados do autor em cada comentário
        const commentsWithAuthors = commentsData.map(comment => {
          return {
            ...comment,
            author: authorsMap[comment.author_id] || null
          };
        });
        
        petitionResult.comments = commentsWithAuthors as PetitionComment[];
      }
      
      setPetition(petitionResult);
      
      // 5. Buscar documentos da petição (em paralelo com atraso para melhorar UI)
      setTimeout(async () => {
        try {
          const docsData = await petitionService.getPetitionDocuments(id);
          setDocuments(docsData || []);
        } catch (docError) {
          console.error("Erro ao carregar documentos:", docError);
          setDocuments([]);
        }
      }, 300);
      
    } catch (err: any) {
      console.error(`Error fetching petition details: ${err.message}`);
      setError({
        type: 'GENERIC',
        message: err.message
      });
      toast.error(`Erro ao carregar petição: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [id, user, isAdmin]);
  
  useEffect(() => {
    if (id) {
      fetchPetition();
    } else {
      setError({
        type: 'NOT_FOUND',
        message: "ID da petição não fornecido"
      });
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
      // Adicionar um comentário com o motivo da rejeição
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

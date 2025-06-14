
import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { petitionService } from '@/services';
import { toast } from 'sonner';
import { PetitionDetail, PetitionStatus, PetitionAttachment, PetitionComment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
// Temporariamente desabilitando cache para debug
// import { getFromCache, saveToCache, CACHE_DURATIONS } from '@/utils/cacheUtils';
import { useFetchWithId } from './use-fetch-with-id';

export type PetitionError = {
  type: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'GENERIC';
  message: string;
};

export const usePetitionDetailRefactored = (id: string) => {
  const location = useLocation();
  const [documents, setDocuments] = useState<any[]>([]);
  const [approveLoading, setApproveLoading] = useState<boolean>(false);
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);
  
  const { isAdmin, user, authInitialized, isLoading: authLoading } = useAuth();

  // Validação específica para UUID
  const validatePetitionId = useCallback((id: string) => {
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }, []);

  // Função de fetch com instrumentação completa e sem cache temporariamente
  const fetchPetitionData = useCallback(async (petitionId: string, options?: { signal?: AbortSignal }) => {
    const signal = options?.signal;
    const fetchId = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const start = performance.now();
    
    console.log(`[usePetitionDetail] ▶️ [${fetchId}] fetch start /petitions/${petitionId}`, {
      petitionId,
      authInitialized,
      authLoading,
      userId: user?.id,
      isAdmin,
      route: location.pathname,
      hasSignal: !!signal,
      signalAborted: signal?.aborted
    });

    // Listener detalhado para abort
    signal?.addEventListener('abort', () => {
      const duration = (performance.now() - start).toFixed(2);
      console.warn(`[usePetitionDetail] ⏸️ [${fetchId}] fetch abortado após ${duration}ms`, {
        reason: signal.reason,
        petitionId,
        fetchId
      });
    });
    
    // Aguardar auth se necessário
    if (!authInitialized || authLoading) {
      console.log(`[usePetitionDetail] ⏳ [${fetchId}] Aguardando autenticação`);
      throw new Error('Aguardando autenticação');
    }

    if (!user?.id) {
      console.log(`[usePetitionDetail] 🚫 [${fetchId}] Usuário não autenticado`);
      throw new Error('Você precisa estar logado para acessar esta petição');
    }

    // TEMPORARIAMENTE DESABILITADO PARA DEBUG
    // Cache key estável
    // const cacheKey = `petition_detail_${petitionId}_${user.id}_${isAdmin ? 'admin' : 'user'}`;
    
    // Tentar cache primeiro
    // const cachedData = getFromCache<PetitionDetail>(cacheKey, CACHE_DURATIONS.SHORT);
    // if (cachedData && cachedData.id === petitionId && cachedData.title) {
    //   const duration = (performance.now() - start).toFixed(2);
    //   console.log(`[${fetchId}] ✅ cache hit in ${duration}ms:`, cachedData.title);
    //   return cachedData;
    // }

    console.log(`[usePetitionDetail] 📡 [${fetchId}] Buscando dados da API (sem cache)...`);

    // Log detalhado da sessão Supabase
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      console.log(`[usePetitionDetail] 🔐 [${fetchId}] Sessão atual:`, {
        hasSession: !!sessionData?.session,
        hasAccessToken: !!sessionData?.session?.access_token,
        expiresAt: sessionData?.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : null,
        tokenType: sessionData?.session?.token_type,
        userId: sessionData?.session?.user?.id
      });
    } catch (sessionError) {
      console.warn(`[usePetitionDetail] ⚠️ [${fetchId}] Erro ao obter sessão:`, sessionError);
    }

    // Timer para avisar se demorar muito (aumentado para 60s)
    const longRequestTimer = setTimeout(() => {
      console.warn(`[usePetitionDetail] ⚠️ [${fetchId}] still loading after 60s`);
    }, 60_000);

    try {
      console.log(`[usePetitionDetail] 🔍 [${fetchId}] Executando query Supabase...`);
      
      // Buscar petição principal com instrumentação adicional
      const queryStart = performance.now();
      const { data: petitionData, error: petitionError } = await supabase
        .from('petitions')
        .select(`
          id, title, description, legal_area, petition_type, has_process,
          process_number, status, created_at, updated_at, user_id, team_id,
          form_answers,
          user:user_id (id, name, email, avatar_url)
        `)
        .eq('id', petitionId)
        .abortSignal(signal)
        .maybeSingle();

      const queryDuration = (performance.now() - queryStart).toFixed(2);
      console.log(`[usePetitionDetail] 📊 [${fetchId}] Query executada em ${queryDuration}ms`);

      if (signal?.aborted) {
        console.log(`[usePetitionDetail] 🛑 [${fetchId}] Query abortada`);
        throw new Error('AbortError');
      }

      if (petitionError) {
        const duration = (performance.now() - start).toFixed(2);
        console.error(`[usePetitionDetail] ❌ [${fetchId}] fetch error after ${duration}ms:`, {
          error: petitionError,
          code: petitionError.code,
          message: petitionError.message,
          details: petitionError.details,
          hint: petitionError.hint
        });
        throw petitionError;
      }

      if (!petitionData) {
        const duration = (performance.now() - start).toFixed(2);
        console.warn(`[usePetitionDetail] ⚠️ [${fetchId}] Petição não encontrada após ${duration}ms`);
        throw new Error('Petição não encontrada');
      }

      console.log(`[usePetitionDetail] ✅ [${fetchId}] Petição encontrada:`, {
        id: petitionData.id,
        title: petitionData.title,
        status: petitionData.status,
        userId: petitionData.user_id,
        teamId: petitionData.team_id
      });

      // Verificar permissões
      let hasAccess = false;
      if (isAdmin) {
        hasAccess = true;
        console.log(`[usePetitionDetail] 👑 [${fetchId}] Acesso concedido (admin)`);
      } else if (petitionData.user_id === user.id) {
        hasAccess = true;
        console.log(`[usePetitionDetail] 👤 [${fetchId}] Acesso concedido (owner)`);
      } else if (petitionData.team_id) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select('id, role')
          .eq('team_id', petitionData.team_id)
          .eq('user_id', user.id)
          .abortSignal(signal)
          .maybeSingle();

        if (signal?.aborted) throw new Error('AbortError');
        if (memberData) {
          hasAccess = true;
          console.log(`[usePetitionDetail] 🤝 [${fetchId}] Acesso concedido (team member)`);
        }
      }

      if (!hasAccess) {
        console.log(`[usePetitionDetail] 🚫 [${fetchId}] Acesso negado`);
        throw new Error('Você não tem permissão para acessar esta petição');
      }

      // Montar objeto da petição
      const petitionResult: PetitionDetail = {
        id: petitionData.id,
        title: petitionData.title,
        description: petitionData.description,
        legal_area: petitionData.legal_area,
        petition_type: petitionData.petition_type,
        has_process: petitionData.has_process,
        process_number: petitionData.process_number,
        status: petitionData.status as PetitionStatus,
        created_at: petitionData.created_at,
        updated_at: petitionData.updated_at,
        createdAt: petitionData.created_at,
        updatedAt: petitionData.updated_at,
        user_id: petitionData.user_id,
        team_id: petitionData.team_id,
        user: petitionData.user,
        form_answers: petitionData.form_answers as Record<string, any> || {},
        attachments: [],
        comments: []
      };

      // Buscar anexos e comentários em paralelo
      console.log(`[usePetitionDetail] 📎 [${fetchId}] Buscando anexos e comentários...`);
      const [attachmentsPromise, commentsPromise] = await Promise.allSettled([
        supabase
          .from('petition_attachments')
          .select('*')
          .eq('petition_id', petitionId)
          .abortSignal(signal),
        supabase
          .from('petition_comments')
          .select('id, petition_id, author_id, content, created_at, updated_at')
          .eq('petition_id', petitionId)
          .abortSignal(signal)
      ]);

      if (!signal?.aborted) {
        // Processar anexos
        if (attachmentsPromise.status === 'fulfilled' && attachmentsPromise.value.data) {
          petitionResult.attachments = attachmentsPromise.value.data as PetitionAttachment[];
          console.log(`[usePetitionDetail] 📎 [${fetchId}] ${petitionResult.attachments.length} anexos carregados`);
        }

        // Processar comentários
        if (commentsPromise.status === 'fulfilled' && commentsPromise.value.data) {
          const commentsData = commentsPromise.value.data;
          if (commentsData.length > 0) {
            const authorIds = [...new Set(commentsData.map(c => c.author_id))];
            
            const { data: authorsData } = await supabase
              .from('profiles')
              .select('id, name, email, avatar_url')
              .in('id', authorIds)
              .abortSignal(signal);
            
            if (!signal?.aborted && authorsData) {
              const authorsMap: Record<string, any> = {};
              authorsData.forEach(author => {
                authorsMap[author.id] = author;
              });
              
              const commentsWithAuthors = commentsData.map(comment => ({
                ...comment,
                author: authorsMap[comment.author_id] || null
              }));
              
              petitionResult.comments = commentsWithAuthors as PetitionComment[];
              console.log(`[usePetitionDetail] 💬 [${fetchId}] ${petitionResult.comments.length} comentários carregados`);
            }
          }
        }
      }

      // TEMPORARIAMENTE DESABILITADO PARA DEBUG
      // Salvar no cache
      // saveToCache(cacheKey, petitionResult, `Salvando petição ${petitionResult.title} no cache`);

      // Buscar documentos em background
      setTimeout(async () => {
        try {
          if (!signal?.aborted) {
            console.log(`[usePetitionDetail] 📄 [${fetchId}] Carregando documentos...`);
            const docsData = await petitionService.getPetitionDocuments(petitionId);
            setDocuments(docsData || []);
            console.log(`[usePetitionDetail] 📄 [${fetchId}] ${docsData?.length || 0} documentos carregados`);
          }
        } catch (docError: any) {
          if (docError.name !== 'AbortError') {
            console.error(`[usePetitionDetail] ⚠️ [${fetchId}] Erro ao carregar documentos:`, docError);
          }
        }
      }, 100);

      const duration = (performance.now() - start).toFixed(2);
      console.log(`[usePetitionDetail] ✅ [${fetchId}] fetch succeeded in ${duration}ms`, {
        title: petitionResult.title,
        attachments: petitionResult.attachments.length,
        comments: petitionResult.comments.length
      });

      return petitionResult;

    } catch (err: any) {
      const duration = (performance.now() - start).toFixed(2);
      
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        console.warn(`[usePetitionDetail] ⏸️ [${fetchId}] fetch aborted after ${duration}ms`, err);
        throw err;
      }
      
      console.error(`[usePetitionDetail] ❌ [${fetchId}] fetch error after ${duration}ms`, {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3) // Primeiras 3 linhas do stack
      });
      throw err;
    } finally {
      clearTimeout(longRequestTimer);
    }
  }, [user?.id, isAdmin, authInitialized, authLoading, location.pathname]);

  // Usar o hook base com cache desabilitado temporariamente
  const {
    data: petition,
    isLoading,
    error: fetchError,
    refresh
  } = useFetchWithId({
    id,
    fetchFunction: fetchPetitionData,
    validateId: validatePetitionId,
    routePattern: '/petitions/{id}',
    skipInitialFetch: !authInitialized || authLoading || !user?.id,
    // cacheKey: `petition_detail_${id}_${user?.id}_${isAdmin ? 'admin' : 'user'}` // Desabilitado temporariamente
  });

  // Converter erro para o formato esperado
  const error: PetitionError | null = fetchError ? {
    type: fetchError.includes('não encontrada') ? 'NOT_FOUND' : 
          fetchError.includes('permissão') ? 'PERMISSION_DENIED' : 'GENERIC',
    message: fetchError
  } : null;

  // Action handlers
  const handleApprovePetition = useCallback(async () => {
    if (!petition) return false;
    
    setApproveLoading(true);
    try {
      await petitionService.updatePetitionStatus(petition.id, PetitionStatus.APPROVED);
      await refresh();
      toast.success("Petição aprovada com sucesso!");
      return true;
    } catch (err: any) {
      console.error(`[usePetitionDetail] ❌ Erro ao aprovar petição: ${err.message}`);
      toast.error(`Erro ao aprovar petição: ${err.message}`);
      return false;
    } finally {
      setApproveLoading(false);
    }
  }, [petition, refresh]);
  
  const handleRejectPetition = useCallback(async (reason: string) => {
    if (!petition) return false;
    
    setRejectLoading(true);
    try {
      await petitionService.updatePetitionStatus(petition.id, PetitionStatus.REJECTED);
      await petitionService.addComment(petition.id, reason);
      await refresh();
      toast.success("Petição rejeitada.");
      return true;
    } catch (err: any) {
      console.error(`[usePetitionDetail] ❌ Erro ao rejeitar petição: ${err.message}`);
      toast.error(`Erro ao rejeitar petição: ${err.message}`);
      return false;
    } finally {
      setRejectLoading(false);
    }
  }, [petition, refresh]);
  
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

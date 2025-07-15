import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { petitionService } from '@/services';
import { toast } from 'sonner';
import { PetitionDetail, PetitionStatus, PetitionAttachment, PetitionComment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getFromCache, saveToCache, CACHE_DURATIONS } from '@/utils/cacheUtils';

export type PetitionError = {
  type: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'GENERIC';
  message: string;
};

const FETCH_TIMEOUT = 30000; // Aumentado de 8s para 30s

export const usePetitionDetail = (id: string) => {
  const location = useLocation();
  const [petition, setPetition] = useState<PetitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<PetitionError | null>(null);
  const [approveLoading, setApproveLoading] = useState<boolean>(false);
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);
  
  const { isAdmin, user, authInitialized, isLoading: authLoading } = useAuth();
  
  // Refs para controle robusto
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  
  // Cache key estável e único por petição
  const cacheKey = useMemo(() => {
    return user && id ? `petition_detail_${id}_${user.id}_${isAdmin ? 'admin' : 'user'}` : null;
  }, [user?.id, id, isAdmin]);

  // Validação simples e estável de ID
  const isValidId = useMemo(() => {
    return id && id !== 'undefined' && id !== 'null' && id.trim() !== '';
  }, [id]);

  // Validação de rota MAIS TOLERANTE
  const validRoute = useMemo(() => {
    if (!isValidId) return false;
    return location.pathname.includes(`/petitions/${id}`);
  }, [location.pathname, id, isValidId]);

  // Log de debug para rota e ID
  useEffect(() => {
    console.log(`[usePetitionDetail] Rota atual: ${location.pathname} | ID atual: ${id}`);
  }, [location.pathname, id]);

  // NOVO: Reset de hasFetchedRef quando ID mudar
  useEffect(() => {
    console.log('[usePetitionDetail] ♻️ Resetando fetch flag ao mudar ID');
    hasFetchedRef.current = false;
  }, [id]);

  // NOVO: Reset de estado quando o ID muda
  useEffect(() => {
    console.log(`[usePetitionDetail] 🔄 ID mudou de "${currentIdRef.current}" para "${id}"`);
    
    if (currentIdRef.current !== id) {
      console.log(`[usePetitionDetail] 🧹 Resetando estado para nova petição`);
      
      // Reset do estado
      setPetition(null);
      setError(null);
      setIsLoading(true);
      setDocuments([]);
      
      // Reset do controle de fetch
      hasFetchedRef.current = false;
      currentIdRef.current = id;
      
      // Cleanup do abort controller anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [id]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Função principal de fetch - estável com useCallback
  const fetchPetitionData = useCallback(async (forceRefresh = false) => {
    // LOGS DE DEBUG SOLICITADOS
    console.log('📥 FetchPetition chamado para:', id);
    console.log('👀 Auth:', { authInitialized, authLoading, user });
    console.log('🧠 isValidRoute:', validRoute);
    
    console.log(`[usePetitionDetail] 🚀 Iniciando fetch - ID: ${id}, forceRefresh: ${forceRefresh}`);
    
    // Cleanup anterior
    cleanup();

    // Novo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);

    // Timeout de segurança AUMENTADO
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        console.warn('[usePetitionDetail] ⏰ Timeout (30s) - abortando fetch');
        cleanup();
        if (isMountedRef.current) {
          setError({ type: 'GENERIC', message: "Tempo limite excedido (30s)" });
          setIsLoading(false);
        }
      }
    }, FETCH_TIMEOUT);

    try {
      // Validações iniciais - SEMPRE garantir setIsLoading(false) no final
      if (!isValidId) {
        console.log('[usePetitionDetail] ❌ ID inválido');
        setError({ type: 'NOT_FOUND', message: "ID da petição não fornecido" });
        setIsLoading(false);
        return;
      }

      if (!authInitialized || authLoading) {
        console.log('[usePetitionDetail] ⏳ Aguardando auth - não executará setIsLoading(false)');
        return; // Não executar setIsLoading(false) aqui - ainda aguardando
      }

      if (!user?.id) {
        console.log('[usePetitionDetail] 🚫 Usuário não autenticado');
        setError({ type: 'PERMISSION_DENIED', message: "Você precisa estar logado para acessar esta petição" });
        setIsLoading(false);
        return;
      }

      // Tentar cache primeiro (se não for refresh forçado) com validação melhorada
      if (!forceRefresh && cacheKey) {
        const cachedData = getFromCache<PetitionDetail>(cacheKey, CACHE_DURATIONS.SHORT);
        if (cachedData && cachedData.id === id && cachedData.title) {
          console.log('[usePetitionDetail] ✅ Cache usado corretamente:', cachedData.title);
          setPetition(cachedData);
          setError(null);
          setIsLoading(false); // IMPORTANTE: definir loading como false
          return;
        } else {
          console.warn('[usePetitionDetail] ⚠️ Cache ignorado ou inválido:', cachedData);
        }
      }

      console.log('[usePetitionDetail] 📡 Buscando dados da API...');

      // Buscar petição principal
      const { data: petitionData, error: petitionError } = await supabase
        .from('petitions')
        .select(`
          id, title, description, legal_area, petition_type, has_process,
          process_number, status, created_at, updated_at, user_id, team_id,
          form_answers,
          user:user_id (id, name, email, avatar_url)
        `)
        .eq('id', id)
        .abortSignal(signal)
        .maybeSingle();

      if (signal.aborted) {
        console.log('[usePetitionDetail] 🛑 Fetch abortado');
        return;
      }

      if (petitionError) {
        console.error('[usePetitionDetail] ❌ Erro ao buscar petição:', petitionError);
        throw petitionError;
      }

      if (!petitionData) {
        console.warn('[usePetitionDetail] ⚠️ Petição não encontrada');
        setError({ type: 'NOT_FOUND', message: "Petição não encontrada" });
        setIsLoading(false);
        return;
      }

      // Verificar permissões
      let hasAccess = false;
      if (isAdmin) {
        hasAccess = true;
      } else if (petitionData.user_id === user.id) {
        hasAccess = true;
      } else if (petitionData.team_id) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select('id, role')
          .eq('team_id', petitionData.team_id)
          .eq('user_id', user.id)
          .abortSignal(signal)
          .maybeSingle();

        if (signal.aborted) return;
        if (memberData) hasAccess = true;
      }

      if (!hasAccess) {
        console.warn('[usePetitionDetail] 🚫 Sem permissão');
        setError({ type: 'PERMISSION_DENIED', message: "Você não tem permissão para acessar esta petição" });
        setIsLoading(false);
        return;
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
      const [attachmentsPromise, commentsPromise] = await Promise.allSettled([
        supabase
          .from('petition_attachments')
          .select('*')
          .eq('petition_id', id)
          .abortSignal(signal),
        supabase
          .from('petition_comments')
          .select('id, petition_id, author_id, content, created_at, updated_at')
          .eq('petition_id', id)
          .abortSignal(signal)
      ]);

      if (!signal.aborted) {
        // Processar anexos
        if (attachmentsPromise.status === 'fulfilled' && attachmentsPromise.value.data) {
          petitionResult.attachments = attachmentsPromise.value.data as PetitionAttachment[];
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
            
            if (!signal.aborted && authorsData) {
              const authorsMap: Record<string, any> = {};
              authorsData.forEach(author => {
                authorsMap[author.id] = author;
              });
              
              const commentsWithAuthors = commentsData.map(comment => ({
                ...comment,
                author: authorsMap[comment.author_id] || null
              }));
              
              petitionResult.comments = commentsWithAuthors as PetitionComment[];
            }
          }
        }
      }

      // Atualizar estado apenas se ainda estiver montado e não abortado
      if (isMountedRef.current && !signal.aborted) {
        console.log('[usePetitionDetail] ✅ Petição carregada com sucesso:', petitionResult.title);
        setPetition(petitionResult);
        setError(null);
        
        // Salvar no cache com validação melhorada
        if (cacheKey && petitionResult.id === id) {
          saveToCache(cacheKey, petitionResult, `Salvando petição ${petitionResult.title} no cache`);
        }

        // Buscar documentos em background
        setTimeout(async () => {
          try {
            if (!signal.aborted && isMountedRef.current) {
              const docsData = await petitionService.getPetitionDocuments(id);
              if (isMountedRef.current && !signal.aborted) {
                setDocuments(docsData || []);
              }
            }
          } catch (docError: any) {
            if (docError.name !== 'AbortError') {
              console.error('[usePetitionDetail] ⚠️ Erro ao carregar documentos:', docError);
            }
          }
        }, 100);
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[usePetitionDetail] 🛑 Fetch abortado por cleanup');
        return;
      }
      
      console.error('[usePetitionDetail] ❌ Erro inesperado:', err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError({ type: 'GENERIC', message: errorMessage });
        toast.error("Não foi possível carregar os detalhes da petição");
      }
    } finally {
      clearTimeout(timeoutId);
      // SEMPRE executar setIsLoading(false) se componente montado
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      cleanup();
    }
  }, [id, user?.id, isAdmin, cacheKey, isValidId, authInitialized, authLoading, cleanup, validRoute]);

  // Effect principal UNIFICADO - dependências estáveis
  useEffect(() => {
    console.log('[usePetitionDetail] 🎯 EFFECT PRINCIPAL', {
      id,
      authInitialized,
      authLoading,
      userId: user?.id,
      hasFetched: hasFetchedRef.current,
      isValidRoute: validRoute
    });

    // Aguardar condições mínimas
    if (!authInitialized || authLoading || !isValidId || !validRoute) {
      console.log('[usePetitionDetail] ⏳ Aguardando condições mínimas');
      if (authInitialized && !authLoading && !user?.id) {
        setError({ type: 'PERMISSION_DENIED', message: "Você precisa estar logado para acessar esta petição" });
        setIsLoading(false);
      }
      return;
    }

    // Fetch apenas se ainda não buscou
    if (!hasFetchedRef.current) {
      console.log('[usePetitionDetail] ✅ Condições atendidas - iniciando fetch');
      hasFetchedRef.current = true;
      fetchPetitionData(false);
    }

  }, [authInitialized, authLoading, user?.id, isValidId, validRoute, fetchPetitionData]);

  // Handler de visibilidade separado
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && validRoute && hasFetchedRef.current) {
        console.log('[usePetitionDetail] 👁️ Tab ficou visível - refetch');
        fetchPetitionData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [validRoute, fetchPetitionData]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      console.log('[usePetitionDetail] 🧹 Cleanup - desmontando hook');
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Action handlers
  const handleApprovePetition = async () => {
    if (!petition) return false;
    
    setApproveLoading(true);
    try {
      await petitionService.updatePetitionStatus(petition.id, PetitionStatus.APPROVED);
      // Forçar refresh após ação
      hasFetchedRef.current = false;
      await fetchPetitionData(true);
      hasFetchedRef.current = true;
      toast.success("Petição aprovada com sucesso!");
      return true;
    } catch (err: any) {
      console.error(`[usePetitionDetail] ❌ Erro ao aprovar petição: ${err.message}`);
      toast.error(`Erro ao aprovar petição: ${err.message}`);
      return false;
    } finally {
      setApproveLoading(false);
    }
  };
  
  const handleRejectPetition = async (reason: string) => {
    if (!petition) return false;
    
    setRejectLoading(true);
    try {
      await petitionService.updatePetitionStatus(petition.id, PetitionStatus.REJECTED);
      await petitionService.addComment(petition.id, reason);
      // Forçar refresh após ação
      hasFetchedRef.current = false;
      await fetchPetitionData(true);
      hasFetchedRef.current = true;
      toast.success("Petição rejeitada.");
      return true;
    } catch (err: any) {
      console.error(`[usePetitionDetail] ❌ Erro ao rejeitar petição: ${err.message}`);
      toast.error(`Erro ao rejeitar petição: ${err.message}`);
      return false;
    } finally {
      setRejectLoading(false);
    }
  };
  
  const refresh = useCallback(async () => {
    console.log(`[usePetitionDetail] 🔄 Refresh manual`);
    if (isValidId && validRoute) {
      hasFetchedRef.current = false;
      await fetchPetitionData(true);
      hasFetchedRef.current = true;
    }
  }, [isValidId, validRoute, fetchPetitionData]);
  
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

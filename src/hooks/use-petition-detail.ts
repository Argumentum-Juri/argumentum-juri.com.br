import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { petitionService } from '@/services';
import { toast } from 'sonner';
import { PetitionDetail, PetitionStatus, PetitionAttachment, PetitionComment } from '@/types';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getFromCache, saveToCache, CACHE_DURATIONS } from '@/utils/cacheUtils';

export type PetitionError = {
  type: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'GENERIC';
  message: string;
};

const FETCH_TIMEOUT = 30000;

export const usePetitionDetail = (id: string) => {
  const location = useLocation();
  const [petition, setPetition] = useState<PetitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<PetitionError | null>(null);
  const [approveLoading, setApproveLoading] = useState<boolean>(false);
  const [rejectLoading, setRejectLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);

  // **Corrigido: usando as propriedades corretas do contexto**
  const { user, authInitialized, isLoading: authLoading } = useGoAuth();
  
  // **Derivando isAdmin do user**
  const isAdmin = useMemo(() => user?.isAdmin || false, [user?.isAdmin]);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);

  const cacheKey = useMemo(() => {
    return user && id
      ? `petition_detail_${id}_${user.id}_${isAdmin ? 'admin' : 'user'}`
      : null;
  }, [user?.id, id, isAdmin]);

  const documentsCacheKey = useMemo(() => {
    return user && id
      ? `petition_documents_${id}_${user.id}_${isAdmin ? 'admin' : 'user'}`
      : null;
  }, [user?.id, id, isAdmin]);

  const isValidId = useMemo(() => {
    return id && id.trim() !== '' && id !== 'undefined' && id !== 'null';
  }, [id]);

  // **Detectar se vem de criação de petição**
  const fromCreate = useMemo(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('fromCreate') === 'true';
  }, [location.search]);

  // **Aceita tanto /petitions/:id quanto /admin/petitions/:id**
  const validRoute = useMemo(() => {
    if (!isValidId) return false;
    return (
      location.pathname.includes(`/petitions/${id}`) ||
      location.pathname.includes(`/admin/petitions/${id}`)
    );
  }, [location.pathname, id, isValidId]);

  // Logs de debug
  useEffect(() => {
    console.log(`[usePetitionDetail] Rota: ${location.pathname} | ID: ${id}`);
  }, [location.pathname, id]);

  // Reset inteligente quando muda o ID - evitar reset desnecessário
  useEffect(() => {
    if (currentIdRef.current !== id) {
      console.log(`[usePetitionDetail] ID changed from ${currentIdRef.current} to ${id} - resetting`);
      hasFetchedRef.current = false;
      currentIdRef.current = id;
      // Só limpar estados se o ID realmente mudou
      if (currentIdRef.current && petition?.id !== id) {
        setPetition(null);
        setDocuments([]);
      }
    }
  }, [id, petition?.id]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const fetchPetitionData = useCallback(
    async (forceRefresh = false) => {
      console.log('📥 fetchPetitionData', { id, forceRefresh, fromCreate, authInitialized, authLoading, user, isAdmin });
      cleanup();
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setError(null);
      setIsLoading(true);

      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn('[usePetitionDetail] ⏰ Timeout — abortando');
          cleanup();
          setError({ type: 'GENERIC', message: 'Tempo limite excedido (30s)' });
          setIsLoading(false);
        }
      }, FETCH_TIMEOUT);

      try {
        if (!isValidId) {
          setError({ type: 'NOT_FOUND', message: 'ID da petição não fornecido' });
          setIsLoading(false);
          return;
        }
        if (!authInitialized || authLoading) return;
        if (!user?.id) {
          setError({ type: 'PERMISSION_DENIED', message: 'Você precisa estar logado' });
          setIsLoading(false);
          return;
        }
        if (!validRoute) {
          setError({ type: 'GENERIC', message: 'Rota inválida' });
          setIsLoading(false);
          return;
        }

        // cache - forçar refresh se vem de criação
        const shouldSkipCache = forceRefresh || fromCreate;
        if (!shouldSkipCache && cacheKey && documentsCacheKey) {
          const cached = getFromCache<PetitionDetail>(cacheKey, CACHE_DURATIONS.SHORT);
          const cachedDocs = getFromCache<any[]>(documentsCacheKey, CACHE_DURATIONS.SHORT);
          
          if (cached && cached.id === id) {
            console.log('[usePetitionDetail] Usando cache da petição e documentos', { petition: cached, documents: cachedDocs });
            setPetition(cached);
            if (cachedDocs) {
              setDocuments(cachedDocs);
            }
            setIsLoading(false);
            return;
          }
        }

        // busca da petição
        const { data: petitionData, error: petitionError } = await supabase
          .from('petitions')
          .select(`
            id, title, description, legal_area, petition_type, has_process,
            process_number, status, created_at, updated_at, user_id, team_id,
            form_answers,
            user:user_id(id,name,email,avatar_url)
          `)
          .eq('id', id)
          .abortSignal(signal)
          .maybeSingle();

        if (signal.aborted) return;
        if (petitionError) throw petitionError;
        if (!petitionData) {
          setError({ type: 'NOT_FOUND', message: 'Petição não encontrada' });
          setIsLoading(false);
          return;
        }

        // permissões
        let hasAccess = isAdmin || petitionData.user_id === user.id;
        if (!hasAccess && petitionData.team_id) {
          const { data: member } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', petitionData.team_id)
            .eq('user_id', user.id)
            .abortSignal(signal)
            .maybeSingle();
          hasAccess = !!member;
        }
        if (!hasAccess) {
          setError({ type: 'PERMISSION_DENIED', message: 'Sem permissão' });
          setIsLoading(false);
          return;
        }

        // monta objeto principal
        const result: PetitionDetail = {
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
          form_answers: (petitionData.form_answers as Record<string, any>) || {},
          attachments: [],
          comments: []
        };

        // anexo, comentários e documentos em paralelo
        const [atRes, cmRes, docsRes] = await Promise.allSettled([
          supabase
            .from('petition_attachments')
            .select('*')
            .eq('petition_id', id)
            .abortSignal(signal),
          supabase
            .from('petition_comments')
            .select('id,petition_id,author_id,content,created_at,updated_at')
            .eq('petition_id', id)
            .abortSignal(signal),
          supabase
            .from('petition_documents')
            .select('*')
            .eq('petition_id', id)
            .order('created_at', { ascending: false })
            .abortSignal(signal)
        ]);

        if (!signal.aborted) {
          if (atRes.status === 'fulfilled' && atRes.value.data) {
            result.attachments = atRes.value.data as PetitionAttachment[];
          }
          if (cmRes.status === 'fulfilled' && cmRes.value.data.length) {
            const authors = await supabase
              .from('profiles')
              .select('id,name,email,avatar_url')
              .in('id', cmRes.value.data.map(c => c.author_id))
              .abortSignal(signal);

            const map: Record<string, any> = {};
            authors.data?.forEach(a => (map[a.id] = a));

            result.comments = cmRes.value.data.map(c => ({
              ...c,
              author: map[c.author_id] || null
            })) as PetitionComment[];
          }
          // Buscar documentos e salvar no cache
          if (docsRes.status === 'fulfilled' && docsRes.value.data) {
            const docs = docsRes.value.data || [];
            if (isMountedRef.current && !signal.aborted) {
              setDocuments(docs);
              // Salvar documentos no cache separadamente
              if (!fromCreate && documentsCacheKey) {
                saveToCache(documentsCacheKey, docs, `Documentos da petição ${result.title}`);
              }
            }
          }
        }

        if (isMountedRef.current && !signal.aborted) {
          setPetition(result);
          // Só salvar no cache se não vem de criação
          if (!fromCreate) {
            saveToCache(cacheKey!, result, `Petição ${result.title}`);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMountedRef.current) {
          setError({ type: 'GENERIC', message: err.message ?? 'Erro desconhecido' });
          toast.error('Não foi possível carregar os detalhes da petição');
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMountedRef.current) setIsLoading(false);
        cleanup();
      }
    },
    [
      id,
      user?.id,
      isAdmin,
      authInitialized,
      authLoading,
      cacheKey,
      documentsCacheKey, // Adicionar documentsCacheKey como dependência
      isValidId,
      validRoute,
      fromCreate,
      cleanup
    ]
  );

  // efeito principal - forçar refresh se vem de criação
  useEffect(() => {
    if (authInitialized && !authLoading && user?.id && validRoute && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPetitionData(fromCreate); // Forçar refresh se vem de criação
    }
  }, [authInitialized, authLoading, user?.id, validRoute, fromCreate, fetchPetitionData]);

  // refetch ao voltar à aba
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && validRoute && hasFetchedRef.current) {
        fetchPetitionData(true);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [validRoute, fetchPetitionData]);

  // cleanup
  useEffect(() => () => {
    isMountedRef.current = false;
    cleanup();
  }, [cleanup]);

  // ações
  const handleApprovePetition = async () => {
    if (!petition) return false;
    setApproveLoading(true);
    try {
      await petitionService.updatePetitionStatus(petition.id, PetitionStatus.APPROVED);
      hasFetchedRef.current = false;
      await fetchPetitionData(true);
      toast.success('Petição aprovada com sucesso!');
      return true;
    } catch (e: any) {
      toast.error(`Erro ao aprovar: ${e.message}`);
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
      hasFetchedRef.current = false;
      await fetchPetitionData(true);
      toast.success('Petição rejeitada.');
      return true;
    } catch (e: any) {
      toast.error(`Erro ao rejeitar: ${e.message}`);
      return false;
    } finally {
      setRejectLoading(false);
    }
  };

  const refresh = useCallback(async () => {
    if (isValidId && validRoute) {
      hasFetchedRef.current = false;
      await fetchPetitionData(true);
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
    isAdmin,
    refresh
  };
};

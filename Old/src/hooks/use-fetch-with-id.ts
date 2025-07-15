import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchMonitor } from '@/utils/fetchMonitor';

export interface UseFetchWithIdOptions<T> {
  id: string;
  fetchFunction: (id: string, options?: { signal?: AbortSignal }) => Promise<T>;
  validateId?: (id: string) => boolean;
  routePattern?: string;
  cacheKey?: string;
  skipInitialFetch?: boolean;
}

export interface UseFetchWithIdReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasFetched: boolean;
}

export const useFetchWithId = <T>({
  id,
  fetchFunction,
  validateId = (id: string) => !!id && id !== 'undefined' && id !== 'null' && id.trim() !== '',
  routePattern,
  cacheKey,
  skipInitialFetch = false
}: UseFetchWithIdOptions<T>): UseFetchWithIdReturn<T> => {
  const location = useLocation();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);
  
  // Refs para controle robusto
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);
  const currentIdRef = useRef<string | null>(null);
  const fetchStartTimeRef = useRef<number | null>(null);

  // Validação de ID estável
  const isValidId = useMemo(() => validateId(id), [id, validateId]);

  // Validação de rota flexível (opcional)
  const validRoute = useMemo(() => {
    if (!isValidId) return false;
    if (!routePattern) return true; // Se não especificar padrão, sempre válido
    return location.pathname.includes(routePattern.replace('{id}', id));
  }, [location.pathname, id, isValidId, routePattern]);

  // Log de debug para rota e ID
  useEffect(() => {
    if (routePattern) {
      console.log(`[useFetchWithId] 🗺️ Rota atual: ${location.pathname} | ID atual: ${id} | Válida: ${validRoute}`);
    }
  }, [location.pathname, id, routePattern, validRoute]);

  // NOVO: Log detalhado de montagem/desmontagem
  useEffect(() => {
    const mountTime = Date.now();
    console.log(`[useFetchWithId] 🔧 Hook montado em ${new Date(mountTime).toISOString()} para ID: ${id}`);
    
    return () => {
      const unmountTime = Date.now();
      console.log(`[useFetchWithId] 🔧 Hook desmontado em ${new Date(unmountTime).toISOString()} para ID: ${id} | Duração: ${unmountTime - mountTime}ms`);
    };
  }, [id]);

  // Reset de hasFetchedRef quando ID mudar
  useEffect(() => {
    console.log('[useFetchWithId] ♻️ Resetando fetch flag ao mudar ID');
    hasFetchedRef.current = false;
  }, [id]);

  // Reset de estado quando o ID muda
  useEffect(() => {
    console.log(`[useFetchWithId] 🔄 ID mudou de "${currentIdRef.current}" para "${id}"`);
    
    if (currentIdRef.current !== id) {
      console.log(`[useFetchWithId] 🧹 Resetando estado para nova entidade`);
      
      // Reset do estado
      setData(null);
      setError(null);
      setIsLoading(!skipInitialFetch);
      
      // Reset do controle de fetch
      hasFetchedRef.current = false;
      currentIdRef.current = id;
      
      // Cleanup do abort controller anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [id, skipInitialFetch]);

  // Cleanup function melhorado
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      const controller = abortControllerRef.current;
      console.log('[useFetchWithId] 🛑 Abortando controller atual', {
        signal: controller.signal,
        aborted: controller.signal.aborted,
        reason: controller.signal.reason
      });
      controller.abort('Hook cleanup');
      abortControllerRef.current = null;
    }
  }, []);

  // Função principal de fetch com monitoramento avançado
  const fetchData = useCallback(async (forceRefresh = false) => {
    const fetchId = Math.random().toString(36).substr(2, 9);
    fetchStartTimeRef.current = Date.now();
    
    // Iniciar monitoramento
    fetchMonitor.startFetch(fetchId, `${routePattern?.replace('{id}', id) || 'unknown'}`, 'GET');
    
    console.log(`[useFetchWithId] 🚀 [${fetchId}] Iniciando fetch - ID: ${id}, forceRefresh: ${forceRefresh}`);
    console.log(`[useFetchWithId] 🚀 [${fetchId}] Condições:`, {
      isValidId,
      validRoute,
      isMounted: isMountedRef.current,
      skipInitialFetch
    });
    
    // Cleanup anterior
    cleanup();

    // Novo AbortController com debugging
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // NOVO: Listener para abort com detalhes
    signal.addEventListener('abort', () => {
      const duration = fetchStartTimeRef.current ? Date.now() - fetchStartTimeRef.current : 0;
      fetchMonitor.endFetch(fetchId, false, signal.reason as string, true);
      console.warn(`[useFetchWithId] 🛑 [${fetchId}] Fetch abortado!`, {
        reason: signal.reason,
        duration: `${duration}ms`,
        id,
        fetchId
      });
    });

    setIsLoading(true);
    setError(null);

    try {
      // Validações iniciais
      if (!isValidId) {
        console.log(`[useFetchWithId] ❌ [${fetchId}] ID inválido`);
        fetchMonitor.endFetch(fetchId, false, 'ID inválido');
        setError("ID inválido");
        setIsLoading(false);
        return;
      }

      if (!validRoute) {
        console.log(`[useFetchWithId] ⏳ [${fetchId}] Rota inválida ou aguardando`);
        fetchMonitor.endFetch(fetchId, false, 'Rota inválida');
        if (!skipInitialFetch) {
          setIsLoading(false);
        }
        return;
      }

      console.log(`[useFetchWithId] 📡 [${fetchId}] Buscando dados da API...`);

      const result = await fetchFunction(id, { signal });

      if (signal.aborted) {
        console.log(`[useFetchWithId] 🛑 [${fetchId}] Fetch abortado durante execução`);
        return;
      }

      // Atualizar estado apenas se ainda estiver montado e não abortado
      if (isMountedRef.current && !signal.aborted) {
        const duration = fetchStartTimeRef.current ? Date.now() - fetchStartTimeRef.current : 0;
        fetchMonitor.endFetch(fetchId, true);
        console.log(`[useFetchWithId] ✅ [${fetchId}] Dados carregados com sucesso em ${duration}ms`);
        setData(result);
        setError(null);
      }

    } catch (err: any) {
      const duration = fetchStartTimeRef.current ? Date.now() - fetchStartTimeRef.current : 0;
      
      if (err.name === 'AbortError') {
        console.log(`[useFetchWithId] 🛑 [${fetchId}] Fetch abortado por cleanup após ${duration}ms`);
        return;
      }
      
      // Finalizar monitoramento com erro
      fetchMonitor.endFetch(fetchId, false, err.message);
      
      // NOVO: Log detalhado de erros
      console.error(`[useFetchWithId] ❌ [${fetchId}] Erro após ${duration}ms:`, {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack,
        id,
        fetchId
      });
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
      }
    } finally {
      const duration = fetchStartTimeRef.current ? Date.now() - fetchStartTimeRef.current : 0;
      console.log(`[useFetchWithId] 🏁 [${fetchId}] Finalizando fetch após ${duration}ms`);
      
      // SEMPRE executar setIsLoading(false) se componente montado
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      cleanup();
    }
  }, [id, isValidId, validRoute, fetchFunction, cleanup, skipInitialFetch, routePattern]);

  // Effect principal com logs detalhados
  useEffect(() => {
    const effectId = Math.random().toString(36).substr(2, 9);
    console.log(`[useFetchWithId] 🎯 [${effectId}] EFFECT PRINCIPAL`, {
      id,
      isValidId,
      validRoute,
      hasFetched: hasFetchedRef.current,
      skipInitialFetch,
      isMounted: isMountedRef.current
    });

    // Aguardar condições mínimas
    if (!isValidId || (!validRoute && routePattern)) {
      console.log(`[useFetchWithId] ⏳ [${effectId}] Aguardando condições mínimas`);
      return;
    }

    // Fetch apenas se ainda não buscou
    if (!hasFetchedRef.current && !skipInitialFetch) {
      console.log(`[useFetchWithId] ✅ [${effectId}] Condições atendidas - iniciando fetch`);
      hasFetchedRef.current = true;
      fetchData(false);
    }

  }, [isValidId, validRoute, fetchData, skipInitialFetch, routePattern]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      console.log('[useFetchWithId] 🧹 Cleanup - desmontando hook');
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const refresh = useCallback(async () => {
    console.log(`[useFetchWithId] 🔄 Refresh manual`);
    if (isValidId && validRoute) {
      hasFetchedRef.current = false;
      await fetchData(true);
      hasFetchedRef.current = true;
    }
  }, [isValidId, validRoute, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    hasFetched: hasFetchedRef.current
  };
};

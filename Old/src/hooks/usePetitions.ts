
import { useState, useEffect, useCallback, useRef } from 'react';
import { Petition } from '@/types';
import { petitionService } from '@/services/petition';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getFromCache, saveToCache, CACHE_DURATIONS } from '@/utils/cacheUtils';
import { useLocation } from 'react-router-dom';

// Sistema de debounce global aprimorado
let globalFetchDebounce: NodeJS.Timeout | null = null;
let lastFetchTimestamp = 0;
let healthCheckInterval: NodeJS.Timeout | null = null;

export const usePetitions = () => {
  const { user, isAdmin, authInitialized, isLoading: authLoading, teamId } = useAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const location = useLocation();
  
  // Refs para controle aprimorado
  const isMountedRef = useRef(true);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchCountRef = useRef(0);
  const lastSuccessfulFetchRef = useRef<number>(0);
  
  // Cache key mais robusto
  const cacheKey = user ? `petitions_${user.id}_${isAdmin ? 'admin' : 'user'}_${teamId || 'no_team'}` : null;

  // Verificar se estamos em uma rota válida
  const isValidRoute = useCallback(() => {
    const currentPath = location.pathname;
    const validPaths = ['/petitions', '/', '/dashboard'];
    const isValid = validPaths.includes(currentPath);
    console.log(`[usePetitions] 📍 Rota ${currentPath} é válida: ${isValid}`);
    return isValid;
  }, [location.pathname]);

  // Sistema de healthcheck para detectar estados inconsistentes
  const startHealthCheck = useCallback(() => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    
    healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSuccess = now - lastSuccessfulFetchRef.current;
      const isStuck = isLoading && timeSinceLastSuccess > 10000; // 10 segundos
      
      if (isStuck && isMountedRef.current && isValidRoute()) {
        console.warn(`[usePetitions] 🚨 HEALTHCHECK: Estado travado detectado - forçando reset`);
        console.warn(`[usePetitions] 🚨 Loading: ${isLoading}, LastSuccess: ${timeSinceLastSuccess}ms ago`);
        setIsLoading(false);
        setError(new Error("Sistema detectou travamento - recarregue a página"));
      }
    }, 5000);
  }, [isLoading, isValidRoute]);

  // Função principal de fetch com debugging completo
  const fetchPetitions = useCallback(async (forceRefresh = false, source = 'unknown') => {
    const fetchId = ++fetchCountRef.current;
    console.log(`[usePetitions] 🚀 FETCH #${fetchId} INICIADO`);
    console.log(`[usePetitions] 📊 Source: ${source}, ForceRefresh: ${forceRefresh}`);
    console.log(`[usePetitions] 📊 Rota: ${location.pathname}, Auth: ${authInitialized}, User: ${user?.id}`);
    console.log(`[usePetitions] 📊 IsMounted: ${isMountedRef.current}, IsLoading: ${isLoading}`);
    
    // 1. Verificações iniciais com logs detalhados
    if (!isValidRoute()) {
      console.log(`[usePetitions] ❌ FETCH #${fetchId} CANCELADO: Rota inválida`);
      return;
    }

    if (!authInitialized || authLoading) {
      console.log(`[usePetitions] ❌ FETCH #${fetchId} CANCELADO: Auth não pronta (initialized: ${authInitialized}, loading: ${authLoading})`);
      return;
    }

    if (!user?.id) {
      console.log(`[usePetitions] ❌ FETCH #${fetchId} CANCELADO: Usuário não identificado`);
      return;
    }

    if (!isMountedRef.current) {
      console.log(`[usePetitions] ❌ FETCH #${fetchId} CANCELADO: Componente desmontado`);
      return;
    }

    // 2. Controle de debounce melhorado
    const now = Date.now();
    if (globalFetchDebounce && !forceRefresh && (now - lastFetchTimestamp) < 1000) {
      console.log(`[usePetitions] ⏸️ FETCH #${fetchId} DEBOUNCED (${now - lastFetchTimestamp}ms desde último)`);
      return;
    }

    // 3. Verificação de cache (pular se forceRefresh)
    if (!forceRefresh && cacheKey) {
      const cachedData = getFromCache<Petition[]>(cacheKey, CACHE_DURATIONS.SHORT);
      if (cachedData && cachedData.length > 0) {
        console.log(`[usePetitions] 📦 FETCH #${fetchId} USANDO CACHE: ${cachedData.length} petições`);
        
        // Verificar consistência dos dados do cache
        const hasCreatedAt = cachedData.every(p => p.created_at || p.createdAt);
        if (!hasCreatedAt) {
          console.warn(`[usePetitions] ⚠️ FETCH #${fetchId} CACHE INCONSISTENTE - ignorando cache`);
        } else {
          setPetitions(cachedData);
          setError(null);
          setIsLoading(false);
          lastSuccessfulFetchRef.current = now;
          return;
        }
      } else {
        console.log(`[usePetitions] 📦 FETCH #${fetchId} CACHE VAZIO ou EXPIRADO`);
      }
    } else if (forceRefresh) {
      console.log(`[usePetitions] 🔄 FETCH #${fetchId} PULANDO CACHE (forceRefresh=${forceRefresh})`);
    }

    // 4. Configurar debounce
    lastFetchTimestamp = now;
    if (!forceRefresh) {
      globalFetchDebounce = setTimeout(() => {
        globalFetchDebounce = null;
      }, 1000);
    }

    console.log(`[usePetitions] 📡 FETCH #${fetchId} EXECUTANDO REQUEST - User: ${user.id}, Admin: ${isAdmin}`);
    setIsLoading(true);
    setError(null);
    
    try {
      // 5. Verificar sessão antes do request
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user?.id) {
        throw new Error("Sessão expirada - faça login novamente");
      }

      let petitionData: Petition[] = [];
      
      if (isAdmin) {
        console.log(`[usePetitions] 👑 FETCH #${fetchId} ADMIN: Buscando todas as petições`);
        petitionData = await petitionService.getAllPetitions();
      } else {
        console.log(`[usePetitions] 👤 FETCH #${fetchId} USER: Buscando petições do usuário`);
        
        // Buscar equipes do usuário
        const { data: teamMemberships, error: teamError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id);
          
        if (teamError) {
          console.error(`[usePetitions] ❌ FETCH #${fetchId} ERRO ao buscar equipes:`, teamError);
        }
          
        const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
        console.log(`[usePetitions] 👥 FETCH #${fetchId} Equipes do usuário: [${teamIds.join(', ')}]`);
        
        // Buscar petições paginadas
        const result = await petitionService.getPetitions({
          page: 1,
          limit: 100,
          sortDirection: 'desc'
        });
        
        const allPetitions = result.data || [];
        console.log(`[usePetitions] 📋 FETCH #${fetchId} Total de petições encontradas: ${allPetitions.length}`);
        
        // Filtrar petições do usuário/equipes
        petitionData = allPetitions.filter(petition => 
          petition.user_id === user.id || 
          (petition.team_id && teamIds.includes(petition.team_id))
        );
        
        console.log(`[usePetitions] ✂️ FETCH #${fetchId} Petições filtradas: ${petitionData.length}`);
      }
      
      // 6. Validar consistência dos dados retornados
      if (petitionData && petitionData.length > 0) {
        const inconsistentData = petitionData.some(p => !p.id || (!p.created_at && !p.createdAt));
        if (inconsistentData) {
          console.error(`[usePetitions] ❌ FETCH #${fetchId} DADOS INCONSISTENTES detectados`);
          console.error(`[usePetitions] Sample:`, petitionData.slice(0, 2));
        }
        
        // Normalizar campos de data se necessário
        petitionData = petitionData.map(petition => ({
          ...petition,
          created_at: petition.created_at || petition.createdAt,
          createdAt: petition.createdAt || petition.created_at
        }));
      }
      
      // 7. Atualizar estado se componente ainda montado
      if (isMountedRef.current) {
        console.log(`[usePetitions] ✅ FETCH #${fetchId} SUCESSO: ${petitionData.length} petições`);
        setPetitions(petitionData);
        setError(null);
        lastSuccessfulFetchRef.current = now;
        
        // Salvar no cache apenas se dados válidos e não foi refresh forçado
        if (cacheKey && petitionData.length > 0 && !forceRefresh) {
          console.log(`[usePetitions] 💾 FETCH #${fetchId} SALVANDO NO CACHE`);
          saveToCache(cacheKey, petitionData, `Fetch #${fetchId}: ${petitionData.length} petições`);
        }
      } else {
        console.log(`[usePetitions] ⚠️ FETCH #${fetchId} COMPONENTE DESMONTADO - ignorando resultado`);
      }
      
    } catch (err) {
      console.error(`[usePetitions] ❌ FETCH #${fetchId} ERRO:`, err);
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar petições';
        setError(new Error(errorMessage));
        
        // Toast apenas para erros não relacionados à sessão
        if (!errorMessage.includes('Sessão') && !errorMessage.includes('login')) {
          toast.error("Erro ao carregar petições");
        }
      }
    } finally {
      if (isMountedRef.current) {
        console.log(`[usePetitions] 🏁 FETCH #${fetchId} FINALIZANDO`);
        setIsLoading(false);
      }
      
      // Limpar debounce
      if (globalFetchDebounce) {
        clearTimeout(globalFetchDebounce);
        globalFetchDebounce = null;
      }
    }
  }, [authInitialized, authLoading, user?.id, isAdmin, teamId, cacheKey, location.pathname, isValidRoute, isLoading]);

  // Função para refresh manual
  const refreshPetitions = useCallback(() => {
    console.log(`[usePetitions] 🔄 REFRESH MANUAL SOLICITADO`);
    fetchPetitions(true, 'manual_refresh');
  }, [fetchPetitions]);

  // Effect principal - inicialização
  useEffect(() => {
    console.log(`[usePetitions] 🎯 EFFECT PRINCIPAL EXECUTADO`);
    console.log(`[usePetitions] Auth: ${authInitialized}, Loading: ${authLoading}, User: ${user?.id}, Route: ${location.pathname}`);
    
    if (authInitialized && !authLoading && user?.id && isValidRoute()) {
      console.log(`[usePetitions] ✅ CONDIÇÕES ATENDIDAS - iniciando fetch inicial`);
      fetchPetitions(false, 'initial_load');
      startHealthCheck();
    } else if (authInitialized && !authLoading && !user?.id) {
      console.log(`[usePetitions] 🚫 USUÁRIO NÃO AUTENTICADO - limpando estado`);
      setPetitions([]);
      setError(null);
      setIsLoading(false);
    } else if (!isValidRoute()) {
      console.log(`[usePetitions] 📍 ROTA INVÁLIDA - pausando loading`);
      setIsLoading(false);
    }
  }, [authInitialized, authLoading, user?.id, fetchPetitions, isValidRoute, startHealthCheck]);

  // Effect para visibilitychange - forçar refresh em tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log(`[usePetitions] 👁️ VISIBILITYCHANGE: ${document.visibilityState}`);
      
      if (!isValidRoute() || !authInitialized || !user?.id) {
        console.log(`[usePetitions] 👁️ VISIBILITYCHANGE IGNORADO - condições não atendidas`);
        return;
      }

      if (!document.hidden) {
        console.log(`[usePetitions] 👁️ ABA VOLTOU AO FOCO (visibilitychange) - forçando refresh em 250ms`);
        
        setTimeout(() => {
          if (isMountedRef.current && !document.hidden && isValidRoute()) {
            console.log(`[usePetitions] 👁️ EXECUTANDO REFRESH POR VISIBILITYCHANGE`);
            fetchPetitions(true, 'visibility_change');
          } else {
            console.log(`[usePetitions] 👁️ REFRESH CANCELADO - condições mudaram`);
          }
        }, 250);
      }
    };

    console.log(`[usePetitions] 👁️ REGISTRANDO listener visibilitychange`);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      console.log(`[usePetitions] 👁️ REMOVENDO listener visibilitychange`);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authInitialized, user?.id, fetchPetitions, isValidRoute]);

  // Effect para window.focus - backup robusto para visibilitychange
  useEffect(() => {
    const handleWindowFocus = () => {
      console.log(`[usePetitions] 🎯 WINDOW.FOCUS DISPARADO`);
      
      if (!isValidRoute() || !authInitialized || !user?.id) {
        console.log(`[usePetitions] 🎯 WINDOW.FOCUS IGNORADO - condições não atendidas`);
        return;
      }

      console.log(`[usePetitions] 🎯 WINDOW VOLTOU AO FOCO - forçando refresh em 250ms`);
      
      setTimeout(() => {
        if (isMountedRef.current && isValidRoute()) {
          console.log(`[usePetitions] 🎯 EXECUTANDO REFRESH POR WINDOW.FOCUS`);
          fetchPetitions(true, 'window_focus');
        } else {
          console.log(`[usePetitions] 🎯 REFRESH CANCELADO - condições mudaram`);
        }
      }, 250);
    };

    console.log(`[usePetitions] 🎯 REGISTRANDO listener window.focus`);
    window.addEventListener("focus", handleWindowFocus);
    
    return () => {
      console.log(`[usePetitions] 🎯 REMOVENDO listener window.focus`);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [authInitialized, user?.id, fetchPetitions, isValidRoute]);

  // Fallback de emergência aprimorado
  useEffect(() => {
    if (isLoading && isValidRoute() && authInitialized && user?.id) {
      console.log(`[usePetitions] ⏰ INICIANDO timeout de emergência (7s)`);
      emergencyTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && petitions.length === 0 && isLoading) {
          console.warn(`[usePetitions] 🚨 TIMEOUT DE EMERGÊNCIA - forçando fetch após 7s de loading`);
          fetchPetitions(true, 'emergency_timeout');
        }
      }, 7000);
    }

    return () => {
      if (emergencyTimeoutRef.current) {
        console.log(`[usePetitions] ⏰ LIMPANDO timeout de emergência`);
        clearTimeout(emergencyTimeoutRef.current);
      }
    };
  }, [isLoading, authInitialized, user?.id, petitions.length, fetchPetitions, isValidRoute]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      console.log(`[usePetitions] 🧹 CLEANUP COMPLETO - desmontando hook`);
      isMountedRef.current = false;
      
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
      }
      
      if (globalFetchDebounce) {
        clearTimeout(globalFetchDebounce);
        globalFetchDebounce = null;
      }
      
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
      }
    };
  }, []);

  // Logs de debug do estado atual
  useEffect(() => {
    console.log(`[usePetitions] 📊 ESTADO ATUAL:`, {
      petitions: petitions.length,
      isLoading,
      error: error?.message,
      authInitialized,
      userId: user?.id,
      route: location.pathname,
      isValidRoute: isValidRoute()
    });
  }, [petitions.length, isLoading, error, authInitialized, user?.id, location.pathname, isValidRoute]);

  return { 
    petitions, 
    isLoading, 
    error,
    refreshPetitions
  };
};

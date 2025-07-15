
import { useState, useEffect, useCallback } from 'react';
import { goApiClient } from '@/lib/goApiClient';
import { useGoAuth } from '@/contexts/GoAuthContext';

interface AdminStats {
  total_petitions: number;
  total_users: number;
  pending_petitions: number;
  distribution_by_status: Record<string, number>;
}

export const useAdminStats = () => {
  const { user, authInitialized } = useGoAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    // Só proceder se a autenticação foi inicializada, usuário existe e é admin
    if (!authInitialized) {
      console.log('[useAdminStats] Aguardando inicialização da autenticação...');
      return;
    }

    if (!user) {
      console.log('[useAdminStats] Usuário não autenticado');
      setIsLoading(false);
      return;
    }

    if (!user.isAdmin) {
      console.log('[useAdminStats] Usuário não é admin');
      setIsLoading(false);
      return;
    }

    // Aguardar um breve momento para garantir que o token foi carregado
    setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[useAdminStats] Fetching admin statistics...');
        console.log('[useAdminStats] Token disponível:', !!goApiClient.currentToken);
        
        const result = await goApiClient.makeRequest('api-admin-stats', {
          method: 'GET',
        }, true);

        if (result.error) {
          console.error('[useAdminStats] Erro na requisição:', result.error);
          throw new Error(result.error);
        }

        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          const statsData = result.data[0];
          setStats({
            total_petitions: Number(statsData.total_petitions) || 0,
            total_users: Number(statsData.total_users) || 0,
            pending_petitions: Number(statsData.pending_petitions) || 0,
            distribution_by_status: statsData.distribution_by_status || {},
          });
          console.log('[useAdminStats] Statistics loaded successfully:', statsData);
        } else {
          console.warn('[useAdminStats] No data received');
          setStats({
            total_petitions: 0,
            total_users: 0,
            pending_petitions: 0,
            distribution_by_status: {},
          });
        }
      } catch (err) {
        console.error('[useAdminStats] Error fetching statistics:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido ao carregar estatísticas'));
      } finally {
        setIsLoading(false);
      }
    }, 100); // Pequeno delay para garantir sincronização

  }, [authInitialized, user?.isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    isAdmin: user?.isAdmin || false,
  };
};

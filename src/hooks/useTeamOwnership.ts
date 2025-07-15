
import { useState, useEffect, useCallback } from 'react';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { checkTeamOwnership, CACHE_DURATIONS } from '@/utils/cacheUtils';
import { supabase } from '@/integrations/supabase/client';

export const useTeamOwnership = (teamId?: string | null) => {
  const { user } = useGoAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkOwnership = useCallback(async (forceRefresh = false) => {
    if (!user?.id || !teamId) {
      setIsOwner(false);
      return;
    }

    setLoading(true);
    try {
      const ownerStatus = await checkTeamOwnership(user.id, teamId, supabase, forceRefresh);
      setIsOwner(ownerStatus);
    } catch (error) {
      console.error('[useTeamOwnership] Erro ao verificar proprietário:', error);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id, teamId]);

  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  return { isOwner, loading, refetch: () => checkOwnership(true) };
};

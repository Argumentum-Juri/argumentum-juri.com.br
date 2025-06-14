
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetcher } from '@/lib/fetcher';
import { useAuth } from '@/contexts/AuthContext';

export function usePetitionDetailFetcher() {
  const { id } = useParams<{ id: string }>();
  const { authInitialized, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authInitialized || !user || !id) {
      console.log('[usePetitionDetailFetcher] Skipping fetch - conditions not met');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('[usePetitionDetailFetcher] Fetching ID →', id);
    
    // Usando a nova assinatura do fetcher com apenas 1 argumento
    fetcher(`petitions?select=*,user:user_id(id,name,email,avatar_url)&id=eq.${id}`)
      .then(arr => {
        console.log('[usePetitionDetailFetcher] Success →', arr);
        if (arr.length === 0) {
          throw new Error('Petição não encontrada');
        }
        setData(arr[0]);
      })
      .catch(err => {
        console.error('[usePetitionDetailFetcher] Error →', err);
        setError(err.message);
      })
      .finally(() => {
        console.log('[usePetitionDetailFetcher] Finally - setting loading false');
        setLoading(false);
      });

  }, [authInitialized, user, id]);

  return { data, loading, error };
}

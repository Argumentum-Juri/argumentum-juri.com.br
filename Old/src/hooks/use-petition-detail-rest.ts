
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetcher } from '@/lib/fetcher';
import { PetitionDetail } from '@/types';

export function usePetitionDetailRest() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PetitionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    console.log('[usePetitionDetailRest] Fetching ID →', id);

    // Usar a API REST do Supabase para buscar a petição
    fetcher<PetitionDetail[]>(`petitions?select=*,user:user_id(id,name,email,avatar_url)&id=eq.${id}`)
      .then(arr => {
        console.log('[usePetitionDetailRest] Response →', arr);
        if (arr.length === 0) {
          throw new Error('Petição não encontrada');
        }
        setData(arr[0]);
      })
      .catch(err => {
        console.error('[usePetitionDetailRest] Error →', err);
        setError(err.message);
      })
      .finally(() => {
        console.log('[usePetitionDetailRest] Finally - setting loading false');
        setLoading(false);
      });

  }, [id]);

  return { data, loading, error };
}

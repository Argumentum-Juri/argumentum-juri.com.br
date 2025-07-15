
import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetcher } from '@/lib/fetcher';
import { useAuth } from '@/contexts/AuthContext';

export function usePetitionDetailDebug() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { authInitialized, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[usePetitionDetailDebug] Effect triggered', {
      id,
      authInitialized,
      user: !!user,
      location: location.pathname
    });

    if (!authInitialized || !user || !id) {
      console.log('[usePetitionDetailDebug] Skipping fetch - conditions not met');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('[usePetitionDetailDebug] Fetching ID →', id);
    
    // Usando fetch direto para eliminar qualquer middleware
    fetch(`/api/petitions/${id}`, { 
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('[usePetitionDetailDebug] Response status:', res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        console.log('[usePetitionDetailDebug] Success →', json);
        setData(json);
      })
      .catch(err => {
        console.error('[usePetitionDetailDebug] Error →', err);
        setError(err.message);
      })
      .finally(() => {
        console.log('[usePetitionDetailDebug] Finally - setting loading false');
        setLoading(false);
      });

  }, [authInitialized, user, id]);

  return { data, loading, error };
}

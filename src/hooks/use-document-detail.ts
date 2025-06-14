
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFetchWithId } from './use-fetch-with-id';
import { PetitionDocument } from '@/types';

export const useDocumentDetail = (documentId: string) => {
  // Validação específica para UUID
  const validateDocumentId = useCallback((id: string) => {
    if (!id || id === 'undefined' || id === 'null' || id.trim() === '') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }, []);

  // Função de fetch específica para documentos
  const fetchDocumentData = useCallback(async (id: string, options?: { signal?: AbortSignal }) => {
    const signal = options?.signal;
    
    console.log('[useDocumentDetail] 📡 Buscando dados do documento...');

    const { data: documentData, error: documentError } = await supabase
      .from('petition_documents')
      .select(`
        id, petition_id, file_name, file_type, file_path, file_size, 
        storage_path, r2_key, created_at, updated_at,
        petition:petition_id (id, title, user_id)
      `)
      .eq('id', id)
      .abortSignal(signal)
      .maybeSingle();

    if (signal?.aborted) {
      throw new Error('AbortError');
    }

    if (documentError) {
      console.error('[useDocumentDetail] ❌ Erro ao buscar documento:', documentError);
      throw documentError;
    }

    if (!documentData) {
      throw new Error('Documento não encontrado');
    }

    return documentData as PetitionDocument;
  }, []);

  // Usar o hook base
  const {
    data: document,
    isLoading,
    error,
    refresh
  } = useFetchWithId({
    id: documentId,
    fetchFunction: fetchDocumentData,
    validateId: validateDocumentId,
    routePattern: '/documents/{id}' // Ajustar conforme suas rotas
  });

  return {
    document,
    isLoading,
    error,
    refresh
  };
};

import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/utils/utils';
import { DocumentUploadResult, PetitionDocument } from '@/types';
import { toast } from 'sonner';

const STORAGE_PROVIDER = 'cloudflare';

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000   // 5 seconds
};

function sanitizeFilenameForStorage(filename: string): string {
  let sanitized = filename.replace(/[\s()\[\]{}'"\\\/+?&=#%]/g, '_');
  sanitized = sanitized.replace(/_{2,}/g, '_');
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  return sanitized || 'arquivo_sanitizado';
}

// File validation function
function validateFile(file: File): { isValid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Tipo de arquivo não permitido. Tipos aceitos: PDF, Word, TXT, Imagens` 
    };
  }

  return { isValid: true };
}

const uploadDocument = async (petitionId: string, file: File): Promise<DocumentUploadResult> => {
  console.log(`[uploadDocument Service] Iniciando upload via Edge Function para petitionId: ${petitionId}, file: ${file.name}`);
  
  try {
    // 1. Validação do arquivo antes do upload
    const validation = validateFile(file);
    if (!validation.isValid) {
      console.error(`[uploadDocument Service] Arquivo inválido: ${validation.error}`);
      toast.error(validation.error);
      return {
        id: '',
        success: false,
        error: validation.error || 'Arquivo inválido'
      };
    }

    // 2. Preparar FormData para enviar via Edge Function
    const formData = new FormData();
    formData.append('petitionId', petitionId);
    formData.append('file', file);

    console.log(`[uploadDocument Service] Chamando Edge Function upload-document`);
    
    // 3. Upload via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('upload-document', {
      body: formData
    });
    
    if (error) {
      console.error('[uploadDocument Service] Erro na Edge Function:', error);
      toast.error(`Falha no upload: ${error.message || 'Erro na função do servidor'}`);
      return {
        id: '',
        success: false,
        error: error.message || 'Erro na função do servidor'
      };
    }

    if (!data || !data.success) {
      console.error('[uploadDocument Service] Resposta de erro da Edge Function:', data);
      toast.error(`Falha no upload: ${data?.error || 'Erro desconhecido'}`);
      return {
        id: '',
        success: false,
        error: data?.error || 'Erro desconhecido'
      };
    }
    
    console.log(`[uploadDocument Service] Upload bem-sucedido via Edge Function, ID: ${data.id}`);
    
    return {
      id: data.id,
      success: true,
      file_name: data.file_name,
      file_type: data.file_type,
      petition_id: data.petition_id,
      file_url: data.file_url
    };
    
  } catch (error: any) {
    console.error('[uploadDocument Service] Erro geral:', error);
    
    // Enhanced error logging for monitoring
    const errorDetails = {
      petitionId,
      fileName: file.name,
      fileSize: file.size,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    console.error('[uploadDocument Service] Error details:', JSON.stringify(errorDetails));
    
    toast.error(`Falha no upload: ${error.message || 'Erro desconhecido'}`);
    return {
      id: '',
      success: false,
      error: error.message || 'Erro desconhecido ao fazer upload do documento'
    };
  }
};

const getPetitionDocuments = async (petitionId: string): Promise<PetitionDocument[]> => {
  console.log(`[getPetitionDocuments DB] Buscando documentos para petitionId: ${petitionId}`);
  try {
    const { data, error } = await supabase
      .from('petition_documents')
      .select('*')
      .eq('petition_id', petitionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getPetitionDocuments DB] Erro ao buscar documentos:', error);
      return [];
    }

    const documents = data.map(doc => ({
      id: doc.id,
      petition_id: doc.petition_id,
      file_name: doc.file_name || 'Nome Desconhecido',
      file_path: doc.file_url || '',
      file_type: doc.file_type || 'application/octet-stream',
      file_size: doc.file_size || 0,
      storage_path: doc.storage_path || '',
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      file_url: doc.file_url || ''
    } as PetitionDocument));

    return documents;
  } catch (error) {
    console.error('Exception in getPetitionDocuments:', error);
    return [];
  }
};

const getDocumentDownloadUrl = async (storagePath: string | null | undefined): Promise<string | null> => {
  console.log(`[getDocumentDownloadUrl] Construindo URL para path: ${storagePath}`);
  if (!storagePath) {
    console.error("[getDocumentDownloadUrl] Storage path não fornecido.");
    return null;
  }
  try {
    // Para documentos do Cloudflare R2, retorna a URL direta
    if (storagePath.startsWith('petition-files/')) {
      const endpoint = import.meta.env.VITE_CF_ENDPOINT;
      return `${endpoint}/${storagePath}`;
    }
    
    // Para documentos do Supabase Storage (legacy)
    const { data } = supabase.storage.from('petition-assets').getPublicUrl(storagePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Exception in getDocumentDownloadUrl:', error);
    return null;
  }
};

const deleteDocument = async (documentId: string): Promise<boolean> => {
  console.log(`[deleteDocument Service] Iniciando exclusão do documento ID: ${documentId}`);
  try {
    const { data: docData, error: docError } = await supabase
      .from('petition_documents')
      .select('storage_path, file_name, storage_provider')
      .eq('id', documentId)
      .single();

    if (docError && docError.code !== 'PGRST116') {
      console.error(docError);
      return false;
    }
    if (!docData) {
      console.warn("Doc not found in DB");
      return true;
    }

    if (docData.storage_path) {
      console.log(`[deleteDocument Service] Removendo arquivo do Storage: ${docData.storage_path}`);
      
      if (docData.storage_provider === 'cloudflare') {
        // Apagar do Cloudflare R2
        try {
          await fetch(`${import.meta.env.VITE_CF_ENDPOINT}/${docData.storage_path}`, { method: 'DELETE' });
          console.log(`[deleteDocument Service] Arquivo removido do R2: ${docData.storage_path}`);
        } catch (error) {
          console.error('[deleteDocument Service] Falha ao remover do R2:', error);
          return false;
        }
      } else {
        // Apagar do Supabase Storage (legacy)
        const { error: storageError } = await supabase.storage.from('petition-assets').remove([docData.storage_path]);
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          return false;
        }
      }
    }

    const { error: deleteDbError } = await supabase
      .from('petition_documents')
      .delete()
      .eq('id', documentId);

    if (deleteDbError) {
      console.error(deleteDbError);
      toast.error("Erro ao remover registro do DB.");
      return false;
    }

    toast.success(`Documento "${docData.file_name || 'ID: '+documentId}" excluído.`);
    return true;
  } catch (error) {
    console.error('Exception in deleteDocument:', error);
    toast.error("Erro inesperado ao excluir documento.");
    return false;
  }
};

const generateDocument = async (petitionId: string): Promise<string | null> => {
  console.log(`[generateDocument Service] Iniciando para petitionId: ${petitionId}`);
  try {
    const { data: petitionData, error: petitionError } = await supabase
      .from('petitions')
      .select('*')
      .eq('id', petitionId)
      .single();
      
    if (petitionError) {
      console.error('Error fetching petition data:', petitionError);
      return null;
    }

    const content = `Petição: ${petitionData.title}\nDescrição: ${petitionData.description}\nData: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain' });

    const originalGeneratedFileName = `generated_${Date.now()}.txt`;
    const sanitizedGeneratedFilenamePart = sanitizeFilenameForStorage(originalGeneratedFileName);
    const storagePath = `petition-files/${petitionId}/documents/${sanitizedGeneratedFilenamePart}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('petition-assets')
      .upload(storagePath, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[generateDocument] Erro no upload:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('petition-assets')
      .getPublicUrl(uploadData.path);

    const { data: docData, error: docError } = await supabase
      .from('petition_documents')
      .insert([{
        petition_id: petitionId,
        file_name: originalGeneratedFileName,
        file_type: 'text/plain',
        file_size: blob.size,
        file_path: uploadData.path,
        file_url: publicUrlData.publicUrl,
        storage_path: uploadData.path,
        storage_provider: 'supabase'
      }])
      .select('id')
      .single();

    if (docError) {
      console.error('Error inserting document metadata:', docError);
      await supabase.storage.from('petition-assets').remove([uploadData.path]);
      return null;
    }

    console.log(`[generateDocument Service] Documento gerado e registrado com ID: ${docData.id}`);
    return docData.id;
  } catch (error) {
    console.error('Exception in generateDocument:', error);
    return null;
  }
};

export const petitionDocuments = {
  uploadDocument,
  getPetitionDocuments,
  deleteDocument,
  getDocumentDownloadUrl,
  generateDocument
};
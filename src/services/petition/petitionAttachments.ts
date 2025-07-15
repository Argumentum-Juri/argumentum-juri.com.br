import { supabase } from '@/integrations/supabase/client';
import { PetitionAttachment } from '@/types';
import { toast } from 'sonner';

// Assume que todo novo anexo vai para Supabase Storage
const STORAGE_PROVIDER = 'supabase';

// --- Helper para Sanitizar Nomes de Arquivo ---
function sanitizeFilenameForStorage(filename: string): string {
  let sanitized = filename.replace(/[\s()\[\]{}'"]/g, '_');
  sanitized = sanitized.replace(/_{2,}/g, '_');
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  return sanitized || 'arquivo_sanitizado';
}

// Interface para o retorno de upload
interface AttachmentUploadResult {
    success: boolean;
    attachment?: PetitionAttachment;
    error?: string;
}

/**
 * Faz upload de um anexo via Supabase Storage e salva metadados no DB
 */
const uploadAttachment = async (petitionId: string, file: File): Promise<AttachmentUploadResult> => {
  const originalFilename = file.name;
  console.log(`[uploadAttachment Service] Iniciando para petitionId: ${petitionId}, file: ${originalFilename}`);
  
  try {
    // 1. Gera path sanitizado
    const timestamp = new Date().getTime();
    const sanitizedFilenamePart = sanitizeFilenameForStorage(originalFilename);
    const finalFilenameForKey = `${timestamp}-${sanitizedFilenamePart}`;
    const storagePath = `petition-files/${petitionId}/attachments/${finalFilenameForKey}`;

    console.log(`[uploadAttachment Service] Original: ${originalFilename}, Storage Path: ${storagePath}`);

    // 2. Upload via Supabase Storage
    console.log(`[uploadAttachment Service] Fazendo upload para Supabase Storage: ${storagePath}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('petition-assets')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[uploadAttachment Service] Erro no upload Supabase:', uploadError);
      return {
        success: false,
        error: uploadError.message || 'Erro ao fazer upload do anexo'
      };
    }

    // 3. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('petition-assets')
      .getPublicUrl(uploadData.path);

    // 4. Salvar no banco
    const { data: dbData, error: dbError } = await supabase
      .from('petition_attachments')
      .insert({
        petition_id: petitionId,
        file_name: originalFilename,
        storage_path: uploadData.path,
        file_type: file.type,
        size: file.size,
        file_url: publicUrlData.publicUrl,
        storage_provider: STORAGE_PROVIDER
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('[uploadAttachment Service] Erro ao salvar no DB:', dbError);
      // Reverter upload
      await supabase.storage.from('petition-assets').remove([uploadData.path]);
      return {
        success: false,
        error: `Erro ao salvar metadados: ${dbError.message}`
      };
    }

    console.log('[uploadAttachment Service] Metadados salvos OK:', dbData);

    const createdAttachment: PetitionAttachment = {
      id: dbData.id,
      petition_id: dbData.petition_id,
      file_name: dbData.file_name,
      file_type: dbData.file_type,
      storage_path: dbData.storage_path || '',
      size: dbData.size || 0,
      created_at: dbData.created_at,
      file_url: dbData.file_url || ''
    };

    return {
      success: true,
      attachment: createdAttachment,
    };
  } catch (error) {
    console.error('[uploadAttachment Service] Erro geral:', error);
    toast.error(`Falha no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido durante o upload do anexo',
    };
  }
};

const getAttachments = async (petitionId: string): Promise<{ success: boolean; data?: PetitionAttachment[]; error?: string; }> => {
     console.log(`[getAttachments DB] Buscando anexos para petitionId: ${petitionId}`);
     try {
        const { data: attachmentsData, error: dbError } = await supabase
          .from('petition_attachments')
          .select('*')
          .eq('petition_id', petitionId)
          .order('created_at', { ascending: false });

        if (dbError) throw new Error(`Erro DB: ${dbError.message}`);

        const mappedAttachments: PetitionAttachment[] = attachmentsData.map((dbAttachment) => ({
            id: dbAttachment.id,
            petition_id: dbAttachment.petition_id,
            file_name: dbAttachment.file_name || 'Nome Desconhecido',
            file_type: dbAttachment.file_type || 'application/octet-stream',
            storage_path: dbAttachment.storage_path || '',
            size: dbAttachment.size || 0,
            created_at: dbAttachment.created_at,
            file_url: dbAttachment.file_url || '',
        }));
        return { success: true, data: mappedAttachments };
     } catch (error) {
        console.error('[getAttachments DB] Erro:', error);
        return { success: false, error: 'Erro ao buscar anexos' };
     }
};

const deleteAttachment = async (attachmentId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
     console.log(`[deleteAttachment Service] Iniciando exclusão do anexo ID: ${attachmentId}`);
     try {
        const { data: attachment, error: fetchError } = await supabase
          .from('petition_attachments')
          .select('storage_path, storage_provider, file_name')
          .eq('id', attachmentId)
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw new Error(`Erro DB fetch: ${fetchError.message}`);
        }
        
        if (!attachment) {
          return { success: true, message: "Registro não encontrado." };
        }

        // Deletar do Supabase Storage se tiver path
        if (attachment.storage_path) {
            console.log(`[deleteAttachment Service] Removendo arquivo do Storage: ${attachment.storage_path}`);
            const { error: storageError } = await supabase.storage
              .from('petition-assets')
              .remove([attachment.storage_path]);
            
            if (storageError) {
                console.error(`[deleteAttachment Service] Erro ao excluir do Storage: ${storageError.message}`);
                return {
                    success: false,
                    error: 'Erro ao excluir anexo do armazenamento'
                };
            }
        }

        // Deletar do banco
        const { error: deleteDbError } = await supabase
          .from('petition_attachments')
          .delete()
          .eq('id', attachmentId);
          
        if (deleteDbError) {
          throw new Error(`Erro DB delete: ${deleteDbError.message}`);
        }

        toast.success(`Anexo "${attachment.file_name || 'ID: '+attachmentId}" excluído.`);
        return { success: true };
     } catch (error) {
        console.error('[deleteAttachment Service] Erro:', error);
        return { success: false, error: 'Erro ao excluir anexo' };
     }
};

export const petitionAttachments = { uploadAttachment, getAttachments, deleteAttachment };
export { uploadAttachment, getAttachments, deleteAttachment };
export default { uploadAttachment, getAttachments, deleteAttachment };
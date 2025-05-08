import { supabase } from '@/integrations/supabase/client'; // Para interações com o DB
import { PetitionAttachment } from '@/types'; // Tipo para retorno
import { r2Storage } from '@/services/storage/r2Storage'; // Sua abstração para R2/Edge Functions
import { toast } from 'sonner';

// Assume que todo novo anexo vai para R2
const STORAGE_PROVIDER = 'r2';

// --- Helper para Sanitizar Nomes de Arquivo ---
// (Coloque em src/lib/utils.ts ou mantenha aqui se preferir)
function sanitizeFilenameForR2(filename: string): string {
  // 1. Substitui espaços e caracteres comuns problemáticos por underline
  // Adicione outros caracteres se necessário: /[\s()\[\]{}'"\\\/+?&=#%]/g
  let sanitized = filename.replace(/[\s()\[\]{}'"]/g, '_');
  // 2. Remove múltiplos underlines consecutivos
  sanitized = sanitized.replace(/_{2,}/g, '_');
  // 3. Remove underlines no início ou fim
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  // 4. Garante que não fique vazio
  return sanitized || 'arquivo_sanitizado';
}
// --- Fim do Helper ---

// Interface para o retorno de upload
interface AttachmentUploadResult {
    success: boolean;
    attachment?: PetitionAttachment; // Retorna o anexo criado no DB
    error?: string;
}

/**
 * Faz upload de um anexo de petição para R2 via Edge Function
 * e salva os metadados no Supabase DB.
 * AGORA SANITIZA O NOME DO ARQUIVO PARA A CHAVE R2.
 */
const uploadAttachment = async (petitionId: string, file: File): Promise<AttachmentUploadResult> => {
  const originalFilename = file.name; // Guarda nome original
  console.log(`[uploadAttachment Service] Iniciando para petitionId: ${petitionId}, file: ${originalFilename}`);
  try {
    // 1. Gera a Key R2 SANITIZADA
    const timestamp = new Date().getTime();
    // *** SANITIZAÇÃO APLICADA AQUI ***
    const sanitizedFilenamePart = sanitizeFilenameForR2(originalFilename);
    const finalFilenameForKey = `${timestamp}-${sanitizedFilenamePart}`; // Usa nome sanitizado na key
    // *** FIM DA SANITIZAÇÃO ***
    const r2Key = `petition-files/${petitionId}/attachments/${finalFilenameForKey}`; // Caminho completo sanitizado

    console.log(`[uploadAttachment Service] Original: ${originalFilename}, Sanitized Part: ${sanitizedFilenamePart}, R2 Key: ${r2Key}`);

    // 2. Chama a abstração que invoca a Edge Function 'r2-upload' com a key JÁ SANITIZADA
    console.log(`[uploadAttachment Service] Chamando r2Storage.uploadFile para key: ${r2Key}`);
    const uploadResult = await r2Storage.uploadFile(r2Key, file); // Passa a key sanitizada

    if (!uploadResult.success || !uploadResult.key) {
      console.error('[uploadAttachment Service] Falha no upload via r2Storage:', uploadResult.error);
      throw new Error(uploadResult.error || 'Falha ao fazer upload do anexo para o armazenamento R2.');
    }

    const returnedKey = uploadResult.key; // Deve ser a mesma key sanitizada
    const publicUrl = uploadResult.url; // A URL pública (que agora terá a key sanitizada)
    console.log('[uploadAttachment Service] Upload R2 OK. Key:', returnedKey, 'URL:', publicUrl);

    // 3. Salva os metadados no banco de dados Supabase
    console.log('[uploadAttachment Service] Salvando metadados no DB...');
    const { data: dbData, error: dbError } = await supabase
      .from('petition_attachments')
      .insert({
        petition_id: petitionId,
        file_name: originalFilename, // *** Salva o NOME ORIGINAL no DB ***
        storage_path: null, // Campo antigo não usado
        file_type: file.type,
        size: file.size,
        file_url: publicUrl, // URL pública com key sanitizada
        storage_provider: STORAGE_PROVIDER,
        r2_key: returnedKey // Salva a key SANITIZADA usada no R2
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('[uploadAttachment Service] Erro ao salvar metadados no DB:', dbError);
      console.warn(`[uploadAttachment Service] Tentando reverter upload R2 para key: ${returnedKey}`);
      await r2Storage.deleteFile(returnedKey).catch(delErr => console.error("Falha ao reverter upload R2:", delErr));
      throw new Error(`Erro ao salvar metadados no banco: ${dbError.message}`);
    }

    console.log('[uploadAttachment Service] Metadados salvos OK:', dbData);

    // Mapeia para o tipo de retorno, usando o nome original salvo no DB
    const createdAttachment: PetitionAttachment = {
      id: dbData.id,
      petition_id: dbData.petition_id,
      file_name: dbData.file_name, // Nome original para exibição
      file_type: dbData.file_type,
      storage_path: dbData.r2_key || '', // Mapeia a key sanitizada
      size: dbData.size || 0,
      created_at: dbData.created_at,
      file_url: dbData.file_url || '', // URL com key sanitizada
      // r2_key: dbData.r2_key, // Descomente se precisar do campo explícito
      // storage_provider: dbData.storage_provider
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

// --- getAttachments (NÃO MUDA) ---
// Continua buscando do DB, onde file_name é o original e r2_key é a sanitizada
const getAttachments = async (petitionId: string): Promise<{ success: boolean; data?: PetitionAttachment[]; error?: string; }> => {
    // ... código mantido como na v9 ...
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
            storage_path: dbAttachment.r2_key || dbAttachment.storage_path || '',
            size: dbAttachment.size || 0,
            created_at: dbAttachment.created_at,
            file_url: dbAttachment.file_url || '',
            // r2_key: dbAttachment.r2_key,
            // storage_provider: dbAttachment.storage_provider
        }));
        return { success: true, data: mappedAttachments };
     } catch (error) { /* ... tratamento erro ... */ }
     return { success: false, error: 'Erro desconhecido' }; // Fallback
};

// --- deleteAttachment (NÃO MUDA) ---
// Continua buscando r2_key do DB (que é a sanitizada) e passando para r2Storage.deleteFile
const deleteAttachment = async (attachmentId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    // ... código mantido como na v9 ...
     console.log(`[deleteAttachment Service] Iniciando exclusão do anexo ID: ${attachmentId}`);
     let r2KeyToDelete: string | null = null;
     try {
        const { data: attachment, error: fetchError } = await supabase
          .from('petition_attachments')
          .select('r2_key, storage_provider, file_name')
          .eq('id', attachmentId)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') throw new Error(`Erro DB fetch: ${fetchError.message}`);
        if (!attachment) return { success: true, message: "Registro não encontrado." };

        r2KeyToDelete = attachment?.r2_key;
        if (attachment?.storage_provider === 'r2' && r2KeyToDelete) {
            const r2DeleteSuccess = await r2Storage.deleteFile(r2KeyToDelete);
            if (!r2DeleteSuccess) throw new Error("Falha ao excluir do R2.");
        } else { console.warn(`Anexo ${attachmentId} não é R2 ou falta key.`); }

        const { error: deleteDbError } = await supabase.from('petition_attachments').delete().eq('id', attachmentId);
        if (deleteDbError) throw new Error(`Erro DB delete: ${deleteDbError.message}`);

        toast.success(`Anexo "${attachment.file_name || 'ID: '+attachmentId}" excluído.`);
        return { success: true };
     } catch (error) { /* ... tratamento erro ... */ }
     return { success: false, error: 'Erro desconhecido' }; // Fallback
};


// --- Exports (mantido) ---
export const petitionAttachments = { uploadAttachment, getAttachments, deleteAttachment };
export { uploadAttachment, getAttachments, deleteAttachment };
export default { uploadAttachment, getAttachments, deleteAttachment };
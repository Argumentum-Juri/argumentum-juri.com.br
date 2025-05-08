
import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/utils/utils'; // Mantido
import { DocumentUploadResult, PetitionDocument } from '@/types';
import { r2Storage } from '@/services/storage/r2Storage'; // Sua abstração R2
import { toast } from 'sonner'; // Para notificações

const STORAGE_PROVIDER = 'r2';

// --- Helper para Sanitizar Nomes de Arquivo ---
// (Coloque em src/lib/utils.ts ou mantenha aqui se preferir)
function sanitizeFilenameForR2(filename: string): string {
  // 1. Substitui espaços e caracteres comuns problemáticos por underline
  let sanitized = filename.replace(/[\s()\[\]{}'"\\\/+?&=#%]/g, '_');
  // 2. Remove múltiplos underlines consecutivos
  sanitized = sanitized.replace(/_{2,}/g, '_');
  // 3. Remove underlines no início ou fim
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  // 4. Garante que não fique vazio
  return sanitized || 'arquivo_sanitizado';
}
// --- Fim do Helper ---


/**
 * Faz upload de um documento de petição para R2 via Edge Function
 * e salva os metadados no Supabase DB, sanitizando a key.
 */
const uploadDocument = async (petitionId: string, file: File): Promise<DocumentUploadResult> => {
  const originalFilename = file.name; // Guarda nome original
  console.log(`[uploadDocument Service] Iniciando para petitionId: ${petitionId}, file: ${originalFilename}`);
  try {
    // 1. Gera a Key R2 SANITIZADA
    const timestamp = new Date().getTime();
    const sanitizedFilenamePart = sanitizeFilenameForR2(originalFilename);
    const finalFilenameForKey = `${timestamp}-${sanitizedFilenamePart}`; // Usa nome sanitizado
    const r2Key = `petition-files/${petitionId}/documents/${finalFilenameForKey}`; // Caminho completo sanitizado

    console.log(`[uploadDocument Service] Original: ${originalFilename}, Sanitized Part: ${sanitizedFilenamePart}, R2 Key: ${r2Key}`);

    // 2. Chama a abstração 'r2Storage' com a key JÁ SANITIZADA
    console.log(`[uploadDocument Service] Chamando r2Storage.uploadFile para key: ${r2Key}`);
    const uploadResult = await r2Storage.uploadFile(r2Key, file); // Passa key sanitizada

    if (!uploadResult.success || !uploadResult.key) {
      console.error('[uploadDocument Service] Falha no upload via r2Storage:', uploadResult.error);
      // Retorna um DocumentUploadResult com erro
      return { id: '', success: false, error: uploadResult.error || 'Falha no upload R2' };
    }

    const returnedKey = uploadResult.key; // Key sanitizada confirmada
    const publicUrl = uploadResult.url; // URL com key sanitizada
    console.log('[uploadDocument Service] Upload R2 OK. Key:', returnedKey, 'URL:', publicUrl);

    // 3. Salva os metadados no Supabase DB
    console.log('[uploadDocument Service] Salvando metadados no DB...');
    const { data: docData, error: docError } = await supabase
      .from('petition_documents')
      .insert([
        {
          petition_id: petitionId,
          file_name: originalFilename, // *** Salva o NOME ORIGINAL no DB ***
          file_type: file.type,
          file_size: file.size,
          file_path: publicUrl, // URL com key sanitizada
          file_url: publicUrl, // URL com key sanitizada
          storage_path: null, // Campo antigo não usado
          storage_provider: STORAGE_PROVIDER,
          r2_key: returnedKey // Salva a key SANITIZADA usada no R2
        }
      ])
      .select() // Seleciona o registro inserido
      .single();

    if (docError) {
      console.error('[uploadDocument Service] Erro ao salvar metadados no DB:', docError);
      console.warn(`[uploadDocument Service] Tentando reverter upload R2 para key: ${returnedKey}`);
      await r2Storage.deleteFile(returnedKey).catch(delErr => console.error("Falha ao reverter upload R2:", delErr));
      // Retorna um DocumentUploadResult com erro
      return { id: '', success: false, error: `Erro DB: ${docError.message}` };
    }

    console.log('[uploadDocument Service] Metadados salvos OK:', docData);

    // Retorna sucesso com os dados do DB
    return {
      id: docData.id,
      success: true,
      file_name: docData.file_name, // Nome original
      file_type: docData.file_type,
      petition_id: docData.petition_id,
      file_url: publicUrl // URL com key sanitizada
    };
  } catch (error: any) {
    console.error('[uploadDocument Service] Erro geral:', error);
    toast.error(`Falha no upload: ${error.message || 'Erro desconhecido'}`); // Notifica o usuário
    return {
      id: '',
      success: false,
      error: error.message || 'Erro desconhecido ao fazer upload do documento'
    };
  }
};

/**
 * Busca os metadados de todos os documentos de uma petição diretamente do Supabase DB.
 */
const getPetitionDocuments = async (petitionId: string): Promise<PetitionDocument[]> => {
    // Nenhuma mudança necessária aqui, continua buscando do DB
    console.log(`[getPetitionDocuments DB] Buscando documentos para petitionId: ${petitionId}`);
    try {
      const { data, error } = await supabase
        .from('petition_documents')
        .select('*')
        .eq('petition_id', petitionId)
        .order('created_at', { ascending: false });

      if (error) {
        // handleSupabaseError(error, 'Erro ao obter documentos'); // Descomentar se usar
        console.error('[getPetitionDocuments DB] Erro ao buscar documentos do DB:', error);
        return [];
      }

      const documents = data.map(doc => ({
          id: doc.id,
          petition_id: doc.petition_id,
          file_name: doc.file_name || 'Nome Desconhecido',
          file_path: doc.file_url || '', // Usa file_url como file_path também
          file_type: doc.file_type || 'application/octet-stream',
          file_size: doc.file_size || 0,
          storage_path: doc.r2_key || doc.storage_path || '', // Mapeia r2_key para storage_path
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          file_url: doc.file_url || '', // URL salva no DB (com key sanitizada)
          // r2_key: doc.r2_key, // Descomente se o tipo PetitionDocument tiver
          // storage_provider: doc.storage_provider // Descomente se o tipo PetitionDocument tiver
      } as PetitionDocument));

      return documents;
    } catch (error) {
      console.error('Exception in getPetitionDocuments DB:', error);
      return [];
    }
};

/**
 * Obtém a URL pública construída a partir da key R2 (sanitizada) lida do DB.
 * Usado se o acesso direto via URL pública for necessário (requer bucket público ou domínio custom).
 */
const getDocumentDownloadUrl = async (documentR2Key: string | null | undefined): Promise<string | null> => {
    // Nenhuma mudança necessária, já usa a key (sanitizada) vinda do DB
    console.log(`[getDocumentDownloadUrl Construct] Construindo URL para key: ${documentR2Key}`);
    if (!documentR2Key) {
        console.error("[getDocumentDownloadUrl Construct] Key do R2 não fornecida.");
        return null;
    }
    try {
      // Usa a função getPublicUrl da abstração r2Storage para consistência
      return r2Storage.getPublicUrl(documentR2Key);
    } catch (error) {
      console.error('Exception in getDocumentDownloadUrl Construct:', error);
      return null;
    }
};

/**
 * Deleta um documento do R2 (via Edge Function) e do Supabase DB.
 */
const deleteDocument = async (documentId: string): Promise<boolean> => {
    // Nenhuma mudança necessária, já lê a r2_key (sanitizada) do DB e passa para r2Storage
    console.log(`[deleteDocument Service] Iniciando exclusão do documento ID: ${documentId}`);
    let r2KeyToDelete: string | null = null;
    try {
      const { data: docData, error: docError } = await supabase
        .from('petition_documents')
        .select('r2_key, storage_provider, file_name') // Pega a r2_key
        .eq('id', documentId)
        .single();

      if (docError && docError.code !== 'PGRST116') { /* handleSupabaseError(docError) */ console.error(docError); return false; }
      if (!docData) { console.warn("Doc not found in DB"); return true; } // Já deletado? Sucesso.

      r2KeyToDelete = docData.r2_key;

      // Deleta do R2 se for r2 e tiver a key
      if (docData.storage_provider === 'r2' && r2KeyToDelete) {
        console.log(`[deleteDocument Service] Chamando r2Storage.deleteFile para key: ${r2KeyToDelete}`);
        const success = await r2Storage.deleteFile(r2KeyToDelete); // Chama abstração
        if (!success) {
             console.error('Error deleting file from R2:', r2KeyToDelete);
             // Considerar se deve parar ou apenas logar e continuar
             return false; // Para aqui para evitar inconsistência
        }
         console.log("Arquivo deletado do R2.");
      } else {
          console.warn(`Doc ${documentId} não é R2 ou falta r2_key.`);
      }

      // Deleta do DB
      const { error: deleteDbError } = await supabase
        .from('petition_documents')
        .delete()
        .eq('id', documentId);

      if (deleteDbError) { /* handleSupabaseError(deleteDbError) */ console.error(deleteDbError); toast.error("Erro ao remover registro do DB."); return false; }

      toast.success(`Documento "${docData.file_name || 'ID: '+documentId}" excluído.`);
      return true;
    } catch (error) {
      console.error('Exception in deleteDocument:', error);
      toast.error("Erro inesperado ao excluir documento.");
      return false;
    }
};

/**
 * Gera um documento de texto simples e faz upload para R2, sanitizando a key.
 */
const generateDocument = async (petitionId: string): Promise<string | null> => {
  console.log(`[generateDocument Service] Iniciando para petitionId: ${petitionId}`);
  try {
    // Obter informações da petição
    const { data: petitionData, error: petitionError } = await supabase
      .from('petitions')
      .select('*')
      .eq('id', petitionId)
      .single();
      
    if (petitionError) { 
      console.error('Error fetching petition data:', petitionError);
      return null;
    }

    // Criar conteúdo e Blob (mantido)
    const content = `Petição: ${petitionData.title}\nDescrição: ${petitionData.description}\nData: ${new Date().toLocaleDateString()}`;
    const blob = new Blob([content], { type: 'text/plain' });

    // Gerar nome e key R2 SANITIZADA
    const originalGeneratedFileName = `generated_${Date.now()}.txt`;
    // Aplica sanitização ao nome gerado (embora não tenha caracteres especiais, mantém consistência)
    const sanitizedGeneratedFilenamePart = sanitizeFilenameForR2(originalGeneratedFileName);
    const r2Key = `petition-files/${petitionId}/documents/${sanitizedGeneratedFilenamePart}`; // Usa nome sanitizado

    console.log(`[generateDocument Service] Generated filename: ${originalGeneratedFileName}, R2 Key: ${r2Key}`);

    // Upload para o R2 via abstração (passa key sanitizada)
    const uploadResult = await r2Storage.uploadFile(r2Key, blob); // Passa key sanitizada

    if (!uploadResult.success || !uploadResult.key) {
      console.error('Error uploading generated document to R2:', uploadResult.error);
      return null;
    }
    const returnedKey = uploadResult.key; // Key sanitizada confirmada
    const publicUrl = uploadResult.url; // URL com key sanitizada

    // Salva registro no DB
    console.log('[generateDocument Service] Salvando metadados no DB...');
    const { data: docData, error: docError } = await supabase
      .from('petition_documents')
      .insert([{
          petition_id: petitionId,
          file_name: originalGeneratedFileName, // Salva nome original gerado
          file_type: 'text/plain',
          file_size: blob.size,
          file_path: publicUrl,
          file_url: publicUrl,
          storage_path: null,
          storage_provider: 'r2',
          r2_key: returnedKey // Salva key sanitizada
       }])
      .select('id')
      .single();

    if (docError) { 
      console.error('Error inserting document metadata:', docError);
      // Tenta reverter upload R2
      await r2Storage.deleteFile(returnedKey).catch(delErr => 
        console.error("Falha ao reverter upload R2:", delErr));
      return null; 
    }

    console.log(`[generateDocument Service] Documento gerado e registrado com ID: ${docData.id}`);
    return docData.id;
  } catch (error) {
    console.error('Exception in generateDocument:', error);
    return null;
  }
};

// Export final
export const petitionDocuments = {
  uploadDocument,
  getPetitionDocuments,
  deleteDocument,
  getDocumentDownloadUrl,
  generateDocument
};


import { createClient } from '@supabase/supabase-js';

// Constantes para o ambiente
const R2_ACCOUNT_ID = import.meta.env.NEXT_PUBLIC_R2_ACCOUNT_ID || '';
const R2_BUCKET_NAME = import.meta.env.NEXT_PUBLIC_R2_BUCKET_NAME || 'argumentum';
const R2_PUBLIC_URL = import.meta.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Obtém o URL base da aplicação para chamar as funções edge
const getBaseUrl = () => {
  return 'https://mefgswdpeellvaggvttc.supabase.co';
};

/**
 * Serviço para gerenciar uploads e downloads de arquivos no Cloudflare R2
 */
export const r2Storage = {
  /**
   * Faz upload de um arquivo para o Cloudflare R2
   * @param filePath Caminho do arquivo no bucket
   * @param file Arquivo a ser enviado
   * @returns Objeto com informações sobre o upload
   */
  uploadFile: async (filePath: string, file: File | Blob): Promise<{
    success: boolean;
    key: string;
    url: string;
    error?: string;
  }> => {
    try {
      console.log(`[R2] Iniciando upload para caminho: ${filePath}`);
      
      // Upload via edge function
      const result = await uploadViaEdgeFunction(filePath, file);
      if (!result.success) {
        console.error(`[R2] Erro no upload: ${result.error}`);
        return {
          success: false,
          key: '',
          url: '',
          error: result.error || 'Erro ao fazer upload'
        };
      }
      
      console.log(`[R2] Upload concluído com sucesso: ${result.url}`);
      return {
        success: true,
        key: result.key || filePath,
        url: result.url || `${R2_PUBLIC_URL}/${R2_BUCKET_NAME}/${filePath}`
      };
    } catch (error) {
      console.error('[R2] Erro ao fazer upload:', error);
      return {
        success: false,
        key: '',
        url: '',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  },

  /**
   * Gera uma URL pública para um arquivo no R2
   * @param key Chave do arquivo no bucket
   * @returns URL pública do arquivo
   */
  getPublicUrl: (key: string): string => {
    return `${R2_PUBLIC_URL}/${R2_BUCKET_NAME}/${key}`;
  },

  /**
   * Exclui um arquivo do Cloudflare R2
   * @param key Chave do arquivo no bucket
   * @returns Sucesso da operação
   */
  deleteFile: async (key: string): Promise<boolean> => {
    try {
      console.log(`[R2] Tentando excluir arquivo: ${key}`);
      
      const baseUrl = getBaseUrl();
      console.log(`[R2] Chamando endpoint de exclusão: ${baseUrl}/functions/v1/r2-delete`);
      
      const response = await fetch(`${baseUrl}/functions/v1/r2-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Erro desconhecido';
        }
        
        console.error(`[R2] Erro na resposta de exclusão: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Erro HTTP: ${response.status} - ${errorText || 'Erro desconhecido'}`);
      }

      const data = await response.json();
      
      console.log(`[R2] Resposta de exclusão: ${JSON.stringify(data)}`);
      
      return data.success;
    } catch (error) {
      console.error('[R2] Erro ao excluir arquivo:', error);
      return false;
    }
  },
};

/**
 * Função auxiliar para fazer upload de arquivos via edge function
 */
async function uploadViaEdgeFunction(filePath: string, file: File | Blob) {
  // Criar FormData para envio do arquivo
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', filePath);

  const baseUrl = getBaseUrl();
  console.log(`[R2] Tentando upload via edge function: ${baseUrl}/functions/v1/r2-upload`);
  console.log(`[R2] Tamanho do arquivo: ${file instanceof File ? file.size : 'blob'} bytes`);

  try {
    // Implementação simples de tentativa única para reduzir complexidade
    const response = await fetch(`${baseUrl}/functions/v1/r2-upload`, {
      method: 'POST',
      body: formData,
      // Adicionando um timeout de 30 segundos
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error(`[R2] Erro na resposta: ${response.status} ${response.statusText}`);
      let errorMessage = `Erro HTTP: ${response.status}`;
      
      try {
        const errorBody = await response.json();
        console.error('[R2] Erro detalhado:', errorBody);
        errorMessage = errorBody.error || errorMessage;
      } catch (jsonError) {
        try {
          const errorText = await response.text();
          console.error('[R2] Erro detalhado (texto):', errorText);
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          console.error('[R2] Não foi possível ler o texto de erro da resposta');
        }
      }
      
      throw new Error(errorMessage);
    }

    // Processar a resposta JSON
    const result = await response.json();
    console.log('[R2] Upload bem-sucedido:', result);
    return result;
  } catch (error) {
    console.error('[R2] Erro durante upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido durante upload'
    };
  }
}

export default r2Storage;

import { supabase } from "@/integrations/supabase/client";
import { PetitionSettings } from "@/types"; 
import { toast } from 'sonner';
import { r2Storage } from "@/services/storage/r2Storage";

const STORAGE_PROVIDER_R2 = 'r2';

// Interface para o tipo de dados retornado da tabela do Supabase
interface PetitionSettingsDB {
  id: string;
  user_id: string;
  font_family: string;
  font_size: string;
  line_spacing: string;
  margin_size: string;
  paragraph_indent: string;
  use_letterhead: boolean;
  logo_url: string | null;
  letterhead_template_url: string | null;
  petition_template_url: string | null;
  created_at: string;
  updated_at: string;
  primary_color?: string;
  accent_color?: string;
  logo_r2_key?: string | null;
  logo_storage_provider?: string | null;
  logo_original_filename?: string | null;
  letterhead_template_r2_key?: string | null;
  letterhead_template_storage_provider?: string | null;
  letterhead_template_original_filename?: string | null;
  petition_template_r2_key?: string | null;
  petition_template_storage_provider?: string | null;
  petition_template_original_filename?: string | null;
  [key: string]: any; // Para permitir índices de string adicionais
}

// Interface atualizada para permitir valores booleanos e garantir que user_id esteja presente
interface SettingsDbUpdate {
  [key: string]: string | null | undefined | boolean;
  user_id: string; // Campo obrigatório
}

// Função de mapeamento para converter dados do DB para o modelo de domínio
const mapDbToSettings = (data: PetitionSettingsDB): PetitionSettings => {
  return {
    id: data.id,
    user_id: data.user_id,
    font_family: data.font_family,
    font_size: data.font_size,
    line_spacing: data.line_spacing,
    margin_size: data.margin_size,
    paragraph_indent: data.paragraph_indent,
    use_letterhead: data.use_letterhead,
    logo_url: data.logo_url,
    letterhead_template_url: data.letterhead_template_url,
    petition_template_url: data.petition_template_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
    primary_color: data.primary_color || "#0F3E73",
    accent_color: data.accent_color || "#BB9C45",
    logo_r2_key: data.logo_r2_key || null,
    logo_storage_provider: data.logo_storage_provider || null,
    logo_original_filename: data.logo_original_filename || null,
    letterhead_template_r2_key: data.letterhead_template_r2_key || null,
    letterhead_template_storage_provider: data.letterhead_template_storage_provider || null,
    letterhead_template_original_filename: data.letterhead_template_original_filename || null,
    petition_template_r2_key: data.petition_template_r2_key || null,
    petition_template_storage_provider: data.petition_template_storage_provider || null,
    petition_template_original_filename: data.petition_template_original_filename || null
  };
};

// -- Serviço --
export const petitionSettings = {
  getSettingsForUser: async (userId?: string): Promise<PetitionSettings | null> => {
    console.log("[getSettingsForUser DB] Buscando configurações no DB Supabase.");
    try {
      let targetUserId = userId;
      if (!targetUserId) { 
        const { data: userData } = await supabase.auth.getUser();
        targetUserId = userData?.user?.id;
      }
      if (!targetUserId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('petition_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { throw error; }

      if (!data) {
         console.log(`[getSettingsForUser DB] Nenhuma config encontrada para user ${targetUserId}. Retornando default.`);
        // Retorna configurações default com todos os campos obrigatórios
        return {
            id: '',
            user_id: targetUserId,
            font_family: 'Times New Roman',
            font_size: '12',
            line_spacing: '1.5',
            margin_size: 'normal',
            paragraph_indent: '1.25',
            use_letterhead: true,
            logo_url: null,
            letterhead_template_url: null,
            petition_template_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            primary_color: "#0F3E73",
            accent_color: "#BB9C45",
            logo_r2_key: null,
            logo_storage_provider: null,
            logo_original_filename: null,
            letterhead_template_r2_key: null,
            letterhead_template_storage_provider: null,
            letterhead_template_original_filename: null,
            petition_template_r2_key: null,
            petition_template_storage_provider: null,
            petition_template_original_filename: null
         };
      }
      
      // Converter dados do DB para o modelo de domínio
      return mapDbToSettings(data as PetitionSettingsDB);
    } catch (error) {
       console.error("[getSettingsForUser DB] Erro geral:", error);
       // Retorna default em caso de erro
       return {
         id: '',
         user_id: '',
         font_family: 'Times New Roman',
         font_size: '12',
         line_spacing: '1.5',
         margin_size: 'normal',
         paragraph_indent: '1.25',
         use_letterhead: true,
         logo_url: null,
         letterhead_template_url: null,
         petition_template_url: null,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString(),
         primary_color: "#0F3E73",
         accent_color: "#BB9C45",
         logo_r2_key: null,
         logo_storage_provider: null,
         logo_original_filename: null,
         letterhead_template_r2_key: null,
         letterhead_template_storage_provider: null,
         letterhead_template_original_filename: null,
         petition_template_r2_key: null,
         petition_template_storage_provider: null,
         petition_template_original_filename: null
       };
    }
  },

  saveSettings: async (settings: Partial<PetitionSettings>): Promise<PetitionSettings | null> => {
     console.log("[saveSettings DB] Salvando configurações no DB Supabase.");
     
     try {
        // Garantir que user_id está presente e é uma string válida, não vazia
        if (!settings.user_id || typeof settings.user_id !== 'string' || settings.user_id.trim() === '') { 
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.id) {
            settings.user_id = userData.user.id;
          } else {
            throw new Error("User ID ausente e não foi possível obtê-lo automaticamente");
          }
        }

        // Remover o campo id se estiver vazio para evitar erro de UUID
        if (settings.id === '' || !settings.id) {
          delete settings.id;
        }

        // Remover campos nulos desnecessários antes do upsert
        const cleanSettings = Object.fromEntries(
          Object.entries(settings).filter(([_, v]) => v !== undefined)
        );

        // Verificar se precisamos criar um novo registro ou atualizar um existente
        const { data: existingRecord } = await supabase
          .from('petition_settings')
          .select('id')
          .eq('user_id', cleanSettings.user_id as string)
          .maybeSingle();
          
        let data;
        let error;
        
        if (existingRecord?.id) {
          // Se já existe um registro, fazemos um update
          // Precisamos garantir que o user_id está no objeto
          const updateData = { 
            ...cleanSettings,
            user_id: cleanSettings.user_id // Garantir que user_id esteja presente
          } as SettingsDbUpdate;
          
          const result = await supabase
            .from('petition_settings')
            .update(updateData)
            .eq('user_id', updateData.user_id)
            .select();
            
          data = result.data;
          error = result.error;
        } else {
          // Se não existe, fazemos um insert
          const insertData = { 
            ...cleanSettings,
            user_id: cleanSettings.user_id // Garantir que user_id esteja presente
          } as SettingsDbUpdate;
          
          const result = await supabase
            .from('petition_settings')
            .insert(insertData)
            .select();
            
          data = result.data;
          error = result.error;
        }

        if (error) { throw error; }

        toast.success('Configurações salvas com sucesso!');
        console.log("[saveSettings DB] Configurações salvas.");
        
        // Converter os dados para o modelo de domínio
        if (data && data[0]) {
          return mapDbToSettings(data[0] as PetitionSettingsDB);
        }
        
        return null;
     } catch (error) {
        console.error("[saveSettings DB] Erro ao salvar configurações:", error);
        toast.error("Erro ao salvar configurações.");
        return null;
     }
  },

  getAllSettings: async (): Promise<PetitionSettings[]> => {
      console.log("[getAllSettings DB] Buscando todas as configurações no DB Supabase.");
    try {
      const { data, error } = await supabase
        .from('petition_settings')
        .select('*');

       if (error) { throw error; }
        console.log(`[getAllSettings DB] ${data?.length || 0} configurações encontradas.`);
      
      // Map database records to domain model
      return data.map(record => mapDbToSettings(record as PetitionSettingsDB));
    } catch (error) {
        console.error("[getAllSettings DB] Erro geral:", error);
      return [];
    }
  },

  uploadFile: async (
      userId: string,
      fileType: 'logo' | 'letterhead_template' | 'petition_template',
      file: File
  ): Promise<{url: string; key: string; originalFilename: string} | null> => {
      const originalFilename = file.name;
      console.log(`[uploadFile Settings] Iniciando para user ${userId}, tipo ${fileType}, file: ${originalFilename}`);
    try {
      const fileExt = originalFilename.split('.').pop() || 'bin';
      const r2Key = `user_settings/${userId}/${fileType}/${Date.now()}.${fileExt}`;

      console.log(`[uploadFile Settings] Chamando r2Storage.uploadFile para key: ${r2Key}`);
      const uploadResult = await r2Storage.uploadFile(r2Key, file);

      if (!uploadResult.success || !uploadResult.key) {
        throw new Error(uploadResult.error || `Erro ao fazer upload para R2: ${fileType}`);
      }

      const returnedKey = uploadResult.key;
      const publicUrl = uploadResult.url;
      console.log('[uploadFile Settings] Upload R2 OK. Key:', returnedKey, 'URL:', publicUrl);

      // Determina quais colunas do DB atualizar - usa um objeto tipado
      const dbUpdateData: SettingsDbUpdate = {
        user_id: userId // Garantir que user_id está sempre presente como required
      };
      
      // Usar as propriedades corretas baseadas no fileType e adicionar o nome original do arquivo
      if (fileType === 'logo') {
        dbUpdateData.logo_url = publicUrl;
        dbUpdateData.logo_r2_key = returnedKey;
        dbUpdateData.logo_storage_provider = STORAGE_PROVIDER_R2;
        dbUpdateData.logo_original_filename = originalFilename; // Salvar nome original
      } else if (fileType === 'letterhead_template') {
        dbUpdateData.letterhead_template_url = publicUrl;
        dbUpdateData.letterhead_template_r2_key = returnedKey;
        dbUpdateData.letterhead_template_storage_provider = STORAGE_PROVIDER_R2;
        dbUpdateData.letterhead_template_original_filename = originalFilename; // Salvar nome original
      } else if (fileType === 'petition_template') {
        dbUpdateData.petition_template_url = publicUrl;
        dbUpdateData.petition_template_r2_key = returnedKey;
        dbUpdateData.petition_template_storage_provider = STORAGE_PROVIDER_R2;
        dbUpdateData.petition_template_original_filename = originalFilename; // Salvar nome original
      }

      console.log(`[uploadFile Settings] Atualizando DB para user ${userId}:`, dbUpdateData);

      // Verificar se o registro já existe
      const { data: existingSettings } = await supabase
        .from('petition_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let error;
      
      if (existingSettings?.id) {
        // Atualizar registro existente
        const result = await supabase
          .from('petition_settings')
          .update(dbUpdateData)
          .eq('user_id', userId);
          
        error = result.error;
      } else {
        // Criar novo registro
        const result = await supabase
          .from('petition_settings')
          .insert(dbUpdateData);
          
        error = result.error;
      }

      if (error) {
        console.error('[uploadFile Settings] Erro ao atualizar metadados no DB:', error);
        console.warn(`[uploadFile Settings] Tentando reverter upload R2 para key: ${returnedKey}`);
        await r2Storage.deleteFile(returnedKey).catch(delErr => console.error("Falha ao reverter upload R2:", delErr));
        throw new Error(`Erro ao salvar referência do arquivo no banco: ${error.message}`);
      }

      console.log(`[uploadFile Settings] Referência DB para ${fileType} atualizada.`);
      // Retorna também o nome original do arquivo
      return { url: publicUrl, key: returnedKey, originalFilename };

    } catch (error) {
        console.error(`[uploadFile Settings] Erro geral para tipo ${fileType}:`, error);
        toast.error(`Erro no upload (${fileType}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return null;
    }
  },

  deleteFile: async (r2Key: string | null | undefined): Promise<boolean> => {
     console.log(`[deleteFile Settings] Tentando excluir R2 key: ${r2Key}`);
    if (!r2Key) {
        console.warn("[deleteFile Settings] Key R2 não fornecida para exclusão.");
        toast.error("Não foi possível identificar o arquivo para exclusão.");
        return false;
    }

    try {
        const success = await r2Storage.deleteFile(r2Key);
        if (!success) {
            return false;
        }
        console.log(`[deleteFile Settings] Arquivo R2 com key ${r2Key} excluído (ou tentativa enviada).`);
        return true;
    } catch (error) {
       console.error(`[deleteFile Settings] Erro ao excluir R2 key ${r2Key}:`, error);
       toast.error(`Erro ao excluir arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  },

  /**
   * Update specific settings fields directly in the database without full form submission
   * Useful for file operations that need to update the database after a file is deleted
   */
  updateSettings: async (userId: string, updates: Partial<PetitionSettings>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('petition_settings')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Unexpected error in updateSettings:', err);
      return false;
    }
  }
};

// Exportação individual para uso em arquivos externos
export const {
    getSettingsForUser,
    saveSettings,
    getAllSettings,
    uploadFile,
    deleteFile,
    updateSettings
} = petitionSettings;

// Export default
export default petitionSettings;

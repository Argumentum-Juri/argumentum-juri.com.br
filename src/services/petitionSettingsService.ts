import { supabase } from "@/integrations/supabase/client";
import { PetitionSettings } from "@/types/petitionSettings";
import { toast } from 'sonner';
import { formatDate } from '@/utils/formatDate';

export const getSettingsForUser = async (userId?: string): Promise<PetitionSettings> => {
  try {
    console.log("[getSettingsForUser DB] Buscando configurações no DB Supabase.");
    
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
      return getDefaultSettings(targetUserId);
    }
    
    return mapDbToSettings(data);
  } catch (error) {
    console.error("[getSettingsForUser DB] Erro geral:", error);
    return getDefaultSettings('');
  }
};

const getDefaultSettings = (userId: string): PetitionSettings => ({
  id: '',
  user_id: userId,
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
});

const mapDbToSettings = (data: any): PetitionSettings => ({
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
});

export const uploadFile = async (
  userId: string,
  fileType: 'logo' | 'letterhead_template' | 'petition_template',
  file: File
): Promise<{url: string; r2_key: string; provider: string} | null> => {
  const originalFilename = file.name;
  console.log(`[uploadFile] Iniciando upload via Supabase Storage para userId: ${userId}, fileType: ${fileType}`);

  try {
    const fileExt = originalFilename.split('.').pop() || 'bin';
    const storagePath = `user_settings/${userId}/${fileType}/${Date.now()}.${fileExt}`;

    console.log(`[uploadFile] Fazendo upload para Supabase Storage: ${storagePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('petition-assets')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`[uploadFile] Erro no upload Supabase para ${fileType}:`, uploadError);
      toast.error(`Erro ao fazer upload: ${uploadError.message}`);
      return null;
    }

    console.log(`[uploadFile] Upload Supabase bem-sucedido para ${fileType}:`, uploadData);

    const { data: publicUrlData } = supabase.storage
      .from('petition-assets')
      .getPublicUrl(uploadData.path);

    return {
      url: publicUrlData.publicUrl,
      r2_key: uploadData.path,
      provider: 'supabase'
    };
  } catch (error) {
    console.error(`[uploadFile] Erro geral para tipo ${fileType}:`, error);
    toast.error(`Erro no upload (${fileType}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return null;
  }
};

export const deleteFile = async (storagePath: string | null | undefined): Promise<boolean> => {
  console.log(`[deleteFile] Removendo arquivo do Supabase Storage: ${storagePath}`);

  if (!storagePath) {
    console.warn("[deleteFile] Storage path não fornecido para exclusão.");
    toast.error("Não foi possível identificar o arquivo para exclusão.");
    return false;
  }

  try {
    const { error: storageError } = await supabase.storage.from('petition-assets').remove([storagePath]);
    const success = !storageError;
    
    if (!success) {
      console.error(`[deleteFile] Erro ao excluir do Storage: ${storageError?.message}`);
      toast.error(`Erro ao excluir arquivo: ${storageError?.message}`);
      return false;
    }
    
    console.log(`[deleteFile] Arquivo com path ${storagePath} excluído.`);
    return true;
  } catch (error) {
    console.error(`[deleteFile] Erro ao excluir storage path ${storagePath}:`, error);
    toast.error(`Erro ao excluir arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return false;
  }
};

export const updateSettings = async (userId: string, updates: Partial<PetitionSettings>): Promise<boolean> => {
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
};

export const saveFileSettings = async (params: {
  fileType: 'logo' | 'letterhead_template' | 'petition_template';
  user_id: string;
  url: string;
  originalFilename: string;
  r2_key?: string;
  storage_provider?: string;
}): Promise<Partial<PetitionSettings>> => {
  const { fileType, user_id, url, originalFilename, r2_key, storage_provider } = params;
  
  try {
    const updates: Partial<PetitionSettings> = {};
    
    if (fileType === 'logo') {
      updates.logo_url = url;
      updates.logo_original_filename = originalFilename;
      if (r2_key) updates.logo_r2_key = r2_key;
      if (storage_provider) updates.logo_storage_provider = storage_provider;
    } else if (fileType === 'letterhead_template') {
      updates.letterhead_template_url = url;
      updates.letterhead_template_original_filename = originalFilename;
      if (r2_key) updates.letterhead_template_r2_key = r2_key;
      if (storage_provider) updates.letterhead_template_storage_provider = storage_provider;
    } else if (fileType === 'petition_template') {
      updates.petition_template_url = url;
      updates.petition_template_original_filename = originalFilename;
      if (r2_key) updates.petition_template_r2_key = r2_key;
      if (storage_provider) updates.petition_template_storage_provider = storage_provider;
    }

    const { data, error } = await supabase
      .from('petition_settings')
      .upsert({
        user_id,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving file settings:', error);
      throw error;
    }

    return mapDbToSettings(data);
  } catch (err) {
    console.error('Error in saveFileSettings:', err);
    throw err;
  }
};

export const saveSettings = async (userId: string, updates: Partial<PetitionSettings>): Promise<Partial<PetitionSettings>> => {
  try {
    const { data, error } = await supabase
      .from('petition_settings')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving settings:', error);
      throw error;
    }

    return mapDbToSettings(data);
  } catch (err) {
    console.error('Error in saveSettings:', err);
    throw err;
  }
};

export default { getSettingsForUser, uploadFile, deleteFile, updateSettings, saveFileSettings, saveSettings };

import { supabase } from "@/integrations/supabase/client";

// Define PetitionSettings type directly here since there was an issue importing from '../types'
export interface PetitionSettings {
  id: string;
  user_id: string;
  font_family: string;
  font_size: string;
  margin_size: string;
  line_spacing: string;
  paragraph_indent: string;
  use_letterhead: boolean;
  logo_url: string | null;
  logo_r2_key: string | null;
  logo_storage_provider: string | null;
  logo_original_filename: string | null;
  letterhead_template_url: string | null;
  letterhead_template_r2_key: string | null;
  letterhead_template_storage_provider: string | null;
  letterhead_template_original_filename: string | null;
  petition_template_url: string | null;
  petition_template_r2_key: string | null;
  petition_template_storage_provider: string | null;
  petition_template_original_filename: string | null;
  fileObj?: File; // Add this for file uploads
  created_at?: string; // Convertido para string para evitar problemas de tipagem
  updated_at?: string; // Convertido para string para evitar problemas de tipagem
}

export const getSettingsForUser = async (userId?: string): Promise<PetitionSettings> => {
  try {
    console.log("[getSettingsForUser DB] Buscando configurações no DB Supabase.");

    // If no userId provided, get the current user's ID
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: userData } = await supabase.auth.getUser();
      targetUserId = userData?.user?.id;
    }

    if (!targetUserId) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("petition_settings")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching settings:", error);
    }

    if (!data) {
      console.info(`[getSettingsForUser DB] Nenhuma config encontrada para user ${targetUserId}. Retornando default.`);
      // Return default settings if no settings exist for the user
      return {
        id: "",
        user_id: targetUserId,
        font_family: "Times New Roman",
        font_size: "12",
        margin_size: "normal",
        line_spacing: "1.5",
        paragraph_indent: "1.25",
        use_letterhead: true,
        logo_url: null,
        logo_r2_key: null,
        logo_storage_provider: null,
        logo_original_filename: null,
        letterhead_template_url: null,
        letterhead_template_r2_key: null,
        letterhead_template_storage_provider: null,
        letterhead_template_original_filename: null,
        petition_template_url: null,
        petition_template_r2_key: null,
        petition_template_storage_provider: null,
        petition_template_original_filename: null
      };
    }

    return data as PetitionSettings;
  } catch (error) {
    console.error("Error in getSettingsForUser:", error);
    throw error;
  }
};

export const saveSettings = async (settings: Partial<PetitionSettings>): Promise<PetitionSettings> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      throw new Error("User not authenticated");
    }

    // First check if settings exist for user
    const { data: existingData } = await supabase
      .from("petition_settings")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    let result;
    if (existingData) {
      // Update existing settings
      const { data, error } = await supabase
        .from("petition_settings")
        .update(settings)
        .eq("user_id", userData.user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from("petition_settings")
        .insert({ 
          ...settings, 
          user_id: userData.user.id 
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result as PetitionSettings;
  } catch (error) {
    console.error("Error in saveSettings:", error);
    throw error;
  }
};

// Add the updateSettings function needed by LogoSettings and TemplateSettings
export const updateSettings = async (newSettings: Partial<PetitionSettings>): Promise<PetitionSettings> => {
  return await saveSettings(newSettings);
};

export const getAllSettings = async (): Promise<PetitionSettings[]> => {
  try {
    const { data, error } = await supabase
      .from("petition_settings")
      .select("*");

    if (error) throw error;

    return data as PetitionSettings[];
  } catch (error) {
    console.error("Error in getAllSettings:", error);
    throw error;
  }
};

export const uploadFile = async (
  userId: string,
  fileType: 'logo' | 'letterhead_template' | 'petition_template',
  file: File
): Promise<{
  url: string;
  r2_key: string;
}> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session?.access_token) {
      throw new Error("User not authenticated");
    }

    // Get signed URL for upload
    const { data, error } = await supabase.functions.invoke('r2-upload', {
      body: {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        userId: userId,
        fileType: fileType
      },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });

    if (error) throw error;
    
    const { uploadUrl, publicUrl, r2Key } = data;

    // Upload the file to the signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error uploading file: ${uploadResponse.statusText}`);
    }

    return {
      url: publicUrl,
      r2_key: r2Key
    };
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

export const deleteFile = async (r2Key: string): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session?.access_token) {
      throw new Error("User not authenticated");
    }

    // Delete file using R2 delete endpoint
    const { error } = await supabase.functions.invoke('r2-delete', {
      body: {
        key: r2Key
      },
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`
      }
    });

    if (error) {
      console.error("Error deleting file:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteFile:", error);
    return false;
  }
};

// Add the uploadLogo function needed by SettingsContext
export const uploadLogo = async (file: File, userId: string): Promise<Partial<PetitionSettings>> => {
  try {
    const result = await uploadFile(userId, 'logo', file);
    
    // Update the settings with the new logo information
    const logoSettings: Partial<PetitionSettings> = {
      logo_url: result.url,
      logo_r2_key: result.r2_key,
      logo_storage_provider: 'r2',
      logo_original_filename: file.name
    };
    
    // Save the updated settings
    return await saveSettings({
      user_id: userId,
      ...logoSettings
    });
  } catch (error) {
    console.error("Error in uploadLogo:", error);
    throw error;
  }
};

// Add the removeLogo function needed by SettingsContext
export const removeLogo = async (userId: string): Promise<boolean> => {
  try {
    // Get current settings to retrieve r2_key
    const currentSettings = await getSettingsForUser(userId);
    
    // Delete the file if r2_key exists
    if (currentSettings.logo_r2_key) {
      await deleteFile(currentSettings.logo_r2_key);
    }
    
    // Update settings to remove logo references
    await saveSettings({
      user_id: userId,
      logo_url: null,
      logo_r2_key: null,
      logo_storage_provider: null,
      logo_original_filename: null
    });
    
    return true;
  } catch (error) {
    console.error("Error in removeLogo:", error);
    throw error;
  }
};

export const petitionSettingsService = {
  getSettingsForUser,
  saveSettings,
  getAllSettings,
  uploadFile,
  deleteFile,
  updateSettings,
  uploadLogo,
  removeLogo
};

export default petitionSettingsService;

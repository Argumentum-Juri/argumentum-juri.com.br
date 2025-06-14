
import { supabase } from "@/integrations/supabase/client";
import { DocumentInfo } from '@/types/documentInfo';

/**
 * Service responsible for handling document operations
 * and ensuring petition formatting settings are preserved
 */
export const documentService = {
  /**
   * Save petition formatting settings in a separate field to preserve form_answers
   * This ensures that form answers are not overwritten by formatting settings
   */
  savePetitionFormatSettings: async (petitionId: string, userId: string): Promise<boolean> => {
    try {
      // Get the user's current settings
      const { data: settings, error: settingsError } = await supabase
        .from('petition_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (settingsError) {
        console.error("Error fetching user settings:", settingsError);
        return false;
      }
      
      if (!settings) {
        console.log("No settings found for user, using defaults");
        return true;
      }
      
      // Get current petition data to preserve existing form_answers
      const { data: petitionData, error: petitionError } = await supabase
        .from('petitions')
        .select('form_answers')
        .eq('id', petitionId)
        .maybeSingle();
      
      if (petitionError) {
        console.error("Error fetching petition data:", petitionError);
        return false;
      }
      
      // Preserve existing form_answers and add format_settings separately
      const currentFormAnswers = petitionData?.form_answers || {};
      
      // Create format settings object
      const formatSettings = {
        font_family: settings.font_family,
        font_size: settings.font_size,
        line_spacing: settings.line_spacing,
        paragraph_indent: settings.paragraph_indent,
        margin_size: settings.margin_size,
        use_letterhead: settings.use_letterhead,
        primary_color: settings.primary_color,
        accent_color: settings.accent_color,
        letterhead_template_r2_key: settings.letterhead_template_r2_key,
        letterhead_template_url: settings.letterhead_template_url,
        letterhead_template_storage_provider: settings.letterhead_template_storage_provider,
        petition_template_r2_key: settings.petition_template_r2_key,
        petition_template_url: settings.petition_template_url,
        petition_template_storage_provider: settings.petition_template_storage_provider,
        logo_r2_key: settings.logo_r2_key,
        logo_url: settings.logo_url,
        logo_storage_provider: settings.logo_storage_provider
      };
      
      // Update the petition preserving form_answers and storing format settings separately
      // Fix: Only spread if currentFormAnswers is a valid object
      let updatedFormAnswers = {};
      
      if (currentFormAnswers && typeof currentFormAnswers === 'object' && !Array.isArray(currentFormAnswers)) {
        updatedFormAnswers = {
          ...currentFormAnswers,
          // Only add format_settings if it doesn't already exist
          ...((!('format_settings' in currentFormAnswers)) ? { format_settings: formatSettings } : {})
        };
      } else {
        // If currentFormAnswers is not a valid object, create a new one
        updatedFormAnswers = { format_settings: formatSettings };
      }
      
      const { error: updateError } = await supabase
        .from('petitions')
        .update({ 
          form_answers: updatedFormAnswers
        })
        .eq('id', petitionId);
      
      if (updateError) {
        console.error("Error updating petition with format settings:", updateError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Exception in savePetitionFormatSettings:", error);
      return false;
    }
  },
  
  /**
   * Get petition format settings, either from the petition itself (preferred)
   * or fallback to the user's current settings
   */
  getPetitionFormatSettings: async (petitionId: string, userId: string) => {
    try {
      // First try to get the settings from the petition itself
      const { data: petition, error: petitionError } = await supabase
        .from('petitions')
        .select('form_answers, user_id')
        .eq('id', petitionId)
        .maybeSingle();
        
      if (petitionError) {
        console.error("Error fetching petition for format settings:", petitionError);
        return null;
      }
      
      // If the petition has format settings in form_answers, use those
      if (petition?.form_answers && 
          typeof petition.form_answers === 'object' &&
          !Array.isArray(petition.form_answers) &&
          (petition.form_answers as any).format_settings) {
        return (petition.form_answers as any).format_settings;
      }
      
      // Otherwise, get the settings from the user
      // (using the petition creator's user ID, not the current user)
      const userIdToUse = petition?.user_id || userId;
      
      const { data: settings, error: settingsError } = await supabase
        .from('petition_settings')
        .select('*')
        .eq('user_id', userIdToUse)
        .maybeSingle();
        
      if (settingsError) {
        console.error("Error fetching user settings:", settingsError);
        return null;
      }
      
      if (!settings) {
        return null;
      }
      
      return settings;
    } catch (error) {
      console.error("Exception in getPetitionFormatSettings:", error);
      return null;
    }
  }
};

export default documentService;


import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import petitionSettingsService from '@/services/petitionSettingsService';
import { PetitionSettings } from '@/types/petitionSettings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SettingsContextType {
  settings: Partial<PetitionSettings> | null;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<PetitionSettings>) => Promise<void>;
  removeLogo: () => Promise<void>;
  removeLetterhead: () => Promise<void>;
  removeTemplate: () => Promise<void>;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<PetitionSettings> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const fetchedSettings = await petitionSettingsService.getSettingsForUser(user.id);
        setSettings(fetchedSettings || { user_id: user.id });
        setError(null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
        toast.error('Erro ao carregar configurações', {
          description: 'Por favor, tente novamente mais tarde.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user?.id]);

  const updateSettings = async (newSettings: Partial<PetitionSettings>) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare settings object with user_id always set
      const updatedSettings = {
        ...newSettings,
        user_id: user.id
      };

      // Handle file upload for logo
      if (newSettings.fileObj) {
        const file = newSettings.fileObj as File;
        
        // Use the Edge Function to upload to R2
        const { data, error } = await supabase.functions.invoke('r2-upload', {
          body: {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            folder: `logos/${user.id}`
          }
        });
        
        if (error) throw error;
        
        if (!data || !data.uploadUrl || !data.key) {
          throw new Error("Failed to get upload URL");
        }
        
        // Upload the file using the pre-signed URL
        const uploadResult = await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!uploadResult.ok) {
          throw new Error(`Upload failed: ${uploadResult.statusText}`);
        }
        
        // Update settings to include the R2 key and storage provider
        updatedSettings.logo_r2_key = data.key;
        updatedSettings.logo_storage_provider = 'r2';
        updatedSettings.logo_url = `${data.publicUrl}`;
        updatedSettings.logo_original_filename = file.name;
        
        // Remove the file object as it's not needed anymore
        delete updatedSettings.fileObj;
      }
      
      // Handle file upload for letterhead
      if (newSettings.letterheadFileObj) {
        const file = newSettings.letterheadFileObj as File;
        
        // Use the Edge Function to upload to R2
        const { data, error } = await supabase.functions.invoke('r2-upload', {
          body: {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            folder: `letterheads/${user.id}`
          }
        });
        
        if (error) throw error;
        
        if (!data || !data.uploadUrl || !data.key) {
          throw new Error("Failed to get upload URL for letterhead");
        }
        
        // Upload the file using the pre-signed URL
        const uploadResult = await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!uploadResult.ok) {
          throw new Error(`Upload failed: ${uploadResult.statusText}`);
        }
        
        // Update settings to include the R2 key and storage provider
        updatedSettings.letterhead_template_r2_key = data.key;
        updatedSettings.letterhead_template_storage_provider = 'r2';
        updatedSettings.letterhead_template_url = `${data.publicUrl}`;
        updatedSettings.letterhead_template_original_filename = file.name;
        
        // Remove the file object as it's not needed anymore
        delete updatedSettings.letterheadFileObj;
      }
      
      // Handle file upload for template
      if (newSettings.templateFileObj) {
        const file = newSettings.templateFileObj as File;
        
        // Use the Edge Function to upload to R2
        const { data, error } = await supabase.functions.invoke('r2-upload', {
          body: {
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            folder: `templates/${user.id}`
          }
        });
        
        if (error) throw error;
        
        if (!data || !data.uploadUrl || !data.key) {
          throw new Error("Failed to get upload URL for template");
        }
        
        // Upload the file using the pre-signed URL
        const uploadResult = await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type
          },
          body: file
        });
        
        if (!uploadResult.ok) {
          throw new Error(`Upload failed: ${uploadResult.statusText}`);
        }
        
        // Update settings to include the R2 key and storage provider
        updatedSettings.petition_template_r2_key = data.key;
        updatedSettings.petition_template_storage_provider = 'r2';
        updatedSettings.petition_template_url = `${data.publicUrl}`;
        updatedSettings.petition_template_original_filename = file.name;
        
        // Remove the file object as it's not needed anymore
        delete updatedSettings.templateFileObj;
      }

      // Save to database
      await petitionSettingsService.saveSettings(updatedSettings);
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        ...updatedSettings
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = async () => {
    if (!user?.id || !settings?.logo_r2_key) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete the file from R2
      if (settings.logo_r2_key) {
        const { error } = await supabase.functions.invoke('r2-delete', {
          body: { key: settings.logo_r2_key }
        });
        
        if (error) throw error;
      }
      
      // Update the database
      const updatedSettings = {
        user_id: user.id,
        logo_url: null,
        logo_r2_key: null,
        logo_storage_provider: null,
        logo_original_filename: null
      };
      
      await petitionSettingsService.saveSettings(updatedSettings);
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        logo_url: null,
        logo_r2_key: null,
        logo_storage_provider: null,
        logo_original_filename: null
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error removing logo:', err);
      setError('Failed to remove logo');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeLetterhead = async () => {
    if (!user?.id || !settings?.letterhead_template_r2_key) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete the file from R2
      if (settings.letterhead_template_r2_key) {
        const { error } = await supabase.functions.invoke('r2-delete', {
          body: { key: settings.letterhead_template_r2_key }
        });
        
        if (error) throw error;
      }
      
      // Update the database
      const updatedSettings = {
        user_id: user.id,
        letterhead_template_url: null,
        letterhead_template_r2_key: null,
        letterhead_template_storage_provider: null,
        letterhead_template_original_filename: null
      };
      
      await petitionSettingsService.saveSettings(updatedSettings);
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        letterhead_template_url: null,
        letterhead_template_r2_key: null,
        letterhead_template_storage_provider: null,
        letterhead_template_original_filename: null
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error removing letterhead:', err);
      setError('Failed to remove letterhead');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeTemplate = async () => {
    if (!user?.id || !settings?.petition_template_r2_key) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete the file from R2
      if (settings.petition_template_r2_key) {
        const { error } = await supabase.functions.invoke('r2-delete', {
          body: { key: settings.petition_template_r2_key }
        });
        
        if (error) throw error;
      }
      
      // Update the database
      const updatedSettings = {
        user_id: user.id,
        petition_template_url: null,
        petition_template_r2_key: null,
        petition_template_storage_provider: null,
        petition_template_original_filename: null
      };
      
      await petitionSettingsService.saveSettings(updatedSettings);
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        petition_template_url: null,
        petition_template_r2_key: null,
        petition_template_storage_provider: null,
        petition_template_original_filename: null
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error removing template:', err);
      setError('Failed to remove template');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      isLoading, 
      updateSettings,
      removeLogo,
      removeLetterhead,
      removeTemplate, 
      error 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

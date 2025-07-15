
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useGoAuth } from './GoAuthContext';
import { petitionSettingsService } from '@/services/petition/petitionSettingsService';
import { PetitionSettings } from '@/types/petitionSettings';
import { toast } from 'sonner';
import { goApiClient } from '@/lib/goApiClient';

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
  const { user } = useGoAuth();
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
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('🔄 [SettingsContext] Iniciando updateSettings com:', newSettings);
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
        
        console.log('📁 [SettingsContext] Fazendo upload do logo...');
        const uploadResult = await goApiClient.uploadDocument(file, 'logo');
        
        console.log('📁 [SettingsContext] Resultado do upload:', uploadResult);
        
        if (uploadResult.error) {
          console.error('❌ [SettingsContext] Erro no upload:', uploadResult.error);
          throw new Error(uploadResult.error);
        }
        
        if (!uploadResult.data?.url) {
          console.error('❌ [SettingsContext] Upload retornou sem URL válida');
          throw new Error("Upload failed - no valid URL returned");
        }
        
        console.log('✅ [SettingsContext] Upload bem-sucedido:', uploadResult.data);
        
        // Use the new saveFileSettings function
        const savedSettings = await (petitionSettingsService.saveFileSettings as any)({
          fileType: 'logo',
          user_id: user.id,
          url: uploadResult.data.url,
          originalFilename: uploadResult.data.filename,
          r2_key: uploadResult.data.r2_key,
          storage_provider: uploadResult.data.storage_provider
        });
        
        console.log('✅ [SettingsContext] Logo settings saved:', savedSettings);
        
        // Update local state
        setSettings(prevSettings => ({
          ...prevSettings,
          ...savedSettings
        }));
        
        setError(null);
        toast.success('Logo salvo com sucesso!');
        return;
      }
      
      // Handle file upload for letterhead - use consistent 'letterhead' fileType
      if (newSettings.letterheadFileObj) {
        const file = newSettings.letterheadFileObj as File;
        
        console.log('📁 [SettingsContext] Fazendo upload do papel timbrado...');
        const uploadResult = await goApiClient.uploadDocument(file, 'letterhead');
        
        console.log('📁 [SettingsContext] Resultado do upload letterhead:', uploadResult);
        
        if (uploadResult.error) {
          console.error('❌ [SettingsContext] Erro no upload letterhead:', uploadResult.error);
          throw new Error(uploadResult.error);
        }
        
        if (!uploadResult.data?.url) {
          console.error('❌ [SettingsContext] Upload letterhead retornou sem URL válida');
          throw new Error("Letterhead upload failed - no valid URL returned");
        }
        
        console.log('✅ [SettingsContext] Upload letterhead bem-sucedido:', uploadResult.data);
        
        // Use the new saveFileSettings function
        const savedSettings = await (petitionSettingsService.saveFileSettings as any)({
          fileType: 'letterhead_template',
          user_id: user.id,
          url: uploadResult.data.url,
          originalFilename: uploadResult.data.filename,
          r2_key: uploadResult.data.r2_key,
          storage_provider: uploadResult.data.storage_provider
        });
        
        console.log('✅ [SettingsContext] Letterhead settings saved:', savedSettings);
        
        // Update local state
        setSettings(prevSettings => ({
          ...prevSettings,
          ...savedSettings
        }));
        
        setError(null);
        toast.success('Papel timbrado salvo com sucesso!');
        return;
      }
      
      // Handle file upload for template - use consistent 'template' fileType
      if (newSettings.templateFileObj) {
        const file = newSettings.templateFileObj as File;
        
        console.log('📁 [SettingsContext] Fazendo upload do template...');
        const uploadResult = await goApiClient.uploadDocument(file, 'template');
        
        console.log('📁 [SettingsContext] Resultado do upload template:', uploadResult);
        
        if (uploadResult.error) {
          console.error('❌ [SettingsContext] Erro no upload template:', uploadResult.error);
          throw new Error(uploadResult.error);
        }
        
        if (!uploadResult.data?.url) {
          console.error('❌ [SettingsContext] Upload template retornou sem URL válida');
          throw new Error("Template upload failed - no valid URL returned");
        }
        
        console.log('✅ [SettingsContext] Upload template bem-sucedido:', uploadResult.data);
        
        // Use the new saveFileSettings function
        const savedSettings = await (petitionSettingsService.saveFileSettings as any)({
          fileType: 'petition_template',
          user_id: user.id,
          url: uploadResult.data.url,
          originalFilename: uploadResult.data.filename,
          r2_key: uploadResult.data.r2_key,
          storage_provider: uploadResult.data.storage_provider
        });
        
        console.log('✅ [SettingsContext] Template settings saved:', savedSettings);
        
        // Update local state
        setSettings(prevSettings => ({
          ...prevSettings,
          ...savedSettings
        }));
        
        setError(null);
        toast.success('Template salvo com sucesso!');
        return;
      }

      // Save regular settings (no file upload)
      console.log('💾 [SettingsContext] Salvando configurações regulares no banco:', updatedSettings);
      const savedSettings = await petitionSettingsService.saveSettings(updatedSettings);
      console.log('✅ [SettingsContext] Configurações salvas:', savedSettings);
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        ...savedSettings
      }));
      
      setError(null);
      toast.success('Configurações salvas com sucesso!');
      console.log('🎉 [SettingsContext] UpdateSettings concluído com sucesso');
    } catch (err) {
      console.error('❌ [SettingsContext] Error updating settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      toast.error('Erro ao salvar configurações', {
        description: errorMessage,
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeLogo = async () => {
    if (!user?.id || !settings?.logo_url) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete via Go API (implementation will depend on backend)
      // For now, just update the database
      const updatedSettings = {
        logo_url: null,
        logo_original_filename: null
      };
      
      await petitionSettingsService.saveSettings({
        user_id: user.id,
        ...updatedSettings
      });
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        logo_url: null,
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
    if (!user?.id || !settings?.letterhead_template_url) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete via Go API (implementation will depend on backend)
      const updatedSettings = {
        letterhead_template_url: null,
        letterhead_template_original_filename: null
      };
      
      await petitionSettingsService.saveSettings({
        user_id: user.id,
        ...updatedSettings
      });
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        letterhead_template_url: null,
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
    if (!user?.id || !settings?.petition_template_url) {
      return;
    }

    setIsLoading(true);
    try {
      // Delete via Go API (implementation will depend on backend)
      const updatedSettings = {
        petition_template_url: null,
        petition_template_original_filename: null
      };
      
      await petitionSettingsService.saveSettings({
        user_id: user.id,
        ...updatedSettings
      });
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        petition_template_url: null,
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

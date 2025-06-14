
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { petitionSettingsService } from '@/services/petition/petitionSettingsService';
import type { PetitionSettings as PetitionSettingsType } from '@/types/petitionSettings';

import LayoutSettings from './petition-settings/LayoutSettings';
import FontSettings from './petition-settings/FontSettings';
import LogoSettings from './petition-settings/LogoSettings';
import TemplateSettings from './petition-settings/TemplateSettings';

const PetitionSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<PetitionSettingsType>>({
    user_id: user?.id || '',
    primary_color: "#0F3E73",
    accent_color: "#BB9C45",
    use_letterhead: true,
    margin_size: "normal",
    font_family: "Times New Roman",
    font_size: "12pt",
    line_spacing: "1.5",
    paragraph_indent: "1.25cm"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user?.id) return;
      
      try {
        const data = await petitionSettingsService.getSettingsForUser(user.id);
        if (data) {
          // Certifique-se de que o user_id está sempre atualizado 
          // mesmo que venha vazio do banco
          setSettings({
            ...data,
            user_id: user.id
          });
        }
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar suas configurações",
        });
      }
    };
    
    fetchSettings();
  }, [user?.id, toast]);

  // Garantir que user_id é atualizado sempre que o usuário mudar
  useEffect(() => {
    if (user?.id) {
      setSettings(prev => ({...prev, user_id: user.id}));
    }
  }, [user?.id]);

  const handleSettingsChange = (newSettings: Partial<PetitionSettingsType>) => {
    setSettings(prev => ({...prev, ...newSettings}));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    // Garantir que o user_id está sempre atualizado antes de salvar
    const settingsToSave = {
      ...settings,
      user_id: user.id
    };
    
    setIsSaving(true);
    try {
      await petitionSettingsService.saveSettings(settingsToSave);
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de petição foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar suas configurações",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsProvider>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Petição</CardTitle>
            <CardDescription>
              Personalize o visual e o formato dos seus documentos jurídicos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="layout">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="layout">Layout</TabsTrigger>
                <TabsTrigger value="fonts">Fontes</TabsTrigger>
                <TabsTrigger value="letterhead">Timbrado</TabsTrigger>
                <TabsTrigger value="templates">Modelos</TabsTrigger>
              </TabsList>
              <TabsContent value="layout">
                <LayoutSettings 
                  settings={settings} 
                  onChange={handleSettingsChange} 
                />
              </TabsContent>
              <TabsContent value="fonts">
                <FontSettings 
                  settings={settings} 
                  onChange={handleSettingsChange} 
                />
              </TabsContent>
              <TabsContent value="letterhead">
                <LogoSettings />
              </TabsContent>
              <TabsContent value="templates">
                <TemplateSettings 
                  settings={settings} 
                  onChange={handleSettingsChange} 
                />
              </TabsContent>
            </Tabs>

            <div className="mt-8 flex justify-end">
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsProvider>
  );
};

export default PetitionSettings;

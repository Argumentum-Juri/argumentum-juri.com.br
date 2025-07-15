
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGoAuth } from "@/contexts/GoAuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { petitionSettingsService } from '@/services/petition/petitionSettingsService';
import type { PetitionSettings as PetitionSettingsType } from '@/types/petitionSettings';
import { Check, Loader2 } from "lucide-react";

import LayoutSettings from './petition-settings/LayoutSettings';
import FontSettings from './petition-settings/FontSettings';
import LogoSettings from './petition-settings/LogoSettings';
import TemplateSettings from './petition-settings/TemplateSettings';

const PetitionSettings: React.FC = () => {
  const { user } = useGoAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
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
    console.log('🚀 handleSubmit disparado', { settings, userId: user?.id });

    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado",
      });
      return;
    }
    
    setIsSaving(true);
    setJustSaved(false);
    
    try {
      const payload = {
        ...settings,
        user_id: user.id,
      };
      console.log('✨ Salvando configurações com payload:', payload);

      await petitionSettingsService.saveSettings(payload);
      
      setJustSaved(true);
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações de petição foram salvas com sucesso",
      });

      // Reset the success state after 2 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
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
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving}
                className={`
                  transition-all duration-300 min-w-[180px]
                  ${justSaved 
                    ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                    : 'bg-primary hover:bg-primary/90'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : justSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvo com Sucesso!
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsProvider>
  );
};

export default PetitionSettings;

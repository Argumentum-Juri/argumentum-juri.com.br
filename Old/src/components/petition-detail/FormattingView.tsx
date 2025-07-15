
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { petitionSettings } from '@/services/petition/petitionSettings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FormattingViewProps {
  petitionId: string;
  userId: string;
  settings: any;
  isLoading: boolean;
}

const FormattingView: React.FC<FormattingViewProps> = ({ petitionId, userId, settings, isLoading }) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [downloading, setDownloading] = useState<string | null>(null);

  const fontFamilyOptions = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Calibri', value: 'Calibri' },
    { label: 'Cambria', value: 'Cambria' }
  ];
  
  const fontSizeOptions = [
    { label: '10pt', value: '10pt' },
    { label: '11pt', value: '11pt' }, 
    { label: '12pt', value: '12pt' },
    { label: '13pt', value: '13pt' },
    { label: '14pt', value: '14pt' }
  ];
  
  const lineSpacingOptions = [
    { label: 'Simples (1.0)', value: '1.0' },
    { label: 'Meio (1.5)', value: '1.5' },
    { label: 'Duplo (2.0)', value: '2.0' },
    { label: 'Triplo (3.0)', value: '3.0' }
  ];
  
  const marginOptions = [
    { label: 'Normal (3cm, 2cm, 2cm, 3cm)', value: '3cm 2cm 2cm 3cm' },
    { label: 'Estreita (2.5cm, 1.5cm, 1.5cm, 2.5cm)', value: '2.5cm 1.5cm 1.5cm 2.5cm' },
    { label: 'Moderada (2.54cm)', value: '2.54cm' },
    { label: 'Larga (3cm)', value: '3cm' }
  ];

  // Funções auxiliares para obter labels
  const getFontFamilyLabel = (value: string) => {
    const option = fontFamilyOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };
  
  const getFontSizeLabel = (value: string) => {
    const option = fontSizeOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };
  
  const getLineSpacingLabel = (value: string) => {
    const option = lineSpacingOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };
  
  const getMarginLabel = (value: string) => {
    const option = marginOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Função para obter o nome do arquivo
  const getFileName = (type: string): string => {
    if (type === 'letterhead') {
      // Usar o nome original do arquivo, se disponível
      if (settings.letterhead_template_original_filename) {
        return settings.letterhead_template_original_filename;
      }
      
      // Caso contrário, extrair do r2Key
      const r2Key = settings.letterhead_r2_key;
      if (!r2Key) return 'Timbrado';
      
      const fileName = r2Key.split('/').pop() || 'Timbrado';
      return fileName;
    } else if (type === 'template') {
      // Usar o nome original do arquivo, se disponível
      if (settings.petition_template_original_filename) {
        return settings.petition_template_original_filename;
      }
      
      // Caso contrário, extrair do r2Key
      const r2Key = settings.template_r2_key;
      if (!r2Key) return 'Modelo';
      
      const fileName = r2Key.split('/').pop() || 'Modelo';
      return fileName;
    }
    
    return type === 'letterhead' ? 'Timbrado' : 'Modelo';
  };

  const handleDownload = async (type: string, key: string | undefined) => {
    if (!key) {
      toast.error(`${type === 'template' ? 'Modelo' : 'Timbrado'} não disponível para download`);
      return;
    }
    
    setDownloading(type);
    
    try {
      console.log(`Chamando Edge Function 'r2-get-signed-url' para key: ${key}`);
      
      // Nome de arquivo para download
      const filename = getFileName(type);
      
      // Chama a Edge Function
      const { data, error } = await supabase.functions.invoke(
        'r2-get-signed-url',
        {
          body: {
            key: key,
            filename: filename
          }
        }
      );

      if (error) {
        console.error("Erro ao chamar função r2-get-signed-url:", error);
        throw new Error(`Erro ao chamar função: ${error.message}`);
      }

      // Verifica a resposta da função
      if (data && data.success && data.signedUrl) {
        console.log("URL Assinada recebida, iniciando download:", data.signedUrl);
        // Redireciona para a URL assinada
        window.location.href = data.signedUrl;
      } else {
        console.error("Resposta inesperada da edge function:", data);
        throw new Error(data?.error || "Falha ao obter URL de download segura do servidor.");
      }

    } catch (err) {
      console.error("Erro ao tentar baixar o arquivo:", err);
      toast.error(`Erro ao baixar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Configurações de formatação não encontradas para este usuário.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Formatação</CardTitle>
        <CardDescription>
          As configurações definidas pelo usuário para formatação dos documentos
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="preview">Fonte & Formatação</TabsTrigger>
            <TabsTrigger value="templates">Timbrado & Modelos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="font-family">Fonte</Label>
                  <div className="mt-1 p-2 border rounded-md bg-muted/20">
                    {getFontFamilyLabel(settings.font || settings.font_family || 'Arial')}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="font-size">Tamanho da Fonte</Label>
                  <div className="mt-1 p-2 border rounded-md bg-muted/20">
                    {getFontSizeLabel(settings.font_size || '12pt')}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="line-spacing">Espaçamento entre Linhas</Label>
                  <div className="mt-1 p-2 border rounded-md bg-muted/20">
                    {getLineSpacingLabel(settings.line_spacing || '1.5')}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="margins">Margens</Label>
                  <div className="mt-1 p-2 border rounded-md bg-muted/20">
                    {getMarginLabel(settings.margin || '3cm 2cm 2cm 3cm')}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Visualização</h3>
              <div className="border p-4 rounded-md">
                <div 
                  style={{
                    fontFamily: settings.font || settings.font_family || 'Arial',
                    fontSize: settings.font_size || '12pt',
                    lineHeight: settings.line_spacing || '1.5',
                    padding: '20px'
                  }}
                  className="bg-white text-black min-h-36"
                >
                  <p>Este é um texto de exemplo com as configurações aplicadas.</p>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
                  <p>Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae.</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="templates">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Timbrado</CardTitle>
                    <CardDescription>Papel timbrado personalizado</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-center h-24 bg-muted/40 rounded-md">
                      {settings.letterhead_r2_key ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-xs text-center text-muted-foreground truncate w-full px-4">
                            {getFileName('letterhead')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Nenhum timbrado definido</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleDownload('letterhead', settings.letterhead_r2_key)}
                      disabled={!settings.letterhead_r2_key || downloading === 'letterhead'}
                    >
                      {downloading === 'letterhead' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar Timbrado
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Modelo</CardTitle>
                    <CardDescription>Modelo de documento base</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-center h-24 bg-muted/40 rounded-md">
                      {settings.template_r2_key ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-xs text-center text-muted-foreground truncate w-full px-4">
                            {getFileName('template')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">Nenhum modelo definido</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownload('template', settings.template_r2_key)}
                      disabled={!settings.template_r2_key || downloading === 'template'}
                    >
                      {downloading === 'template' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Baixando...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar Modelo
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="bg-muted/20 p-4 rounded-md border border-dashed">
                <h4 className="font-medium mb-1 text-sm">Nota sobre modelos e timbrados</h4>
                <p className="text-sm text-muted-foreground">
                  Estes arquivos são usados como base para a geração de documentos. O usuário pode definir seu próprio modelo e timbrado padrão que serão aplicados a todas as petições.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FormattingView;

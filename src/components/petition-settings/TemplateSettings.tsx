
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, Trash2, Loader2 } from 'lucide-react';
import { PetitionSettings as PetitionSettingsType } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

interface TemplateSettingsProps {
  settings: Partial<PetitionSettingsType>;
  onChange: (settingsUpdate: Partial<PetitionSettingsType>) => void;
}

const TemplateSettings: React.FC<TemplateSettingsProps> = ({ settings: propsSettings, onChange }) => {
  const { settings: contextSettings, updateSettings, removeTemplate, isLoading } = useSettings();
  
  // Use context settings first, fallback to props
  const settings = contextSettings || propsSettings;
  const [isUploading, setIsUploading] = useState(false);

  // Função para obter o nome do arquivo
  const getFileName = (): string => {
    // Usar o nome original do arquivo, se disponível
    if (settings.petition_template_original_filename) {
      return settings.petition_template_original_filename;
    }
    
    // Caso não tenha o nome original, extrair do r2Key
    if (!settings.petition_template_r2_key) return '';
    
    // Extrai o nome do arquivo da chave R2
    const fileName = settings.petition_template_r2_key.split('/').pop() || '';
    return fileName;
  };

  // Função de Upload via SettingsContext (Cloudflare R2)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      console.log(`[TemplateSettings] Enviando template via SettingsContext: ${file.name}`);
      
      // Usar o SettingsContext que já faz upload para R2 via goApiClient
      await updateSettings({ 
        templateFileObj: file, 
        fileType: 'template' 
      });
      
      toast.success('Modelo de petição enviado com sucesso!');
    } catch (error) {
      console.error('[TemplateSettings] Erro inesperado no upload:', error);
      toast.error("Erro inesperado ao enviar o modelo.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Limpa input
    }
  };

  // Função de Exclusão via SettingsContext
  const handleFileRemove = async () => {
    if (!settings.petition_template_url) {
      toast.error("Não há modelo para remover.");
      return;
    }

    if (confirm("Tem certeza que deseja remover o modelo de petição?")) {
      try {
        console.log(`[TemplateSettings] Removendo template via SettingsContext`);
        
        // Usar o SettingsContext que já remove via goApiClient
        await removeTemplate();
        
        toast.success('Modelo de petição removido com sucesso.');
      } catch (error) {
        console.error('[TemplateSettings] Erro inesperado ao remover modelo:', error);
        toast.error("Erro inesperado ao remover o modelo.");
      }
    }
  };

  // --- JSX ---
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Modelo de Petição</h3>
        <p className="text-muted-foreground text-sm">
          Adicione um modelo de documento (DOCX, PDF) que contenha sua estrutura ou cláusulas padrão.
        </p>
      </div>

      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Importante</AlertTitle>
        <AlertDescription>
          Este modelo pode ser usado como base ou referência durante a elaboração da sua petição pela nossa equipe.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="template-upload">Upload do Modelo</Label>
        <div className="flex items-center gap-4">
          <Input
            id="template-upload"
            type="file"
            className="flex-1"
            onChange={handleFileUpload}
            accept=".doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={isUploading || isLoading}
          />
           {isUploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>
        {/* Mostra info do arquivo atual e botão de remover */}
        {settings.petition_template_url && settings.petition_template_r2_key && (
          <div className="mt-3 border rounded-md p-3 flex justify-between items-center bg-muted/40">
            <p className="text-sm text-foreground truncate mr-2 flex items-center gap-2" title={getFileName()}>
               <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">{getFileName()}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
              onClick={handleFileRemove}
              disabled={isLoading || isUploading}
              title="Remover Modelo"
            >
              <span className="sr-only">Remover Modelo</span>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        )}
         <p className="text-xs text-muted-foreground mt-1">
            Formatos aceitos: DOCX, DOC, PDF.
         </p>
      </div>
    </div>
  );
};

export default TemplateSettings;

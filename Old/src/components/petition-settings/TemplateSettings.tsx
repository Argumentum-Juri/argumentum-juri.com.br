
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Importa ícones necessários
import { AlertCircle, FileText, Trash2, Loader2 } from 'lucide-react';
import { PetitionSettings as PetitionSettingsType } from '@/types'; // Renomeado
// Corrige o import para usar a exportação default correta
import petitionSettingsService from '@/services/petitionSettingsService';
import { toast } from 'sonner'; // Usa sonner para toasts
import { cn } from '@/lib/utils'; // Para classes condicionais

interface TemplateSettingsProps {
  settings: Partial<PetitionSettingsType>;
  onChange: (settingsUpdate: Partial<PetitionSettingsType>) => void;
}

const TemplateSettings: React.FC<TemplateSettingsProps> = ({ settings, onChange }) => {
  // Estados de loading separados para clareza
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Função de Upload ATUALIZADA
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !settings.user_id) {
        if(!settings.user_id) toast.error("ID do usuário não encontrado para upload.");
        return;
    }

    const file = e.target.files[0];
    setIsUploading(true);

    try {
      console.log(`[TemplateSettings] Chamando uploadFile para petition_template`);
      // Chama o serviço atualizado, passando o tipo específico
      const result = await petitionSettingsService.uploadFile(settings.user_id, 'petition_template', file);

      if (result && result.url && result.r2_key) {
        // Atualiza o estado pai com URL, Key, Provider e nome original
        const settingsUpdate: Partial<PetitionSettingsType> = {
          petition_template_url: result.url,
          petition_template_r2_key: result.r2_key,
          petition_template_storage_provider: 'r2',
          petition_template_original_filename: file.name
        };
        
        onChange(settingsUpdate);
        toast.success('Modelo de petição enviado com sucesso!');
      } else {
        // O serviço já deve mostrar toast de erro
        console.error(`[TemplateSettings] Falha no upload R2 para petition_template`);
      }

    } catch (error) {
      console.error('[TemplateSettings] Erro inesperado no upload:', error);
      toast.error("Erro inesperado ao enviar o modelo.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Limpa input
    }
  };

  // Função de Exclusão ATUALIZADA para limpar registros no banco
  const handleFileRemove = async () => {
    // Pega a key R2 do estado atual vindo das props
    const r2Key = settings.petition_template_r2_key;

    if (!r2Key) {
      toast.error("Não foi possível encontrar a referência do modelo para exclusão.");
      return;
    }

    if (confirm("Tem certeza que deseja remover o modelo de petição?")) {
      setIsDeleting(true);
      try {
        console.log(`[TemplateSettings] Chamando deleteFile para key: ${r2Key}`);
        // Chama o serviço que invoca a Edge Function
        const success = await petitionSettingsService.deleteFile(r2Key);

        if (success) {
          // Limpa os campos relevantes no estado pai
          const settingsUpdate: Partial<PetitionSettingsType> = {
            petition_template_url: null,
            petition_template_r2_key: null,
            petition_template_storage_provider: null,
            petition_template_original_filename: null // Limpar nome original
          };
          
          // Atualizar explicitamente o registro no banco
          if (settings.user_id) {
            await petitionSettingsService.updateSettings({
              user_id: settings.user_id,
              petition_template_url: null,
              petition_template_r2_key: null, 
              petition_template_storage_provider: null,
              petition_template_original_filename: null
            });
          }
          
          onChange(settingsUpdate);
          toast.success('Modelo de petição removido com sucesso.');
        } else {
          // O serviço deleteFile já deve ter mostrado toast de erro
          console.error(`[TemplateSettings] Falha ao excluir key ${r2Key}`);
        }
      } catch (error) {
        console.error('[TemplateSettings] Erro inesperado ao remover modelo:', error);
        toast.error("Erro inesperado ao remover o modelo.");
      } finally {
        setIsDeleting(false);
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
            disabled={isUploading || isDeleting}
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
              disabled={isDeleting || isUploading}
              title="Remover Modelo"
            >
              <span className="sr-only">Remover Modelo</span>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

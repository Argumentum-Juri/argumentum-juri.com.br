
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PetitionSettings as PetitionSettingsType } from '@/types';
import { petitionSettings } from '@/services/petitionSettingsService';
import { toast } from 'sonner';
import { Trash2, Loader2, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos específicos para os campos de arquivo nas configurações
type SettingsFileType = 'logo' | 'letterhead_template';

interface LogoSettingsProps {
  settings: Partial<PetitionSettingsType>; // Recebe as configurações parciais
  onChange: (settingsUpdate: Partial<PetitionSettingsType>) => void; // Função para atualizar estado pai
}

const LogoSettings: React.FC<LogoSettingsProps> = ({ settings, onChange }) => {
  // Estados de loading/deleting por tipo de arquivo
  const [uploading, setUploading] = useState<Record<SettingsFileType, boolean>>({
    logo: false,
    letterhead_template: false,
  });

  const [deleting, setDeleting] = useState<Record<SettingsFileType, boolean>>({
    logo: false,
    letterhead_template: false,
  });

  // Função para obter o nome do arquivo
  const getFileName = (fileType: SettingsFileType): string => {
    // Usar o nome original do arquivo, se disponível
    if (fileType === 'logo' && settings.logo_original_filename) {
      return settings.logo_original_filename;
    } else if (fileType === 'letterhead_template' && settings.letterhead_template_original_filename) {
      return settings.letterhead_template_original_filename;
    }
    
    // Caso não tenha o nome original, extrair do r2Key
    const r2Key = fileType === 'logo' ? settings.logo_r2_key : settings.letterhead_template_r2_key;
    if (!r2Key) return '';
    
    // Extrai o nome do arquivo da chave R2
    const fileName = r2Key.split('/').pop() || '';
    return fileName;
  };

  const handleUseLetterheadChange = (checked: boolean) => {
    onChange({ use_letterhead: checked });
  };

  // Função de Upload ATUALIZADA
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: SettingsFileType
  ) => {
    if (!e.target.files || e.target.files.length === 0 || !settings.user_id) {
        if(!settings.user_id) toast.error("ID do usuário não encontrado para upload.");
        return;
    }

    const file = e.target.files[0];
    setUploading(prev => ({ ...prev, [fileType]: true }));

    try {
      console.log(`[LogoSettings] Chamando uploadFile para tipo: ${fileType}`);
      // Chama o serviço atualizado
      const result = await petitionSettings.uploadFile(settings.user_id, fileType, file);

      if (result && result.url && result.key) {
        // Atualiza o estado pai com URL, Key, Provider e nome original
        const settingsUpdate: Partial<PetitionSettingsType> = {};
        
        // Usando type assertion para garantir que TypeScript entenda que estas propriedades são válidas
        if (fileType === 'logo') {
          settingsUpdate.logo_url = result.url;
          settingsUpdate.logo_r2_key = result.key;
          settingsUpdate.logo_storage_provider = 'r2';
          settingsUpdate.logo_original_filename = result.originalFilename;
        } else if (fileType === 'letterhead_template') {
          settingsUpdate.letterhead_template_url = result.url;
          settingsUpdate.letterhead_template_r2_key = result.key;
          settingsUpdate.letterhead_template_storage_provider = 'r2';
          settingsUpdate.letterhead_template_original_filename = result.originalFilename;
        }

        onChange(settingsUpdate);
        toast.success(`Arquivo ${fileType === 'logo' ? 'do logo' : 'de modelo'} enviado com sucesso!`);
      } else {
         // O serviço já deve mostrar um toast de erro internamente
         console.error(`[LogoSettings] Falha no upload R2 para ${fileType}`);
         // Pode adicionar um toast genérico se o serviço não o fizer
      }

    } catch (error) {
      // Erros inesperados (o serviço deve tratar a maioria)
      console.error(`[LogoSettings] Erro inesperado no upload ${fileType}:`, error);
      toast.error(`Erro inesperado ao enviar o arquivo ${fileType}.`);
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
       // Limpa o valor do input de arquivo para permitir re-upload do mesmo arquivo
       e.target.value = '';
    }
  };

  // Função de Exclusão ATUALIZADA
  const handleFileRemove = async (fileType: SettingsFileType) => {
      // Pega a key R2 correspondente do estado atual
      let r2Key: string | null | undefined;
      
      if (fileType === 'logo') {
        r2Key = settings.logo_r2_key;
      } else if (fileType === 'letterhead_template') {
        r2Key = settings.letterhead_template_r2_key;
      }

      if (!r2Key) {
          toast.error("Não foi possível encontrar a referência do arquivo para exclusão.");
          console.warn(`Tentativa de excluir ${fileType} sem r2_key.`);
          return;
      }

      if (confirm(`Tem certeza que deseja remover o ${fileType === 'logo' ? 'logo' : 'modelo de papel timbrado'}?`)) {
          setDeleting(prev => ({ ...prev, [fileType]: true }));
          try {
              console.log(`[LogoSettings] Chamando deleteFile para key: ${r2Key}`);
              // Chama o serviço de exclusão que usa a Edge Function
              const success = await petitionSettings.deleteFile(r2Key);

              if (success) {
                  // Se a exclusão no R2 funcionou, limpa os campos no estado pai
                  const settingsUpdate: Partial<PetitionSettingsType> = {};
                  
                  if (fileType === 'logo') {
                    settingsUpdate.logo_url = null;
                    settingsUpdate.logo_r2_key = null;
                    settingsUpdate.logo_storage_provider = null;
                    settingsUpdate.logo_original_filename = null; // Limpar nome original
                  } else if (fileType === 'letterhead_template') {
                    settingsUpdate.letterhead_template_url = null;
                    settingsUpdate.letterhead_template_r2_key = null;
                    settingsUpdate.letterhead_template_storage_provider = null;
                    settingsUpdate.letterhead_template_original_filename = null; // Limpar nome original
                  }

                  onChange(settingsUpdate); // Atualiza estado pai
                  toast.success(`Arquivo ${fileType === 'logo' ? 'do logo' : 'de modelo'} removido.`);
              } else {
                   // O serviço deleteFile já deve ter mostrado um toast de erro
                   console.error(`[LogoSettings] Falha ao excluir ${fileType} com key ${r2Key}`);
              }
          } catch (error) {
              console.error(`[LogoSettings] Erro inesperado ao remover ${fileType}:`, error);
              toast.error("Erro inesperado ao remover o arquivo.");
          } finally {
              setDeleting(prev => ({ ...prev, [fileType]: false }));
          }
      }
  };

  // --- JSX ---
  return (
    <div className="space-y-6">
      {/* Switch Usar Papel Timbrado (mantido) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="use-letterhead" className="cursor-pointer">Usar papel timbrado</Label>
          <Switch
            id="use-letterhead"
            checked={!!settings.use_letterhead} // Usa !! para garantir boolean
            onCheckedChange={handleUseLetterheadChange}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Quando ativado, suas petições incluirão seu papel timbrado personalizado (logo e/ou modelo).
        </p>
      </div>

      {/* Seção visível apenas se 'use_letterhead' estiver ativo */}
      {settings.use_letterhead && (
        <>
          {/* Upload/Preview Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo-upload">Logo (imagem)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="logo-upload"
                type="file"
                className="flex-1"
                onChange={(e) => handleFileUpload(e, 'logo')}
                accept="image/png, image/jpeg, image/webp, image/svg+xml" // Aceita formatos comuns
                disabled={uploading.logo || deleting.logo}
              />
              {uploading.logo && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
            {/* Preview e botão de remover */}
            {settings.logo_url && (
              <div className="mt-3 border rounded-md p-3 bg-muted/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    {getFileName('logo')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleFileRemove('logo')}
                    disabled={deleting.logo || uploading.logo}
                    title="Remover Logo"
                  >
                    <span className="sr-only">Remover Logo</span>
                    {deleting.logo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex justify-center items-center bg-white p-2 rounded border"> 
                    <img
                        src={settings.logo_url}
                        alt="Logo atual"
                        className="max-h-20 object-contain"
                        onError={(e) => {
                          // Fallback em caso de erro ao carregar a imagem
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBhdGggZD0ibTIxIDE1LTMuODYtMy44NmEyIDIgMCAwIDAtMi44MiAwTDUgMjAiLz48L3N2Zz4=';
                          console.error('Failed to load image:', settings.logo_url);
                        }}
                    />
                </div>
              </div>
            )}
          </div>

          {/* Upload/Preview Papel Timbrado (Modelo DOCX/PDF) */}
          <div className="space-y-2">
            <Label htmlFor="letterhead-upload">Modelo de Papel Timbrado (DOCX, PDF)</Label>
            <div className="flex items-center gap-4">
                <Input
                    id="letterhead-upload"
                    type="file"
                    className="flex-1"
                    onChange={(e) => handleFileUpload(e, 'letterhead_template')}
                    accept=".doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={uploading.letterhead_template || deleting.letterhead_template}
                />
                 {uploading.letterhead_template && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
            {/* Info do arquivo atual e botão de remover */}
            {settings.letterhead_template_url && settings.letterhead_template_r2_key && (
              <div className="mt-3 border rounded-md p-3 flex justify-between items-center bg-muted/40">
                 <p className="text-sm text-foreground truncate mr-2 flex items-center gap-2" title={getFileName('letterhead_template')}>
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{getFileName('letterhead_template')}</span>
                 </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => handleFileRemove('letterhead_template')}
                  disabled={deleting.letterhead_template || uploading.letterhead_template}
                  title="Remover Modelo de Papel Timbrado"
                >
                  <span className="sr-only">Remover Modelo</span>
                  {deleting.letterhead_template ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
             <p className="text-xs text-muted-foreground mt-1">
                Faça upload de um arquivo DOCX ou PDF que será usado como base para o timbrado.
             </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LogoSettings;

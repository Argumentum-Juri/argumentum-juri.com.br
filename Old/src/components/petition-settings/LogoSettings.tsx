
import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, File as FileIcon, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useSettings } from '@/contexts/SettingsContext';
import { Separator } from "@/components/ui/separator";

const LogoSettings = () => {
  const { toast } = useToast();
  const { settings, updateSettings, isLoading, removeLogo, removeLetterhead } = useSettings();
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isLetterheadUploading, setIsLetterheadUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | undefined>(undefined);
  const [letterheadUploadError, setLetterheadUploadError] = useState<string | undefined>(undefined);

  const handleLogoSelected = async (file: File) => {
    setIsLogoUploading(true);
    setLogoUploadError(undefined);

    try {
      await updateSettings({ fileObj: file, fileType: 'logo' });
      toast({
        title: "Logo atualizado!",
        description: "O logo da sua petição foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      setLogoUploadError(error.message || 'Ocorreu um erro ao enviar o logo.');
      toast({
        variant: "destructive",
        title: "Erro ao atualizar o logo!",
        description: error.message || "Ocorreu um erro ao atualizar o logo da sua petição.",
      });
    } finally {
      setIsLogoUploading(false);
    }
  };

  const handleLetterheadSelected = async (file: File) => {
    setIsLetterheadUploading(true);
    setLetterheadUploadError(undefined);

    try {
      await updateSettings({ letterheadFileObj: file, fileType: 'letterhead' });
      toast({
        title: "Timbrado atualizado!",
        description: "O papel timbrado da sua petição foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error uploading letterhead:", error);
      setLetterheadUploadError(error.message || 'Ocorreu um erro ao enviar o timbrado.');
      toast({
        variant: "destructive",
        title: "Erro ao atualizar o timbrado!",
        description: error.message || "Ocorreu um erro ao atualizar o timbrado da sua petição.",
      });
    } finally {
      setIsLetterheadUploading(false);
    }
  };

  const handleLogoError = (error: string) => {
    setLogoUploadError(error);
    toast({
      variant: "destructive",
      title: "Erro ao fazer upload do logo!",
      description: error,
    });
  };

  const handleLetterheadError = (error: string) => {
    setLetterheadUploadError(error);
    toast({
      variant: "destructive",
      title: "Erro ao fazer upload do timbrado!",
      description: error,
    });
  };

  const handleRemoveLogo = async () => {
    try {
      await removeLogo();
      toast({
        title: "Logo removido!",
        description: "O logo da sua petição foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast({
        variant: "destructive",
        title: "Erro ao remover o logo!",
        description: error.message || "Ocorreu um erro ao remover o logo da sua petição.",
      });
    }
  };

  const handleRemoveLetterhead = async () => {
    try {
      await removeLetterhead();
      toast({
        title: "Timbrado removido!",
        description: "O papel timbrado da sua petição foi removido com sucesso.",
      });
    } catch (error: any) {
      console.error("Error removing letterhead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao remover o timbrado!",
        description: error.message || "Ocorreu um erro ao remover o timbrado da sua petição.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo section */}
      <div>
        <h3 className="text-lg font-medium">Logo da Petição</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Faça o upload do seu logotipo para ser exibido em seus documentos.
        </p>

        <div className="border rounded-md p-4 space-y-4">
          <FileUpload
            onFileSelected={handleLogoSelected}
            onError={handleLogoError}
            accept={{
              'image/*': ['.png', '.jpeg', '.jpg', '.gif']
            }}
            maxSize={5 * 1024 * 1024} // 5 MB
          >
            <div className="flex items-center justify-center w-full">
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 border-muted-foreground/25"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou GIF (máx. 5MB)
                  </p>
                </div>
              </label>
            </div>
          </FileUpload>

          {isLogoUploading && (
            <div className="flex items-center justify-center">
              <Spinner className="w-4 h-4 mr-2" /> Enviando...
            </div>
          )}
          
          {logoUploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{logoUploadError}</AlertDescription>
            </Alert>
          )}
          
          {settings?.logo_original_filename && !isLogoUploading && (
            <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">
                  {settings.logo_original_filename}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isLoading || isLogoUploading}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Letterhead section */}
      <div>
        <h3 className="text-lg font-medium">Papel Timbrado</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Faça o upload do seu modelo de papel timbrado para ser usado em todos os seus documentos.
        </p>

        <div className="border rounded-md p-4 space-y-4">
          <FileUpload
            onFileSelected={handleLetterheadSelected}
            onError={handleLetterheadError}
            accept={{
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }}
            maxSize={10 * 1024 * 1024} // 10 MB
          >
            <div className="flex items-center justify-center w-full">
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/70 border-muted-foreground/25"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC ou DOCX (máx. 10MB)
                  </p>
                </div>
              </label>
            </div>
          </FileUpload>

          {isLetterheadUploading && (
            <div className="flex items-center justify-center">
              <Spinner className="w-4 h-4 mr-2" /> Enviando...
            </div>
          )}
          
          {letterheadUploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{letterheadUploadError}</AlertDescription>
            </Alert>
          )}
          
          {settings?.letterhead_template_original_filename && !isLetterheadUploading && (
            <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm truncate max-w-[200px]">
                  {settings.letterhead_template_original_filename}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLetterhead}
                disabled={isLoading || isLetterheadUploading}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoSettings;

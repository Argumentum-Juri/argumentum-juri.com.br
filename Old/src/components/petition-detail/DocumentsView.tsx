import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, File as FileIcon, Trash, Upload, Loader2 } from "lucide-react"; 
import { PetitionDocument } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import DocumentUpload from '@/components/DocumentUpload';
import { handlePetitionGeneration } from '@/utils/webhookService';
import { formatFileSize } from '@/utils/formatFileSize';
import { formatDate } from '@/utils/formatDate';

interface DocumentsViewProps {
  petitionId: string;
  documents?: PetitionDocument[]; 
  isLoading?: boolean;
  isAdmin?: boolean;
  onDocumentChange?: () => void;
  disableGenerateButton?: boolean;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  petitionId,
  documents = [],
  isLoading = false,
  isAdmin = false,
  onDocumentChange,
  disableGenerateButton
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Função para chamar a Edge Function de exclusão R2
  const deleteFileFromR2 = async (r2Key: string): Promise<boolean> => {
      if (!r2Key) return false;
      try {
          console.log(`Chamando Edge Function r2-delete para key ${r2Key}`);
          // Chama a função r2-delete
          const { data, error } = await supabase.functions.invoke('r2-delete', {
              body: { key: r2Key }
          });
          
          if (error) {
              console.error("Erro na chamada da Edge Function:", error);
              throw error;
          }
          
          if (!data?.success) {
              console.error("Resposta de erro da edge function:", data);
              throw new Error(data?.error || "Falha ao excluir do R2");
          }
          
          console.log("Exclusão R2 bem-sucedida:", data);
          return true;
      } catch (err) {
          console.error(`Erro ao chamar edge function r2-delete para key ${r2Key}:`, err);
          toast.error(`Erro ao excluir arquivo do armazenamento: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          return false;
      }
  }

  const handleDeleteDocument = async (document: PetitionDocument) => {
    const documentId = document.id;
    const documentName = document.file_name || 'este documento';
    const r2Key = document.r2_key || document.storage_path; // Pega a key R2

    if (!r2Key) {
        toast.error("Não foi possível identificar o arquivo no armazenamento para exclusão.");
        return;
    }

    if (confirm(`Tem certeza que deseja excluir o documento "${documentName}"?`)) {
      setDeletingId(documentId); // Ativa feedback de exclusão
      try {
        // 1. Tenta deletar do R2 via Edge Function
        const r2DeleteSuccess = await deleteFileFromR2(r2Key);

        if (!r2DeleteSuccess) {
             // O toast de erro já foi mostrado dentro de deleteFileFromR2
             return; // Interrompe se a exclusão no R2 falhar
        }

        // 2. Se deletou do R2 (ou se não tinha r2Key), deleta do DB
        const { error: dbError } = await supabase
            .from('petition_documents')
            .delete()
            .eq('id', documentId);

        if (dbError) {
            console.error("Erro ao excluir registro do DB:", dbError);
            toast.error("Arquivo excluído do armazenamento, mas falha ao remover registro do banco de dados.");
        } else {
            toast.success("Documento excluído com sucesso");
            onDocumentChange?.(); // Atualiza a lista na UI
        }

      } catch (error) { // Captura erros inesperados
        console.error("Erro inesperado ao excluir documento:", error);
        toast.error("Erro inesperado ao excluir documento.");
      } finally {
        setDeletingId(null); // Desativa feedback de exclusão
      }
    }
  };

  // Função para Gerar Documento
  const handleGenerateDocument = async () => {
      setIsGenerating(true);
      try {
        const result = await handlePetitionGeneration(petitionId);
        if (result.success) {
          toast.success("Documento enviado para geração com sucesso!");
          onDocumentChange?.();
        } else {
          toast.error(`Erro ao gerar documento: ${result.error}`);
        }
      } catch (error) {
        console.error("Error generating document:", error);
        toast.error(`Erro ao gerar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setIsGenerating(false);
      }
  };

  // Callbacks de Upload
  const handleUploadSuccess = async () => {
    setShowUpload(false);
    toast.info("Atualizando lista de documentos..."); // Feedback mais imediato
    onDocumentChange?.();
  };
  
  // Corrigida a função onError para retornar uma string conforme esperado pelo componente DocumentUpload
  const handleUploadError = (error: any): string => {
     console.error("Erro no upload recebido pelo DocumentsView:", error);
     const errorMessage = error.message || 'Falha ao enviar';
     toast.error(`Erro no upload: ${errorMessage}`);
     return errorMessage; // Agora retorna uma string como exigido pela tipagem
  };

  // Função para lidar com o download via URL assinada
  const handleDownload = async (document: PetitionDocument) => {
      // Usa r2_key (novo) ou storage_path (antigo) para compatibilidade
      const r2Key = document.r2_key || document.storage_path;
      const originalFilename = document.file_name || 'download';

      if (!r2Key) {
          toast.error("Referência do arquivo não encontrada para gerar link de download.");
          return;
      }

      setDownloadingId(document.id); // Ativa o estado de carregamento para este botão

      try {
          console.log(`Chamando Edge Function 'r2-get-signed-url' para key: ${r2Key}`);
          
          // Chama a Edge Function
          const { data, error } = await supabase.functions.invoke(
              'r2-get-signed-url',
              {
                  body: {
                      key: r2Key,
                      filename: originalFilename
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
          console.error("Erro ao tentar baixar o documento:", err);
          toast.error(`Erro ao baixar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      } finally {
          setDownloadingId(null); // Desativa o estado de carregamento
      }
  };

  // --- JSX ---
  if (isLoading) {
      return (
        <div className="py-4 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Cabeçalho com botões Importar/Gerar */}
       <div className="flex justify-between items-center flex-wrap gap-2">
           <h3 className="text-lg font-medium">Documentos</h3>
           {isAdmin && (
               <div className="flex space-x-2 flex-shrink-0">
                   <Button variant="outline" size="sm" onClick={() => setShowUpload(!showUpload)} className="flex items-center">
                       <Upload className="h-4 w-4 mr-1" /> {showUpload ? "Fechar Upload" : "Importar Documento"}
                   </Button>
                   <Button variant="outline" size="sm" onClick={handleGenerateDocument} disabled={isGenerating || disableGenerateButton} className="flex items-center">
                       <FileIcon className="h-4 w-4 mr-1" /> {isGenerating ? "Gerando..." : "Gerar Documento"}
                   </Button>
               </div>
           )}
       </div>

      {/* Seção de Upload */}
       {showUpload && isAdmin && (
           <div className="mb-4 p-4 border rounded-md bg-secondary/30">
               <h4 className="text-sm font-medium mb-2">Enviar Novo Documento</h4>
               <DocumentUpload petitionId={petitionId} onSuccess={handleUploadSuccess} onError={handleUploadError} />
           </div>
       )}

      {/* Lista de Documentos */}
      {!documents || documents.length === 0 ? (
          <div className="py-6 text-center border rounded-md bg-secondary/5">
              <FileIcon className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
              <h3 className="mt-2 text-base font-medium text-foreground">Nenhum documento adicionado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                  {isAdmin ? "Importe ou gere documentos para esta petição." : "Aguarde até que os documentos sejam adicionados."}
              </p>
          </div>
      ) : (
        <div className="space-y-2">
          {documents.map(document => {
              const r2Key = document.r2_key || document.storage_path; // Determina a key
              const canDownload = !!r2Key; // Só pode baixar se tiver a key

              return (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 bg-background border rounded-lg shadow-sm"
                >
                  {/* Infos do Documento */}
                  <div className="flex items-center space-x-3 overflow-hidden mr-2">
                    <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate" title={document.file_name}>{document.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                         {formatFileSize(document.file_size || 0)} • {formatDate(document.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex space-x-1 flex-shrink-0">
                     {/* Botão de Download */}
                     <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(document)}
                        disabled={!canDownload || downloadingId === document.id}
                        title={canDownload ? `Baixar ${document.file_name}` : "Download indisponível"}
                    >
                         <span className="sr-only">Baixar</span>
                         {downloadingId === document.id ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                            <Download className={`h-4 w-4 ${!canDownload ? 'text-muted-foreground' : ''}`} />
                         )}
                    </Button>

                    {/* Botão de Excluir */}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => handleDeleteDocument(document)}
                        disabled={deletingId === document.id}
                        title="Excluir Documento"
                      >
                         <span className="sr-only">Excluir</span>
                         {deletingId === document.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                            <Trash className="h-4 w-4" />
                         )}
                      </Button>
                    )}
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsView;

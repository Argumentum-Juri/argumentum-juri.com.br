
import React, { useState } from 'react';
import { Petition, PetitionAttachment } from '@/types';
import { Button } from "@/components/ui/button";
import { Paperclip, Download, Trash, Loader2, File as FileIcon } from 'lucide-react';
import { formatFileSize } from '@/utils/formatFileSize';
import { formatDate } from '@/utils/formatDate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AttachmentsViewProps {
  petition: Petition;
  isAdmin?: boolean;
  onAttachmentChange?: () => void | Promise<void>;
}

const AttachmentsView: React.FC<AttachmentsViewProps> = ({ petition, isAdmin = false, onAttachmentChange }) => {
  // Usa diretamente petition.attachments, garantindo que seja um array
  const attachments = petition?.attachments || [];
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Função para chamar a Edge Function de exclusão R2 (similar à de DocumentsView)
  const deleteFileFromR2 = async (r2Key: string): Promise<boolean> => {
      if (!r2Key) return false;
      try {
          console.log(`Chamando Edge Function r2-delete para key ${r2Key}`);
          // Chama a função r2-delete (VERIFIQUE O NOME EXATO)
          const { data, error } = await supabase.functions.invoke('r2-delete', {
              body: { key: r2Key }
          });
          if (error) throw error;
          if (!data?.success) throw new Error(data?.error || "Falha ao excluir do R2");
          console.log("Exclusão R2 bem-sucedida:", data);
          return true;
      } catch (err) {
          console.error(`Erro ao chamar edge function r2-delete para key ${r2Key}:`, err);
          toast.error(`Erro ao excluir arquivo do armazenamento: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
          return false;
      }
  }

  // Função para lidar com a exclusão de anexo
  const handleDeleteAttachment = async (attachment: PetitionAttachment) => {
    const attachmentId = attachment.id;
    const attachmentName = attachment.file_name || 'este anexo';
    // Assume que r2_key ou storage_path guarda a chave R2
    const r2Key = attachment.r2_key || attachment.storage_path;

    if (!r2Key) {
        toast.error("Não foi possível identificar o arquivo no armazenamento para exclusão.");
        return;
    }

    if (confirm(`Tem certeza que deseja excluir o anexo "${attachmentName}"?`)) {
      setDeletingId(attachmentId); // Ativa feedback
      try {
        // 1. Tenta deletar do R2
        const r2DeleteSuccess = await deleteFileFromR2(r2Key);
        if (!r2DeleteSuccess) return; // Erro já notificado

        // 2. Deleta do DB
        const { error: dbError } = await supabase
            .from('petition_attachments') // <<< Tabela correta
            .delete()
            .eq('id', attachmentId);

        if (dbError) {
            console.error("Erro ao excluir registro do DB:", dbError);
            toast.error("Anexo excluído do armazenamento, mas falha ao remover registro.");
        } else {
            toast.success("Anexo excluído com sucesso");
            if (onAttachmentChange) onAttachmentChange(); // Chama o callback para atualizar a UI
        }

      } catch (error) {
        console.error("Erro inesperado ao excluir anexo:", error);
        toast.error("Erro inesperado ao excluir anexo.");
      } finally {
        setDeletingId(null); // Desativa feedback
      }
    }
  };

  // Função para lidar com o download via URL assinada (igual à de DocumentsView)
  const handleDownload = async (attachment: PetitionAttachment) => {
      const r2Key = attachment.r2_key || attachment.storage_path; // Pega a key R2
      const originalFilename = attachment.file_name || 'download';

      if (!r2Key) {
          toast.error("Referência do anexo não encontrada para gerar link de download.");
          return;
      }

      setDownloadingId(attachment.id);

      try {
          console.log(`Chamando Edge Function 'r2-get-signed-url' para key: ${r2Key}`);
          const { data, error } = await supabase.functions.invoke(
              'r2-get-signed-url', // <<< NOME EXATO DA SUA FUNÇÃO
              { body: { key: r2Key, filename: originalFilename } }
          );

          if (error) throw new Error(`Erro ao chamar função: ${error.message}`);

          if (data && data.success && data.signedUrl) {
              console.log("URL Assinada recebida, iniciando download:", data.signedUrl);
              window.location.href = data.signedUrl;
          } else {
              throw new Error(data?.error || "Falha ao obter URL de download segura.");
          }

      } catch (err) {
          console.error("Erro ao tentar baixar o anexo:", err);
          toast.error(`Erro ao baixar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      } finally {
          setDownloadingId(null);
      }
  };


  // --- JSX ---

  // O estado isLoading não é passado, então consideramos sempre carregado
  // A lógica de loading/skeleton pode ser adicionada se AttachmentsView for carregado separadamente

  return (
    <div className="space-y-4 mb-6"> {/* Mantém margem inferior */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-medium">Anexos</h3>
        {/* Pode adicionar botão de upload de anexos aqui se necessário */}
      </div>

      {attachments.length === 0 ? (
        <div className="py-6 text-center border rounded-md bg-secondary/5">
          <Paperclip className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
          <h3 className="mt-2 text-base font-medium text-foreground">Nenhum anexo adicionado</h3>
          <p className="mt-1 text-sm text-muted-foreground">
             {/* Ajuste a mensagem se necessário */}
            Esta petição não possui anexos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map(attachment => {
              const r2Key = attachment.r2_key || attachment.storage_path;
              const canDownload = !!r2Key; // Habilita download se tiver key R2

              return (
                <div
                  key={attachment.id}
                  // <<< Aplica estilo do DocumentsView >>>
                  className="flex items-center justify-between p-3 bg-background border rounded-lg shadow-sm"
                >
                  {/* Infos do Anexo */}
                  <div className="flex items-center space-x-3 overflow-hidden mr-2">
                     {/* <<< Usa FileIcon >>> */}
                    <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm truncate" title={attachment.file_name}>
                        {attachment.file_name}
                      </p>
                      {/* <<< Exibe tamanho e data formatados >>> */}
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size || 0)} • {formatDate(attachment.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex space-x-1 flex-shrink-0">
                     {/* <<< Botão de Download igual ao DocumentsView >>> */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownload(attachment)} // Chama handleDownload
                      disabled={!canDownload || downloadingId === attachment.id}
                      title={canDownload ? `Baixar ${attachment.file_name}` : "Download indisponível"}
                    >
                      <span className="sr-only">Baixar</span>
                      {downloadingId === attachment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                          <Download className={`h-4 w-4 ${!canDownload ? 'text-muted-foreground' : ''}`} />
                      )}
                    </Button>

                     {/* <<< Botão de Excluir igual ao DocumentsView, MAS com lógica !isAdmin >>> */}
                    {!isAdmin && ( // <<< Condição para NÃO ADMIN deletar, conforme solicitado
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        onClick={() => handleDeleteAttachment(attachment)}
                        disabled={deletingId === attachment.id}
                        title="Excluir Anexo"
                      >
                        <span className="sr-only">Excluir</span>
                        {deletingId === attachment.id ? (
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

export default AttachmentsView;

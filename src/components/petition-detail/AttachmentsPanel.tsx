
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Petition, PetitionAttachment } from '@/types';
import { formatDate } from '@/utils/formatDate';
import { formatFileSize } from '@/utils/formatFileSize';
import { File, Download, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { petitionService } from '@/services/petitionService';
import { toast } from 'sonner';

interface AttachmentsPanelProps {
  petition: Petition;
  onFileDeleted?: () => void;
  canDelete?: boolean;
}

const AttachmentsPanel: React.FC<AttachmentsPanelProps> = ({ 
  petition, 
  onFileDeleted,
  canDelete = false 
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<PetitionAttachment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!petition.attachments || petition.attachments.length === 0) {
    return (
      <Card className="rounded-md border">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Nenhum anexo encontrado</p>
        </CardContent>
      </Card>
    );
  }
  
  // Sort attachments by creation date (newest first)
  const sortedAttachments = [...petition.attachments].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
  
  const handleDelete = async () => {
    if (!attachmentToDelete) return;
    
    setIsDeleting(true);
    try {
      await petitionService.deleteAttachment(attachmentToDelete.id);
      toast.success('Anexo excluído com sucesso');
      setDeleteDialogOpen(false);
      if (onFileDeleted) {
        onFileDeleted();
      }
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
      toast.error('Erro ao excluir o anexo');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const confirmDelete = (attachment: PetitionAttachment) => {
    setAttachmentToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {sortedAttachments.map((attachment) => (
        <Card key={attachment.id} className="overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 bg-muted h-10 w-10 rounded flex items-center justify-center">
                <File className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium line-clamp-1">{attachment.file_name}</p>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {attachment.created_at && formatDate(attachment.created_at)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(attachment.file_url, '_blank')}
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Excluir arquivo"
                  onClick={() => confirmDelete(attachment)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o anexo "{attachmentToDelete?.file_name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { 
                e.preventDefault(); 
                handleDelete(); 
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttachmentsPanel;

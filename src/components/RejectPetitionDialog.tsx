
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { petitionService } from "@/services";
import { PetitionStatus } from '@/types/enums';

interface RejectPetitionDialogProps {
  petitionId: string;
}

const RejectPetitionDialog: React.FC<RejectPetitionDialogProps> = ({ petitionId }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Por favor, forneça um motivo para a rejeição.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the enum value instead of a string literal
      await petitionService.updatePetitionStatus(petitionId, PetitionStatus.REJECTED);
      await petitionService.addComment(petitionId, reason);
      
      toast.success("Petição rejeitada com sucesso");
      setOpen(false);
      setReason("");
      
      // Recarregar a página para mostrar as alterações
      window.location.reload();
    } catch (error) {
      console.error("Erro ao rejeitar petição:", error);
      toast.error("Falha ao rejeitar a petição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="ml-auto">
          <X className="mr-2 h-4 w-4" />
          Rejeitar Petição
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar Petição</DialogTitle>
          <DialogDescription>
            Por favor, forneça o motivo da rejeição. Essa informação será enviada ao usuário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Textarea
            placeholder="Digite aqui o motivo da rejeição..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? "Processando..." : "Rejeitar Petição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectPetitionDialog;

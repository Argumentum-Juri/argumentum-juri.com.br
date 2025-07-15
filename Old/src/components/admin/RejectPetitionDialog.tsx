
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface RejectPetitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

const RejectPetitionDialog: React.FC<RejectPetitionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Por favor, forneça um motivo para a rejeição.");
      return;
    }
    
    try {
      // Formatar a mensagem para torná-la mais clara
      const formattedReason = `**NOTIFICAÇÃO DE REJEIÇÃO**\n\nEsta petição foi rejeitada pelo seguinte motivo:\n\n${reason}\n\nCaso tenha dúvidas ou precise de esclarecimentos adicionais, responda a esta mensagem.`;
      
      await onConfirm(formattedReason);
      // Não limpamos o estado aqui, pois isso será feito apenas se a rejeição for bem-sucedida
    } catch (err) {
      console.error("Erro ao rejeitar petição:", err);
      toast.error("Falha ao processar a rejeição. Por favor tente novamente.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      // Limpar o motivo quando o diálogo for fechado
      if (!open && !isLoading) {
        setReason("");
        setError("");
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar Petição</DialogTitle>
          <DialogDescription>
            Por favor, forneça o motivo detalhado da rejeição. Essa informação será enviada ao usuário para orientá-lo sobre os próximos passos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Textarea
            placeholder="Digite aqui o motivo da rejeição..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError("");
            }}
            className={`min-h-[120px] ${error ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setReason("");
              setError("");
              onClose();
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? "Processando..." : "Rejeitar Petição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectPetitionDialog;

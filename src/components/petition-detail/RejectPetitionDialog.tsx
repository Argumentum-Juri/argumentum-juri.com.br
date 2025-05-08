
import React, { useState } from 'react';
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Por favor, informe o motivo da reprovação');
      return;
    }
    
    try {
      // Formatar a mensagem com detalhes claros
      const formattedReason = `**PETIÇÃO REJEITADA**\n\nMotivo da rejeição: ${reason}\n\nPor favor, revise as informações fornecidas e entre em contato se precisar de esclarecimentos adicionais.`;
      
      await onConfirm(formattedReason);
      setReason('');
      setError('');
      toast.success("Petição rejeitada. A mensagem foi enviada ao usuário.");
    } catch (err) {
      console.error('Erro ao reprovar petição:', err);
      toast.error("Não foi possível rejeitar a petição. Tente novamente.");
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Reprovar Petição</AlertDialogTitle>
          <AlertDialogDescription>
            Informe o motivo da reprovação da petição para que o usuário possa compreender a razão e tomar as medidas necessárias.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo da Reprovação
            </Label>
            <Textarea
              id="reason"
              placeholder="Descreva detalhadamente o motivo da reprovação..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              className={`${error ? 'border-red-500 focus:ring-red-500' : ''}`}
              rows={4}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleSubmit} 
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? 'Enviando...' : 'Reprovar Petição'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RejectPetitionDialog;

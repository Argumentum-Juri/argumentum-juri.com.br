
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, Users } from 'lucide-react';
import { TeamInvite } from '@/services/team/types';
import { respondToInvite } from '@/services/team';
import { toast } from "sonner";

interface InviteAcceptModalProps {
  invite: TeamInvite | null;
  isOpen: boolean;
  onClose: () => void;
  onAccepted: () => void;
}

const InviteAcceptModal: React.FC<InviteAcceptModalProps> = ({ invite, isOpen, onClose, onAccepted }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleResponse = async (accept: boolean) => {
    if (!invite) return;

    setIsLoading(true);
    setError(null);
    try {
      await respondToInvite(invite.id || '', accept);
      
      if (accept) {
        toast.success('Convite aceito com sucesso!');
        // Chamar explicitamente o callback de aceitação
        onAccepted();
      } else {
        toast.info('Você rejeitou o convite');
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao responder ao convite:', error);
      setError('Ocorreu um erro ao processar sua resposta. Por favor, tente novamente mais tarde.');
      toast.error('Ocorreu um erro ao processar sua resposta');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!invite) return null;

  // Exibir informações da equipe de forma mais amigável
  // Usar ID da equipe se o nome não estiver disponível, pegando apenas os primeiros 8 caracteres
  const teamId = invite.team_id || (invite.team?.id || "").substring(0, 8);
  const teamName = `Equipe ${teamId}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isLoading) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Convite para Equipe
          </DialogTitle>
          <DialogDescription>
            Você foi convidado para participar de uma equipe no EscribaAI
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 p-4 rounded-md border my-4">
          <p className="font-medium">
            Você foi convidado para participar da {teamName}
          </p>
          <p className="text-sm text-muted-foreground">
            Função: {invite.role === 'gestor' ? 'Gestor' : 'Operador'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => handleResponse(false)}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button
            onClick={() => handleResponse(true)}
            disabled={isLoading}
          >
            <Check className="h-4 w-4 mr-2" />
            Aceitar Convite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteAcceptModal;

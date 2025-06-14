
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface RejectPetitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
  petitionId?: string;
}

const REJECTION_TOKEN_COST = 3; // Custo em tokens para rejeições adicionais

const RejectPetitionDialog: React.FC<RejectPetitionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  petitionId
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [rejectionCount, setRejectionCount] = useState(0);
  const [hasEnoughTokens, setHasEnoughTokens] = useState(true);
  const [userTokens, setUserTokens] = useState(0);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  
  // Fetch the current rejection count for the petition
  useEffect(() => {
    if (!petitionId || !isOpen) return;
    
    const fetchPetitionData = async () => {
      try {
        const { data, error } = await supabase
          .from('petitions')
          .select('rejection_count')
          .eq('id', petitionId)
          .single();
          
        if (error) throw error;
        
        setRejectionCount(data?.rejection_count || 0);
      } catch (err) {
        console.error('Error fetching petition rejection count:', err);
      }
    };
    
    fetchPetitionData();
  }, [petitionId, isOpen]);
  
  // Check if user has enough tokens for additional rejections
  useEffect(() => {
    if (!isOpen || rejectionCount === 0) return;
    
    const checkUserTokens = async () => {
      setIsLoadingTokens(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id) return;
        
        const { data, error } = await supabase
          .from('user_tokens')
          .select('tokens')
          .eq('user_id', userData.user.id)
          .single();
          
        if (error) throw error;
        
        const tokens = data?.tokens || 0;
        setUserTokens(tokens);
        setHasEnoughTokens(tokens >= REJECTION_TOKEN_COST);
      } catch (err) {
        console.error('Error checking user tokens:', err);
      } finally {
        setIsLoadingTokens(false);
      }
    };
    
    checkUserTokens();
  }, [isOpen, rejectionCount]);
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Por favor, informe o motivo da reprovação');
      return;
    }
    
    // Se já houve uma rejeição e o usuário não tem tokens suficientes
    if (rejectionCount > 0 && !hasEnoughTokens) {
      toast.error(
        `Tokens insuficientes para rejeitar novamente`, 
        { description: `Você precisa de ${REJECTION_TOKEN_COST} tokens para rejeitar esta petição novamente.` }
      );
      return;
    }
    
    try {
      // Formatar a mensagem com detalhes claros
      const formattedReason = `**PETIÇÃO REJEITADA**\n\nMotivo da rejeição: ${reason}\n\nPor favor, revise as informações fornecidas e entre em contato se precisar de esclarecimentos adicionais.`;
      
      await onConfirm(formattedReason);
      setReason('');
      setError('');
      
      // Se for a primeira rejeição, mostra uma mensagem normal
      if (rejectionCount === 0) {
        toast.success("Petição rejeitada. A mensagem foi enviada ao usuário.");
      } else {
        // Se for rejeição adicional, informa sobre o custo
        toast.success(
          `Petição rejeitada novamente`, 
          { description: `Foram consumidos ${REJECTION_TOKEN_COST} tokens desta rejeição.` }
        );
      }
    } catch (err) {
      console.error('Erro ao reprovar petição:', err);
      toast.error("Não foi possível rejeitar a petição. Tente novamente.");
    }
  };
  
  // Reset the form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Reprovar Petição</AlertDialogTitle>
          <AlertDialogDescription>
            {rejectionCount === 0 ? (
              'Informe o motivo da reprovação da petição para que o usuário possa compreender a razão e tomar as medidas necessárias.'
            ) : (
              <>
                <div className="mb-2">
                  Esta petição já foi rejeitada anteriormente. 
                </div>
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 mb-2">
                  <strong>Atenção:</strong> Rejeições adicionais custam {REJECTION_TOKEN_COST} tokens.
                  {rejectionCount > 0 && (
                    <div className="mt-1 text-sm">
                      Seu saldo atual: <strong>{userTokens} tokens</strong>
                    </div>
                  )}
                </div>
              </>
            )}
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
              disabled={isLoading || !reason.trim() || (rejectionCount > 0 && !hasEnoughTokens)}
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

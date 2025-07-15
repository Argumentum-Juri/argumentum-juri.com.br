
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from 'lucide-react';

interface ProcessingNotificationProps {
  isProcessing: boolean;
  isRejected?: boolean;
  message?: string;
  rejectionMessage?: string;
}

const ProcessingNotification: React.FC<ProcessingNotificationProps> = ({ 
  isProcessing, 
  isRejected = false,
  message = "Sua solicitação está sendo avaliada pela equipe e em breve a documentação solicitada será gerada.",
  rejectionMessage = "Sua petição foi rejeitada e está sendo revisada pela nossa equipe. Uma nova versão será disponibilizada em breve."
}) => {
  // Se ambos os estados forem falsos, não mostra nada
  if (!isProcessing && !isRejected) return null;
  
  // Prioriza a notificação de rejeição se ambos os estados forem verdadeiros
  if (isRejected) {
    return (
      <Alert className="mb-4 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
        <AlertTitle>Petição em revisão</AlertTitle>
        <AlertDescription>{rejectionMessage}</AlertDescription>
      </Alert>
    );
  }
  
  // Se não for rejeitada, mas estiver em processamento
  if (isProcessing) {
    return (
      <Alert className="mb-4 bg-amber-50 border-amber-200">
        <Loader2 className="h-4 w-4 animate-spin text-amber-500 mr-2" />
        <AlertTitle>Em avaliação</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }
  
  return null;
};

export default ProcessingNotification;

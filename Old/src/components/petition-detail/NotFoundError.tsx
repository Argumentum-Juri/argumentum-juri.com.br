
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotFoundErrorProps {
  message?: string;
  errorType?: 'not-found' | 'permission' | 'generic';
}

const NotFoundError = ({ 
  message = "A petição solicitada não existe ou foi removida.",
  errorType = 'not-found'
}: NotFoundErrorProps) => {
  const navigate = useNavigate();

  // Obter título e mensagem com base no tipo de erro
  let title = "Petição não encontrada";
  let defaultMessage = "A petição solicitada não existe ou foi removida.";
  
  if (errorType === 'permission') {
    title = "Acesso negado";
    defaultMessage = "Você não tem permissão para acessar esta petição.";
  } else if (errorType === 'generic') {
    title = "Erro ao carregar petição";
    defaultMessage = "Ocorreu um erro ao carregar os detalhes da petição.";
  }

  // Usar a mensagem fornecida ou a mensagem padrão
  const displayMessage = message || defaultMessage;

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-lg font-medium mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {displayMessage}
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate("/petitions")}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a lista
        </Button>
      </CardContent>
    </Card>
  );
};

export default NotFoundError;

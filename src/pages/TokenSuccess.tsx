
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { tokenService } from '@/services/tokenService';
import { toast } from 'sonner';

const TokenSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const [currentTokens, setCurrentTokens] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        try {
          setLoading(true);
          
          // Limpar o cache de tokens para garantir dados atualizados
          tokenService.clearAllTokenCache();
          
          await new Promise(resolve => setTimeout(resolve, 2500));
          // Buscar saldo atualizado após a compra
          const tokens = await tokenService.getPersonalTokenBalance();
          setCurrentTokens(tokens);
          console.log("Tokens carregados após compra:", tokens);
        } catch (error) {
          console.error("Error fetching Tokens:", error);
          toast.error("Erro ao carregar saldo de Tokens", {
            description: "Tente atualizar a página ou voltar ao Dashboard"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTokens();
  }, [user]); 

  return (
    <div className="py-6">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
              <p className="text-muted-foreground mb-4">
                Sua compra de Tokens foi processada com sucesso.
              </p>

              <div className="bg-muted p-4 rounded-lg w-full flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-argumentum-gold mr-2" />
                  <span className="font-medium">Saldo Atual:</span>
                </div>
                <span className="font-bold text-xl">
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculando...
                    </span>
                  ) : `${currentTokens} tokens`}
                </span>
              </div>

              <div className="space-y-4 w-full">
                <Button asChild className="w-full">
                  <Link to="/petitions/new">
                    Solicitar Nova Petição
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/tokens/store">
                    Voltar para a Loja
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TokenSuccess;

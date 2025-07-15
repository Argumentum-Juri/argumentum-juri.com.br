
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, CreditCard, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { toast } from 'sonner';

const TokenSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { getToken } = useGoAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    const verifyAndProcessSubscription = async () => {
      if (!sessionId) {
        setVerificationStatus('error');
        return;
      }

      try {
        const goAuthToken = getToken();
        if (!goAuthToken) {
          toast.error('Sessão inválida');
          setVerificationStatus('error');
          return;
        }

        const { data, error } = await supabase.functions.invoke('verify-subscription-checkout', {
          body: { sessionId },
          headers: {
            Authorization: `Bearer ${goAuthToken}`
          }
        });

        if (error) {
          console.error('Erro ao verificar checkout:', error);
          setVerificationStatus('error');
          return;
        }

        if (data?.success) {
          setVerificationData(data);
          setVerificationStatus('success');
          toast.success('Assinatura processada com sucesso!');
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('Erro durante verificação:', error);
        setVerificationStatus('error');
      }
    };

    verifyAndProcessSubscription();
  }, [sessionId, getToken]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-legal-blue-50 to-legal-blue-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-legal-blue-600 mb-4"></div>
            <p className="text-legal-text">Processando sua assinatura...</p>
            <p className="text-sm text-legal-text-secondary mt-2">Isso pode levar alguns segundos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro no Processamento</h2>
            <p className="text-center text-gray-600 mb-6">
              Houve um problema ao processar sua assinatura. Por favor, entre em contato com o suporte.
            </p>
            <div className="flex gap-3 w-full">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/token-store">Voltar à Loja</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-legal-blue-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-green-100 p-3 w-fit">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Assinatura Ativada!
          </CardTitle>
          <CardDescription className="text-lg">
            Sua assinatura foi processada com sucesso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {verificationData && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Tokens Creditados:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {verificationData.tokensCredited} tokens
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <Badge className="bg-legal-blue-100 text-legal-blue-800">
                  Ativa
                </Badge>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Próximos Créditos</h4>
                <p className="text-sm text-blue-700">
                  Seus tokens serão creditados automaticamente todo mês na data da assinatura.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/token-store" className="flex items-center justify-center">
                Gerenciar Assinatura
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/dashboard" className="flex items-center justify-center">
                Ir ao Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenSuccess;

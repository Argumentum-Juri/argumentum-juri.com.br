import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DebugResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export const TokenDebugPanel = () => {
  const [results, setResults] = useState<{ [key: string]: DebugResult }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const { toast } = useToast();

  const logResult = (key: string, result: DebugResult) => {
    setResults(prev => ({ ...prev, [key]: result }));
    setLoading(prev => ({ ...prev, [key]: false }));
  };

  const testWebhookDebug = async () => {
    setLoading(prev => ({ ...prev, webhookDebug: true }));
    
    try {
      // Simulate a test event
      const testEvent = {
        type: 'test_event',
        id: 'test_' + Date.now(),
        data: { object: { id: 'test_session' } }
      };

      const response = await fetch(
        `https://mefgswdpeellvaggvttc.supabase.co/functions/v1/webhook-stripe-debug`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZmdzd2RwZWVsbHZhZ2d2dHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDQ1NTAsImV4cCI6MjA2MTMyMDU1MH0.9-PrOlsvyrYr8ZUq5C72B_W9L74stkpyqwBkc5xsq8Q'
          },
          body: JSON.stringify(testEvent)
        }
      );

      const data = await response.json();
      
      logResult('webhookDebug', {
        success: response.ok,
        data,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "✅ Webhook Debug Teste",
          description: "Função webhook-stripe-debug está funcionando!"
        });
      } else {
        toast({
          title: "❌ Webhook Debug Erro",
          description: `Status: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      logResult('webhookDebug', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });

      toast({
        title: "❌ Erro no Teste",
        description: "Falha ao conectar com webhook debug",
        variant: "destructive"
      });
    }
  };

  const testManualVerification = async () => {
    setLoading(prev => ({ ...prev, manualVerification: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('manual-token-verification');
      
      logResult('manualVerification', {
        success: !error && data?.success !== false,
        data: data || error,
        timestamp: new Date().toISOString()
      });

      if (!error && data?.success !== false) {
        toast({
          title: "✅ Verificação Manual",
          description: `Processados: ${data.totalTokensAdded || 0} tokens`,
        });
        // Refresh token balance after successful verification
        checkTokenBalance();
      } else {
        const errorMsg = error?.message || data?.error || "Erro desconhecido";
        toast({
          title: "⚠️ Resultado da Verificação",
          description: errorMsg,
          variant: data?.suggestion ? "default" : "destructive"
        });
      }
    } catch (error) {
      logResult('manualVerification', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });

      toast({
        title: "❌ Erro na Verificação",
        description: "Falha ao verificar tokens",
        variant: "destructive"
      });
    }
  };

  const checkTokenBalance = async () => {
    setLoading(prev => ({ ...prev, tokenBalance: true }));
    
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('tokens')
        .maybeSingle();
      
      if (!error) {
        if (data) {
          setTokenBalance(data.tokens);
          logResult('tokenBalance', {
            success: true,
            data: { currentBalance: data.tokens },
            timestamp: new Date().toISOString()
          });
          
          toast({
            title: "💰 Saldo Atual",
            description: `Você tem ${data.tokens} tokens disponíveis`,
          });
        } else {
          // No token record exists yet
          setTokenBalance(0);
          logResult('tokenBalance', {
            success: true,
            data: { currentBalance: 0, message: "Nenhum registro de tokens encontrado - saldo inicial: 0" },
            timestamp: new Date().toISOString()
          });
          
          toast({
            title: "💰 Saldo Inicial",
            description: "Você ainda não possui tokens. Saldo: 0",
          });
        }
      } else {
        logResult('tokenBalance', {
          success: false,
          error: error?.message || "Erro ao verificar saldo",
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "❌ Erro no Saldo",
          description: `Erro: ${error.message}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      logResult('tokenBalance', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "❌ Erro ao Verificar Saldo",
        description: "Falha ao conectar com o banco",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, tokenBalance: false }));
    }
  };

  const testWebhookProduction = async () => {
    setLoading(prev => ({ ...prev, webhookProduction: true }));
    
    try {
      // Test with simple ping event
      const testEvent = {
        type: 'ping',
        id: 'test_ping_' + Date.now()
      };

      const response = await fetch(
        `https://mefgswdpeellvaggvttc.supabase.co/functions/v1/webhook-stripe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZmdzd2RwZWVsbHZhZ2d2dHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDQ1NTAsImV4cCI6MjA2MTMyMDU1MH0.9-PrOlsvyrYr8ZUq5C72B_W9L74stkpyqwBkc5xsq8Q'
          },
          body: JSON.stringify(testEvent)
        }
      );

      const data = await response.json();
      
      logResult('webhookProduction', {
        success: response.ok,
        data,
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        toast({
          title: "✅ Webhook Produção Teste",
          description: "Função webhook-stripe está respondendo!"
        });
      } else {
        toast({
          title: "❌ Webhook Produção Erro",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      logResult('webhookProduction', {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });

      toast({
        title: "❌ Erro no Teste Produção",
        description: "Falha ao conectar com webhook produção",
        variant: "destructive"
      });
    }
  };

  const ResultCard = ({ title, resultKey, description }: { title: string; resultKey: string; description: string }) => {
    const result = results[resultKey];
    const isLoading = loading[resultKey];

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
            <Badge variant={result?.success ? "default" : result?.success === false ? "destructive" : "secondary"}>
              {isLoading ? "Testando..." : result?.success ? "✅ OK" : result?.success === false ? "❌ Erro" : "⏳ Aguardando"}
            </Badge>
          </div>
        </CardHeader>
        {result && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                {result.timestamp}
              </div>
              {result.success ? (
                <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                  <strong>Erro:</strong> {result.error}
                  {result.data && (
                    <pre className="whitespace-pre-wrap text-xs mt-2">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Debug Panel - Stripe Webhooks & Tokens
          </CardTitle>
          <CardDescription>
            Ferramenta para diagnosticar problemas com webhooks do Stripe e creditação de tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              onClick={testWebhookDebug}
              disabled={loading.webhookDebug}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              {loading.webhookDebug ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <TestTube className="h-5 w-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Teste Debug</div>
                <div className="text-xs text-muted-foreground">webhook-stripe-debug</div>
              </div>
            </Button>

            <Button
              onClick={testWebhookProduction}
              disabled={loading.webhookProduction}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              {loading.webhookProduction ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Teste Produção</div>
                <div className="text-xs text-muted-foreground">webhook-stripe</div>
              </div>
            </Button>

            <Button
              onClick={testManualVerification}
              disabled={loading.manualVerification}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              {loading.manualVerification ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <div className="text-center">
                <div className="font-medium">Verificar Tokens</div>
                <div className="text-xs text-muted-foreground">Forçar verificação manual</div>
              </div>
            </Button>

            <Button
              onClick={checkTokenBalance}
              disabled={loading.tokenBalance}
              variant="secondary"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              {loading.tokenBalance ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="text-lg">💰</span>
              )}
              <div className="text-center">
                <div className="font-medium">Ver Saldo</div>
                <div className="text-xs text-muted-foreground">
                  {tokenBalance !== null ? `${tokenBalance} tokens` : 'Verificar saldo atual'}
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Resultados dos Testes</h3>
        
        <ResultCard
          title="Debug Webhook"
          resultKey="webhookDebug"
          description="Testa se a função webhook-stripe-debug está funcionando e conectando ao banco"
        />

        <ResultCard
          title="Produção Webhook"
          resultKey="webhookProduction"
          description="Testa se a função webhook-stripe principal está respondendo sem erro 401"
        />

        <ResultCard
          title="Verificação Manual"
          resultKey="manualVerification"
          description="Força a verificação de pagamentos recentes e credita tokens pendentes"
        />

        <ResultCard
          title="Saldo de Tokens"
          resultKey="tokenBalance"
          description="Verifica o saldo atual de tokens do usuário logado"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instruções de Uso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
            <div>
              <strong>Debug Webhook:</strong> Testa se a função de debug consegue conectar ao banco e processar eventos
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
            <div>
              <strong>Produção Webhook:</strong> Testa se o webhook principal responde (deve resolver o erro 401)
            </div>
          </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
              <div>
                <strong>Verificação Manual:</strong> Busca pagamentos recentes no Stripe e credita tokens pendentes
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500" />
              <div>
                <strong>Ver Saldo:</strong> Mostra o saldo atual de tokens do usuário logado
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
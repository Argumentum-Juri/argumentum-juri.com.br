
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TOKEN_PLANS, SUBSCRIPTION_PLANS } from '@/config/tokenPlans';
import TokenPlanCard from '@/components/tokens/TokenPlanCard';
import CustomTokenForm from '@/components/tokens/CustomTokenForm';
import TokenBalanceCard from '@/components/tokens/TokenBalanceCard';
import TokenBenefits from '@/components/tokens/TokenBenefits';
import { useTokenStore } from '@/hooks/useTokenStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useTeamOwnership } from '@/hooks/useTeamOwnership';

const TokenStore: React.FC = () => {
  const navigate = useNavigate();
  const { user, teamId } = useAuth();
  const { isOwner: isTeamOwner } = useTeamOwnership(teamId);
  
  const {
    // Use the correct property names based on the returned values from useTokenStore
    teamTokens: currentTokens,
    loadingTeamTokens: loading,
    purchaseLoading,
    customTokens,
    handlePlanPurchase,
    handleSubscriptionPurchase,
    handleCustomTokenPurchase,
    handleCustomTokenChange,
    formatCurrency,
    currentSubscription
  } = useTokenStore();

  const [manageLoading, setManageLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Filtrar planos baseados no ciclo de cobrança selecionado
  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => plan.billingType === billingCycle);

  // Verificar se o usuário é o proprietário da equipe
  useEffect(() => {
    if (!isTeamOwner && !loading) {
      navigate('/dashboard');
    }
  }, [isTeamOwner, loading, navigate]);

  // Verificar status de assinatura ao carregar a página
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        setLoadingSubscription(true);
        // Carregar os dados da assinatura aqui - isso já está sendo feito pelo useTokenStore
        // Apenas adicionamos um pequeno delay para garantir que os dados foram carregados
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Erro ao verificar status da assinatura:", error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  // Novo efeito para definir automaticamente a aba com base na assinatura atual
  useEffect(() => {
    if (currentSubscription?.planId) {
      // Verificar se o ID do plano contém 'annual' para identificar assinaturas anuais
      const isAnnualPlan = currentSubscription.planId.includes('annual');
      setBillingCycle(isAnnualPlan ? 'annual' : 'monthly');
    }
  }, [currentSubscription]);

  const handleSubscription = async (planId: string) => {
    // Verificar se o usuário já tem uma assinatura
    if (currentSubscription && currentSubscription.planId) {
      console.log("Usuário já tem assinatura, redirecionando para o portal de gerenciamento");
      await handleManageSubscription();
      return;
    }
    
    // Se não tem assinatura, prosseguir com a compra normalmente
    await handleSubscriptionPurchase(planId);
  };

  const handleManageSubscription = async () => {
    try {
      setManageLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        toast.error("Sessão inválida", {
          description: "Por favor, faça login novamente para continuar."
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        headers: { 
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (error) {
        console.error("Erro ao acessar portal de assinatura:", error);
        toast.error("Erro ao acessar o portal de assinatura");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erro ao gerar link para gerenciar assinatura");
      }
    } catch (error) {
      console.error("Erro ao gerenciar assinatura:", error);
      toast.error("Não foi possível acessar o portal de assinatura");
    } finally {
      setManageLoading(false);
    }
  };

  // Verificar se um plano é o plano atual do usuário
  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.planId === planId;
  };
  
  if (!isTeamOwner) {
    return null; // Será redirecionado no useEffect
  }
  
  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header com navegação e título - melhorado para mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link to="/dashboard" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span>Voltar</span>
              </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-semibold text-legal-text">Loja de Tokens</h1>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManageSubscription} 
            disabled={manageLoading || !currentSubscription}
            className="flex items-center whitespace-nowrap"
          >
            <Settings className="h-4 w-4 mr-2" />
            {manageLoading ? 'Carregando...' : 'Gerenciar Assinatura'}
          </Button>
        </div>
        
        <TokenBalanceCard currentTokens={currentTokens} loading={loading} />
        
        <h2 className="text-xl font-semibold my-6">Assinaturas</h2>
        
        <div className="mb-6 flex justify-center">
          <Tabs 
            defaultValue={billingCycle} 
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as 'monthly' | 'annual')}
            className="w-full max-w-md mx-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="annual">Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {billingCycle === 'annual' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6 text-sm">
            <p className="text-center text-blue-700 dark:text-blue-300">
              Os planos anuais liberam tokens mensalmente, garantindo um fluxo constante de créditos ao longo do período da assinatura.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredPlans.map((plan) => (
            <TokenPlanCard
              key={plan.id}
              plan={plan}
              onPurchase={handleSubscription}
              isLoading={!!purchaseLoading || manageLoading}
              loadingPlanId={purchaseLoading}
              formatCurrency={formatCurrency}
              isCurrentPlan={isCurrentPlan(plan.id)}
              loadingSubscription={loadingSubscription}
              hasActiveSubscription={!!currentSubscription}
            />
          ))}
        </div>
        
        <Separator className="my-8" />
        
        <h2 className="text-xl font-semibold mb-6">Tokens Avulsos</h2>
        
        <CustomTokenForm
          customTokens={customTokens}
          onTokenChange={handleCustomTokenChange}
          onPurchase={handleCustomTokenPurchase}
          isLoading={purchaseLoading !== null}
          loadingPlanId={purchaseLoading}
          formatCurrency={formatCurrency}
        />
        
        <TokenBenefits />
      </div>
    </div>
  );
};

export default TokenStore;

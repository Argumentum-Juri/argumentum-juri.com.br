
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TOKEN_PLANS, SUBSCRIPTION_PLANS, calculatePrice, calculateDiscount } from '@/config/tokenPlans';
import { tokenService } from '@/services/tokenService';
import { stripeService } from '@/services/stripeService';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; 

export interface CurrentSubscription {
  planId: string;
  planName: string;
  subscriptionId: string;
  endDate: string;
  nextRenewal?: string; // Data da próxima renovação mensal para planos anuais
}

export const formatCurrency = (priceInCents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(priceInCents); // Convertendo centavos para reais
};

export const useTokenStore = () => {
  const { toast: uiToast } = useToast();
  const { user } = useAuth();
  const [currentTokens, setCurrentTokens] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [customTokens, setCustomTokens] = useState<number>(100);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState<boolean>(true);
  
  // Buscar detalhes da assinatura atual do usuário
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (user) {
        setSubscriptionLoading(true);
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session?.access_token) {
            setSubscriptionLoading(false);
            return;
          }
          
          const { data, error } = await supabase.functions.invoke("subscription-details", {
            headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
          });
          
          if (error) {
            console.error("Erro ao buscar detalhes da assinatura:", error);
            setSubscriptionLoading(false);
            return;
          }
          
          if (data && data.active) {
            // Buscar informações de renovação para planos anuais
            let nextRenewal = null;
            
            // Verificar se é um plano anual pela planId
            const isAnnualPlan = data.planId?.includes("annual");
            
            if (isAnnualPlan) {
              // Usar uma query tipada que o Supabase consegue inferir corretamente
              const { data: renewalInfo, error: renewalError } = await supabase
                .from('subscription_renewals')
                .select('next_renewal_date')
                .eq('subscription_id', data.subscriptionId)
                .maybeSingle();
              
              if (!renewalError && renewalInfo) {
                nextRenewal = renewalInfo.next_renewal_date;
              }
            }
            
            setCurrentSubscription({
              planId: data.planId,
              planName: data.planName,
              subscriptionId: data.subscriptionId,
              endDate: data.endDate,
              nextRenewal: nextRenewal
            });
            console.log("Assinatura ativa encontrada:", data);
          } else {
            setCurrentSubscription(null);
            console.log("Nenhuma assinatura ativa encontrada");
          }
        } catch (error) {
          console.error("Erro ao buscar assinatura:", error);
        } finally {
          setSubscriptionLoading(false);
        }
      }
    };
    
    fetchSubscriptionDetails();
    
    // Configurar intervalo para verificar atualizações de assinatura a cada 30 segundos
    const intervalId = setInterval(fetchSubscriptionDetails, 30000);
    
    // Limpar intervalo ao desmontar
    return () => clearInterval(intervalId);
  }, [user]);
  
  useEffect(() => {
    const fetchTokens = async () => {
      if (user) {
        setLoading(true);
        try {
          const tokens = await tokenService.getTokenBalance();
          setCurrentTokens(tokens);
        } catch (error) {
          console.error("Error fetching tokens:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchTokens();
  }, [user]);
  
  const handlePlanPurchase = async (planId: string) => {
    setPurchaseLoading(planId);
    try {
      console.log("Iniciando compra do plano:", planId);
      
      const plan = TOKEN_PLANS.find(p => p.id === planId);
      if (!plan) {
        console.error("Plano não encontrado:", planId);
        toast.error("Erro", {
          description: "Plano não encontrado."
        });
        return;
      }
      
      console.log("Detalhes do plano:", { tokens: plan.tokens, priceInCents: plan.priceInCents, name: plan.name });
      
      const checkoutUrl = await stripeService.createTokenCheckoutSession(
        plan.tokens,
        plan.priceInCents / 100, // Convertendo centavos para reais
        plan.name
      );
      
      if (checkoutUrl) {
        console.log("URL de checkout recebida, redirecionando para:", checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        console.error("URL de checkout não recebida");
        toast.error("Erro ao redirecionar para o checkout", {
          description: "Não foi possível processar sua solicitação. Tente novamente."
        });
      }
    } catch (error) {
      console.error("Error during purchase:", error);
      toast.error("Erro na compra", {
        description: error instanceof Error ? error.message : "Não foi possível processar sua solicitação de compra."
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  // Método para lidar com assinaturas
  const handleSubscriptionPurchase = async (planId: string) => {
    setPurchaseLoading(planId);
    try {
      console.log("Iniciando assinatura do plano:", planId);
      
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        console.error("Plano de assinatura não encontrado:", planId);
        toast.error("Erro", {
          description: "Plano de assinatura não encontrado."
        });
        return;
      }
      
      if (!plan.priceId) {
        console.error("ID de preço não encontrado para o plano:", planId);
        toast.error("Erro", {
          description: "Configuração de plano inválida."
        });
        return;
      }
      
      console.log("Detalhes do plano de assinatura:", { 
        tokens: plan.tokens, 
        priceInCents: plan.priceInCents, 
        name: plan.name,
        priceId: plan.priceId
      });
      
      const checkoutUrl = await stripeService.createSubscriptionCheckoutSession(
        plan.priceId,
        plan.name,
        plan.billingType || 'monthly'
      );
      
      if (checkoutUrl) {
        console.log("URL de checkout de assinatura recebida, redirecionando para:", checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        console.error("URL de checkout de assinatura não recebida");
        toast.error("Erro ao redirecionar para o checkout", {
          description: "Não foi possível processar sua solicitação. Tente novamente."
        });
      }
    } catch (error) {
      console.error("Error during subscription purchase:", error);
      toast.error("Erro na assinatura", {
        description: error instanceof Error ? error.message : "Não foi possível processar sua solicitação de assinatura."
      });
    } finally {
      setPurchaseLoading(null);
    }
  };
  
  const handleCustomTokenPurchase = async () => {
    setPurchaseLoading('custom');
    try {
      console.log("Iniciando compra personalizada de tokens:", customTokens);
      
      // Cálculo do preço usando as funções do config/tokenPlans.ts
      const priceInCents = calculatePrice(customTokens);
      console.log(`Preço calculado para ${customTokens} tokens: ${formatCurrency(priceInCents)} (${priceInCents} centavos)`);
      
      const discount = calculateDiscount(customTokens);
      console.log(`Desconto aplicado: ${discount}%`);
      
      const checkoutUrl = await stripeService.createCustomTokenCheckout(customTokens);
      
      if (checkoutUrl) {
        console.log("URL de checkout para compra personalizada recebida:", checkoutUrl);
        window.location.href = checkoutUrl;
      } else {
        console.error("URL de checkout para compra personalizada não recebida");
        toast.error("Erro ao redirecionar para o checkout", {
          description: "Não foi possível processar sua solicitação. Tente novamente."
        });
      }
    } catch (error) {
      console.error("Error during custom purchase:", error);
      toast.error("Erro na compra", {
        description: error instanceof Error ? error.message : "Não foi possível processar sua solicitação de compra personalizada."
      });
    } finally {
      setPurchaseLoading(null);
    }
  };
  
  const handleCustomTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setCustomTokens(0);
    } else {
      const parsedValue = parseInt(value, 10);
      if (!isNaN(parsedValue) && parsedValue >= 0) {
        setCustomTokens(parsedValue);
      }
    }
  };
  
  // Calcular o preço para tokens personalizados com base nas funções
  const calculateCustomPrice = () => {
    if (customTokens <= 0) return 0;
    return calculatePrice(customTokens);
  };
  
  const refreshSubscriptionDetails = async () => {
    if (!user) return;
    
    setSubscriptionLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        setSubscriptionLoading(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke("subscription-details", {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });
      
      if (error) {
        console.error("Erro ao buscar detalhes da assinatura:", error);
        toast.error("Erro", { 
          description: "Não foi possível verificar seu status de assinatura." 
        });
        return;
      }
      
      if (data && data.active) {
        setCurrentSubscription({
          planId: data.planId,
          planName: data.planName,
          subscriptionId: data.subscriptionId,
          endDate: data.endDate,
          nextRenewal: data.nextRenewal
        });
        toast.success("Sucesso", { 
          description: "Status da assinatura atualizado." 
        });
      } else {
        setCurrentSubscription(null);
        if (currentSubscription) {
          toast.info("Informação", { 
            description: "Você não possui uma assinatura ativa no momento." 
          });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar assinatura:", error);
      toast.error("Erro", { 
        description: "Falha ao atualizar status da assinatura."
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };
  
  const getCustomTokenDiscount = () => {
    return calculateDiscount(customTokens);
  };
  
  return {
    currentTokens,
    loading,
    purchaseLoading,
    customTokens,
    currentSubscription,
    subscriptionLoading,
    handlePlanPurchase,
    handleSubscriptionPurchase,
    handleCustomTokenPurchase,
    handleCustomTokenChange,
    formatCurrency,
    calculateCustomPrice,
    refreshSubscriptionDetails,
    getCustomTokenDiscount
  };
};

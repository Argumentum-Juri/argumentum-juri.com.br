
import { useState, useEffect, useCallback } from 'react';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { useUserTokens } from '@/hooks/useUserTokens';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { stripeService } from '@/services/stripeService';
import { TOKEN_PLANS, SUBSCRIPTION_PLANS } from '@/config/tokenPlans';
import { goApiClient } from '@/lib/goApiClient';

export const useTokenStore = () => {
  const { user, getToken } = useGoAuth();
  
  // Usar o hook correto para buscar tokens
  const { tokens: userTokens, isLoading: loadingUserTokens, refreshTokens } = useUserTokens();
  
  // Estados para compras e assinatura
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [customTokens, setCustomTokens] = useState<number>(100);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Mapear price_id para nome do plano frontend
  const mapPriceIdToPlanId = (priceId: string): string | null => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.priceId === priceId);
    return plan ? plan.id : null;
  };

  // Load subscription data via GoAuth API (bypassa RLS issues)
  const loadSubscription = useCallback(async () => {
    if (!user) {
      console.log('[loadSubscription] No user, skipping');
      return;
    }
    
    try {
      const goAuthToken = getToken();
      if (!goAuthToken) {
        console.log('[loadSubscription] No auth token, skipping');
        return;
      }
      
      console.log('[loadSubscription] Fetching subscription via GoAuth API for user:', user.id);
      
      // Usar API GoAuth em vez de consulta Supabase direta para evitar problemas de RLS
      const response = await goApiClient.getSubscription();
      
      console.log('[loadSubscription] GoAuth API response:', response);
      
      if (response.data && response.data.subscription) {
        const subscriptionData = response.data.subscription;
        console.log('[loadSubscription] Found subscription data:', subscriptionData);
        
        // Mapear o stripe_price_id para o ID do plano frontend
        const frontendPlanId = mapPriceIdToPlanId(subscriptionData.stripe_price_id);
        console.log('[loadSubscription] Mapped price_id to plan:', { 
          stripePriceId: subscriptionData.stripe_price_id, 
          frontendPlanId 
        });
        
        const subscriptionObj = {
          planId: frontendPlanId,
          stripeSubscriptionId: subscriptionData.stripe_subscription_id,
          stripePriceId: subscriptionData.stripe_price_id,
          billingCycle: subscriptionData.billing_cycle,
          planType: subscriptionData.plan_type,
          tokensPerCycle: subscriptionData.tokens_per_cycle,
          status: subscriptionData.status,
          nextTokenGrantDate: subscriptionData.next_token_grant_date
        };
        
        console.log('[loadSubscription] Setting currentSubscription:', subscriptionObj);
        setCurrentSubscription(subscriptionObj);
      } else {
        console.log('[loadSubscription] No active subscription found');
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('[loadSubscription] Error loading subscription:', error);
      setCurrentSubscription(null);
    }
  }, [user, getToken]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const handlePlanPurchase = async (planId: string) => {
    setPurchaseLoading(planId);
    try {
      const plan = TOKEN_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      const checkoutUrl = await stripeService.createTokenCheckoutSession(
        plan.tokens,
        plan.priceInCents,
        plan.name
      );

      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao processar compra do plano:', error);
      toast.error('Erro ao processar compra do plano');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleSubscriptionPurchase = async (planId: string) => {
    setPurchaseLoading(planId);
    try {
      // Usar o token do GoAuth context
      const goAuthToken = getToken();
      
      if (!goAuthToken) {
        toast.error('Sessão inválida');
        return;
      }
      
      // Buscar o plano nos SUBSCRIPTION_PLANS
      const { SUBSCRIPTION_PLANS } = await import('@/config/tokenPlans');
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      
      if (!plan || !plan.priceId) {
        toast.error('Plano não encontrado ou price ID inválido');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('subscription-checkout', {
        body: { 
          priceId: plan.priceId,
          planName: plan.name,
          billingType: plan.billingType,
          planId
        },
        headers: {
          Authorization: `Bearer ${goAuthToken}`
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      toast.error('Erro ao processar assinatura');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleCustomTokenPurchase = async () => {
    setPurchaseLoading('custom');
    try {
      const checkoutUrl = await stripeService.createCustomTokenCheckout(customTokens);
      
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao processar compra personalizada:', error);
      toast.error('Erro ao processar compra de tokens personalizados');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleCustomTokenChange = (value: number) => {
    setCustomTokens(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return {
    teamTokens: userTokens, // Agora usando os tokens corretos
    loadingTeamTokens: loadingUserTokens,
    purchaseLoading,
    customTokens,
    setCustomTokens,
    currentSubscription,
    handlePlanPurchase,
    handleSubscriptionPurchase,
    handleCustomTokenPurchase,
    handleCustomTokenChange,
    formatCurrency,
    loadTeamTokens: refreshTokens, // Renomeado para manter compatibilidade
    loadSubscription,
  };
};

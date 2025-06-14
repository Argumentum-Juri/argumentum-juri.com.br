
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tokenService } from '@/services/tokenService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTokenStore = () => {
  const { user, teamId } = useAuth();
  const [teamTokens, setTeamTokens] = useState<number>(0);
  const [loadingTeamTokens, setLoadingTeamTokens] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [customTokens, setCustomTokens] = useState<number>(100);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // Load team tokens
  const loadTeamTokens = useCallback(async () => {
    if (!teamId) {
      setLoadingTeamTokens(false);
      return;
    }
    
    try {
      setLoadingTeamTokens(true);
      const tokens = await tokenService.getTeamTokenBalance(teamId);
      setTeamTokens(tokens);
    } catch (error) {
      console.error('Error loading team tokens:', error);
      toast.error('Erro ao carregar saldo de tokens');
    } finally {
      setLoadingTeamTokens(false);
    }
  }, [teamId]);

  // Load subscription data
  const loadSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) return;
      
      const { data, error } = await supabase.functions.invoke('stripe-subscription-status', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (!error && data) {
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [user]);

  useEffect(() => {
    loadTeamTokens();
    loadSubscription();
  }, [loadTeamTokens, loadSubscription]);

  const handlePlanPurchase = async (planId: string) => {
    // Implementation for plan purchase
    setPurchaseLoading(planId);
    try {
      // Add plan purchase logic here
      toast.success('Plano adquirido com sucesso!');
    } catch (error) {
      toast.error('Erro ao adquirir plano');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleSubscriptionPurchase = async (planId: string) => {
    setPurchaseLoading(planId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast.error('Sessão inválida');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Erro ao processar assinatura');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleCustomTokenPurchase = async () => {
    setPurchaseLoading('custom');
    try {
      // Add custom token purchase logic here
      toast.success('Tokens adquiridos com sucesso!');
      await loadTeamTokens(); // Reload tokens after purchase
    } catch (error) {
      toast.error('Erro ao adquirir tokens');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleCustomTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setCustomTokens(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  return {
    teamTokens,
    loadingTeamTokens,
    purchaseLoading,
    customTokens,
    currentSubscription,
    handlePlanPurchase,
    handleSubscriptionPurchase,
    handleCustomTokenPurchase,
    handleCustomTokenChange,
    formatCurrency,
    loadTeamTokens
  };
};

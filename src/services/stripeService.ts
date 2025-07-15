
import { supabase } from "@/integrations/supabase/client";
import { getGoAuthToken } from "@/contexts/GoAuthContext";

class StripeService {
  async createTokenCheckoutSession(tokens: number, amount: number, planName: string): Promise<string | null> {
    try {
      const token = getGoAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('token-checkout', {
        body: {
          tokens,
          amount,
          planName
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('Erro detalhado ao criar sessão de checkout:', error);
        throw new Error(`Erro ao criar sessão de checkout: ${error.message || 'Desconhecido'}`);
      }

      if (!data || !data.url) {
        throw new Error('A resposta não contém a URL do checkout');
      }

      return data.url;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  async createCustomTokenCheckout(tokens: number): Promise<string | null> {
    try {
      const token = getGoAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      // Calcular o preço usando a função importada do arquivo tokenPlans
      // Usar o valor correto de R$10,00 por token
      const basePrice = tokens * 1000; // R$10,00 por token em centavos

      const { data, error } = await supabase.functions.invoke('token-checkout', {
        body: {
          custom: true,
          tokens,
          amount: basePrice / 100 // Convertendo de centavos para reais para o backend
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('Erro detalhado ao criar checkout personalizado:', error);
        throw new Error(`Erro ao criar checkout personalizado: ${error.message || 'Desconhecido'}`);
      }

      if (!data || !data.url) {
        throw new Error('A resposta não contém a URL do checkout');
      }

      return data.url;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout personalizada:', error);
      throw error;
    }
  }

  async createSubscriptionCheckoutSession(priceId: string, planName: string, billingType: 'monthly' | 'annual'): Promise<string | null> {
    try {
      const token = getGoAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('subscription-checkout', {
        body: {
          priceId,
          planName,
          billingType
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('Erro detalhado ao criar sessão de checkout para assinatura:', error);
        throw new Error(`Erro ao criar sessão de checkout para assinatura: ${error.message || 'Desconhecido'}`);
      }

      if (!data || !data.url) {
        throw new Error('A resposta não contém a URL do checkout');
      }

      return data.url;
    } catch (error) {
      console.error('Erro ao criar sessão de checkout para assinatura:', error);
      throw error;
    }
  }

  async redirectToStripePortal(): Promise<string | null> {
    try {
      const token = getGoAuthToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('Erro detalhado ao redirecionar para o portal Stripe:', error);
        throw error;
      }

      if (!data || !data.url) {
        throw new Error('A resposta não contém a URL do portal');
      }

      return data.url;
    } catch (error) {
      console.error('Erro ao redirecionar para o portal Stripe:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();

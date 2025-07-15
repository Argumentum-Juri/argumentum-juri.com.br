
import { supabase } from "@/integrations/supabase/client";

class StripeService {
  async createTokenCheckoutSession(tokens: number, amount: number, planName: string): Promise<string | null> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('token-checkout', {
        body: {
          tokens,
          amount,
          planName,
          userId: sessionData.session.user.id
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
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
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      // Calcular o preço usando a função importada do arquivo tokenPlans
      // Usamos o valor diretamente (10 reais por token com desconto aplicado)
      const basePrice = tokens * 10; // R$10 por token

      const { data, error } = await supabase.functions.invoke('token-checkout', {
        body: {
          custom: true,
          tokens,
          amount: basePrice / 100, // Convertendo de centavos para reais para o backend
          userId: sessionData.session.user.id
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
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
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('subscription-checkout', {
        body: {
          priceId,
          planName,
          billingType,
          userId: sessionData.session.user.id
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
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
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
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

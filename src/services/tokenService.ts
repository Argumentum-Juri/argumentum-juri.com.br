
import { supabase } from "@/integrations/supabase/client";

export const tokenService = {
  async getTokenBalance() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const { data, error } = await supabase
        .from('user_tokens')
        .select('tokens')
        .eq('user_id', userData.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching token balance:', error);
        return 0;
      }
      
      return data?.tokens || 0;
    } catch (error) {
      console.error('Error in getTokenBalance:', error);
      return 0;
    }
  },
  
  // Alias para getTokenBalance para compatibilidade com código existente
  getUserTokens() {
    return this.getTokenBalance();
  },
  
  async createCheckoutSession(tokensAmount: number, price: number) {
    try {
      const { data, error } = await supabase.functions.invoke('token-checkout', {
        body: {
          tokensAmount,
          price
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },
  
  async getPaymentHistory(userId?: string) {
    try {
      // Modificação: Agora permite passar um userId específico
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: userId ? { userId } : undefined
      });
      
      if (error) {
        console.error('Error fetching payment history:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      throw error;
    }
  },
  
  async openStripePortal() {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      
      if (error) {
        console.error('Error opening Stripe portal:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in openStripePortal:', error);
      throw error;
    }
  }
};

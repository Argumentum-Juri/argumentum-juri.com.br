
// src/services/tokenService.ts
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner'; // Para feedback visual ao usuário

export const tokenService = {
  /**
   * Busca o saldo de tokens PESSOAIS do usuário atualmente autenticado.
   * Sempre busca do banco de dados para garantir o valor mais recente.
   * Não armazena em cache para evitar inconsistências.
   */
  async getPersonalTokenBalance(): Promise<number> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return 0;
      }
      
      const { data, error: dbError } = await supabase
        .from('user_tokens')
        .select('tokens')
        .eq('user_id', user.id)
        .single();
      
      if (dbError && dbError.code !== 'PGRST116') { // PGRST116: no rows found, normal
        console.error('Erro ao buscar saldo de tokens pessoal do banco:', dbError);
        return 0;
      }
      
      return data?.tokens || 0;
    } catch (error) {
      console.error('Exceção em getPersonalTokenBalance:', error);
      return 0;
    }
  },

  /**
   * Alias para getPersonalTokenBalance.
   */
  getUserTokens(): Promise<number> {
    return this.getPersonalTokenBalance();
  },

  /**
   * Busca o saldo de tokens da EQUIPE especificada (saldo do proprietário da equipe).
   * Implementa cache local para reduzir chamadas à Edge Function 'get-team-token-balance'.
   * @param teamId O ID da equipe.
   * @param forceRefresh Se verdadeiro, ignora o cache e força uma nova busca.
   */
  async getTeamTokenBalance(teamId: string, forceRefresh = false): Promise<number> {
    if (!teamId) {
      console.warn('getTeamTokenBalance chamado sem teamId.');
      return 0;
    }

    try {
      // Implementação de cache local para reduzir chamadas à edge function
      const cacheKey = `team_tokens_${teamId}`;
      const timestampKey = `team_tokens_timestamp_${teamId}`;
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      const now = Date.now();
      
      // Usar cache se disponível e não expirado (5 minutos) e não forçando atualização
      if (!forceRefresh && cached && timestamp && (now - parseInt(timestamp)) < 300000) {
        console.log(`Usando saldo de tokens em cache para a equipe ${teamId}: ${cached}`);
        return parseInt(cached);
      }
      
      console.log(`Invocando 'get-team-token-balance' para teamId: ${teamId}`);
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('get-team-token-balance', {
        body: { teamId },
      });

      if (functionError) {
        console.error(`Erro ao invocar get-team-token-balance para teamId ${teamId}:`, functionError.message);
        const errorDetail = (functionError as any).context?.reason || (functionError as any).message || "Detalhes não disponíveis";
        
        // Usar cache como fallback em caso de erro, se disponível
        if (cached) {
          console.log(`Usando cache como fallback devido a erro na chamada da API`);
          return parseInt(cached);
        }
        
        toast.error('Falha ao Buscar Saldo da Equipe', { description: `Não foi possível obter o saldo da equipe. ${errorDetail}` });
        return 0;
      }

      if (typeof functionResponse?.tokens !== 'number') {
        console.error('Resposta inválida da função get-team-token-balance:', functionResponse);
        
        // Usar cache como fallback para resposta inválida
        if (cached) {
          return parseInt(cached);
        }
        
        toast.error('Erro de Comunicação', { description: 'Resposta inesperada do servidor ao buscar saldo da equipe.' });
        return 0;
      }
      
      const tokens = functionResponse.tokens;
      console.log(`Saldo da equipe ${teamId}: ${tokens} (atualizado do servidor)`);
      
      // Salvar no cache local
      localStorage.setItem(cacheKey, tokens.toString());
      localStorage.setItem(timestampKey, now.toString());
      
      return tokens;
    } catch (error) {
      console.error(`Exceção em getTeamTokenBalance para teamId ${teamId}:`, (error as Error).message);
      
      // Em caso de exceção, tentar usar o cache como fallback
      const cached = localStorage.getItem(`team_tokens_${teamId}`);
      if (cached) {
        console.log(`Usando cache como fallback devido a exceção`);
        return parseInt(cached);
      }
      
      toast.error('Erro Inesperado', { description: `Ocorreu um problema ao buscar o saldo da equipe: ${(error as Error).message}` });
      return 0;
    }
  },

  /**
   * Atualiza o cache local de tokens da equipe após uma transação bem-sucedida.
   * Útil para manter o cache atualizado sem precisar chamar a edge function.
   * @param teamId O ID da equipe.
   * @param newBalance O novo saldo de tokens.
   */
  updateTeamTokenCache(teamId: string, newBalance: number): void {
    if (!teamId) return;
    
    localStorage.setItem(`team_tokens_${teamId}`, newBalance.toString());
    localStorage.setItem(`team_tokens_timestamp_${teamId}`, Date.now().toString());
    console.log(`Cache de tokens da equipe ${teamId} atualizado: ${newBalance}`);
  },

  /**
   * Limpa todos os caches relacionados a tokens.
   * Útil para logout ou quando uma nova compra é realizada.
   */
  clearAllTokenCache(): void {
    // Limpar todos os caches de equipes (usando regex para identificar as keys)
    const allKeys = Object.keys(localStorage);
    const teamTokenKeys = allKeys.filter(key => key.match(/^team_tokens_/));
    const teamTokenTimestampKeys = allKeys.filter(key => key.match(/^team_tokens_timestamp_/));
    
    [...teamTokenKeys, ...teamTokenTimestampKeys].forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Todos os caches de tokens foram limpos');
  },

  /**
   * Cobra tokens da conta do proprietário da equipe para uma petição.
   * Chama a Edge Function 'charge-team-for-petition'.
   * @param teamId O ID da equipe.
   * @param petitionId O ID da petição.
   * @param tokensToDeduct A quantidade de tokens a ser deduzida.
   * @param chargedByUserId O ID do usuário (membro da equipe) que está realizando a ação.
   * @returns Objeto com status do sucesso, novo saldo (opcional), ID do proprietário (opcional) e erro (opcional).
   */
  async chargeTeamForPetition(
    teamId: string, 
    petitionId: string, 
    tokensToDeduct: number,
    chargedByUserId: string 
  ): Promise<{ success: boolean; newBalance?: number; error?: string; ownerId?: string }> {
    if (!teamId || !petitionId || tokensToDeduct <= 0 || !chargedByUserId) {
      const errorMsg = 'Parâmetros inválidos para chargeTeamForPetition.';
      console.error(errorMsg, { teamId, petitionId, tokensToDeduct, chargedByUserId });
      return { success: false, error: errorMsg };
    }

    try {
      console.log(`Invocando 'charge-team-for-petition' para teamId: ${teamId}, petitionId: ${petitionId}`);
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke('charge-team-for-petition', {
        body: { teamId, petitionId, tokensToDeduct, chargedByUserId },
      });

      if (functionError) {
        console.error(`Erro ao invocar charge-team-for-petition para teamId ${teamId}:`, functionError.message);
        const errorDetail = (functionError as any).context?.reason || (functionError as any).message || 'Falha ao cobrar tokens da equipe.';
        return { success: false, error: errorDetail };
      }

      if (functionResponse?.success) {
        console.log(`Cobrança para equipe ${teamId}, petição ${petitionId} bem-sucedida. Novo saldo do proprietário ${functionResponse.ownerId}: ${functionResponse.newBalance}`);
        
        // Atualizar o cache local após cobrança bem-sucedida
        this.updateTeamTokenCache(teamId, functionResponse.newBalance || 0);
        
        return { 
          success: true, 
          newBalance: functionResponse.newBalance, 
          ownerId: functionResponse.ownerId 
        };
      } else {
        const errorMessage = functionResponse?.error || 'Resposta inesperada ao cobrar tokens da equipe.';
        console.error(`Falha na cobrança (resposta não-sucesso) para equipe ${teamId}, petição ${petitionId}:`, errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Ocorreu um problema ao tentar cobrar tokens da equipe.';
      console.error(`Exceção em chargeTeamForPetition para teamId ${teamId}:`, error);
      return { success: false, error: errorMessage };
    }
  },
  
  // --- Funções de Pagamento e Assinatura (Stripe) ---

  async createCheckoutSession(tokensAmount: number, price: number) {
    try {
      console.log(`Invocando 'token-checkout' para ${tokensAmount} tokens, preço ${price}`);
      const { data, error } = await supabase.functions.invoke('token-checkout', {
        body: {
          tokensAmount,
          price
        }
      });
      
      if (error) {
        console.error('Erro ao invocar token-checkout:', error);
        toast.error('Erro ao Iniciar Compra', { description: error.message });
        throw error; // Relança para que o chamador possa tratar (ex: desabilitar botão de carregamento)
      }
      
      // Limpar cache para garantir que os novos valores sejam buscados após a compra
      this.clearAllTokenCache();
      
      return data;
    } catch (error) {
      console.error('Exceção em createCheckoutSession:', error);
      throw error;
    }
  },
  
  async getPaymentHistory(userId?: string) {
    try {
      console.log(`Invocando 'get-payment-history'${userId ? ` para userId: ${userId}` : ''}`);
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: userId ? { userId } : undefined
      });
      
      if (error) {
        console.error('Erro ao invocar get-payment-history:', error);
        toast.error('Erro ao Buscar Histórico', { description: error.message });
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Exceção em getPaymentHistory:', error);
      throw error;
    }
  },
  
  async openStripePortal() {
    try {
      console.log("Invocando 'stripe-portal'");
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      
      if (error) {
        console.error('Erro ao invocar stripe-portal:', error);
        toast.error('Erro ao Abrir Portal', { description: error.message });
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Exceção em openStripePortal:', error);
      throw error;
    }
  },

  /**
   * Valida se há tokens suficientes para criar uma petição.
   * @param creatingUserId ID do usuário que está criando a petição
   * @param defaultTeamId ID da equipe que será cobrada
   * @returns Objeto com informações sobre a validação
   */
  async validateTokensForPetition(
    creatingUserId: string,
    defaultTeamId: string
  ): Promise<{
    hasEnoughTokens: boolean;
    tokenCost: number;
    currentTeamTokens: number;
  }> {
    if (!defaultTeamId) {
      toast.error("Equipe padrão não fornecida para validação de tokens.");
      throw new Error("Equipe padrão não fornecida.");
    }
    
    try {
      // Tentar usar o serviço existente no petition/core
      return await import('@/services/petition/core/createPetition')
        .then(module => module.validateTokensForPetition(creatingUserId, defaultTeamId))
        .catch(error => {
          console.error("Erro ao importar validateTokensForPetition:", error);
          throw error;
        });
    } catch (error) {
      console.error("Erro ao validar tokens para petição:", error);
      throw error;
    }
  }
};

export default tokenService;

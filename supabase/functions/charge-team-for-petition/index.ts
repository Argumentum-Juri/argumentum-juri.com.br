
// supabase/functions/charge-team-for-petition/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { authenticateRequest, corsHeaders, createErrorResponse, createSuccessResponse } from '../_shared/auth.ts'

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[charge-team-for-petition] ${new Date().toISOString()} | ${step}${detailsStr}`);
};

interface PetitionChargeRequest {
  teamId: string;
  petitionId: string;
  tokensToDeduct: number;
  chargedByUserId: string;
}

serve(async (req) => {
  // Lidar com a requisição CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    logStep('🚀 Function execution started');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      logStep('❌ ERRO CRÍTICO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
      return createErrorResponse('Erro interno do servidor.', 500);
    }
    
    // Criar cliente Supabase com privilégios de administrador (service_role)
    const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Autenticar o usuário usando Go Auth
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      logStep('❌ ERRO: Falha na autenticação');
      return createErrorResponse('Usuário não autenticado ou token inválido.', 401);
    }

    const { userId: callingUserId } = authResult;
    logStep(`✅ Chamada autenticada pelo usuário: ${callingUserId}`);

    // 2. Validar os parâmetros da requisição
    const requestBody = await req.json();
    logStep('📋 Parâmetros recebidos', requestBody);
    
    const { teamId, petitionId, tokensToDeduct, chargedByUserId }: PetitionChargeRequest = requestBody;

    if (!teamId || typeof teamId !== 'string' ||
        !petitionId || typeof petitionId !== 'string' ||
        typeof tokensToDeduct !== 'number' || tokensToDeduct <= 0 ||
        !chargedByUserId || typeof chargedByUserId !== 'string') {
      logStep('❌ ERRO: Parâmetros da requisição inválidos', { teamId, petitionId, tokensToDeduct, chargedByUserId });
      return createErrorResponse('Parâmetros inválidos fornecidos para a cobrança.', 400);
    }
    logStep('✅ Parâmetros da requisição validados', { teamId, petitionId, tokensToDeduct, chargedByUserId });

    // 3. Verificar se o usuário chamador é membro da equipe
    logStep('🔍 Verificando se o usuário é membro da equipe', { userId: callingUserId, teamId });
    
    const { data: teamMember, error: memberCheckError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('user_id', callingUserId)
      .maybeSingle();

    if (memberCheckError) {
      logStep('❌ ERRO: Falha ao verificar associação do chamador à equipe', { details: memberCheckError.message });
      return createErrorResponse('Erro ao verificar permissão do chamador na equipe.', 500);
    }
    if (!teamMember) {
      logStep(`❌ ACESSO NEGADO: Usuário chamador ${callingUserId} não é membro da equipe ${teamId}`);
      return createErrorResponse('Acesso negado. O solicitante não é membro desta equipe.', 403);
    }
    logStep(`✅ Usuário chamador ${callingUserId} confirmado como membro da equipe ${teamId}`);

    // 4. Identificar o proprietário da equipe
    logStep('🔍 Buscando proprietário da equipe', { teamId });
    
    const { data: ownerMember, error: ownerError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('role', 'owner')
      .maybeSingle();

    if (ownerError || !ownerMember) {
      logStep('❌ ERRO: Proprietário da equipe não encontrado', { teamId, details: ownerError?.message });
      return createErrorResponse('Proprietário da equipe não encontrado. Verifique a configuração da equipe.', 404);
    }
    const ownerId = ownerMember.user_id;
    logStep(`✅ Proprietário da equipe ${teamId} identificado: ${ownerId}`);

    // 5. Buscar o saldo atual de tokens do proprietário
    logStep('💰 Buscando saldo atual de tokens do proprietário', { ownerId });
    
    const { data: ownerTokenData, error: ownerTokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', ownerId)
      .maybeSingle();

    if (ownerTokenError && ownerTokenError.code !== 'PGRST116') {
      logStep('❌ ERRO: Falha ao buscar saldo atual de tokens do proprietário', { ownerId, details: ownerTokenError.message });
      return createErrorResponse("Erro ao buscar saldo de tokens do proprietário da equipe.", 500);
    }
    
    const currentOwnerTokens = ownerTokenData?.tokens || 0;
    logStep(`💰 Saldo atual do proprietário ${ownerId}: ${currentOwnerTokens} tokens`);

    // 6. Verificar se o proprietário tem saldo suficiente
    if (currentOwnerTokens < tokensToDeduct) {
      logStep('❌ SALDO INSUFICIENTE', { ownerId, currentOwnerTokens, tokensToDeduct });
      return createErrorResponse(`Saldo de tokens insuficiente. Necessário: ${tokensToDeduct}, Disponível: ${currentOwnerTokens}`, 402);
    }

    // 7. Deduzir os tokens do saldo do proprietário
    const newBalanceForOwner = currentOwnerTokens - tokensToDeduct;
    logStep('💸 Deduzindo tokens', { currentBalance: currentOwnerTokens, tokensToDeduct, newBalance: newBalanceForOwner });
    
    if (ownerTokenError && ownerTokenError.code === 'PGRST116') {
      // Criar novo registro
      const { error: insertError } = await supabaseAdmin
        .from('user_tokens')
        .insert({
          user_id: ownerId,
          tokens: newBalanceForOwner,
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        logStep('❌ ERRO: Falha ao criar registro de tokens para o proprietário', { ownerId, details: insertError.message });
        return createErrorResponse("Erro ao criar registro de tokens para o proprietário da equipe.", 500);
      }
      logStep('✅ Novo registro de tokens criado', { ownerId, tokens: newBalanceForOwner });
    } else {
      // Atualizar registro existente
      const { error: updateTokenError } = await supabaseAdmin
        .from('user_tokens')
        .update({ tokens: newBalanceForOwner, updated_at: new Date().toISOString() })
        .eq('user_id', ownerId);

      if (updateTokenError) {
        logStep('❌ ERRO: Falha ao atualizar o saldo de tokens do proprietário', { ownerId, details: updateTokenError.message });
        return createErrorResponse("Erro ao deduzir tokens do proprietário da equipe.", 500);
      }
      logStep('✅ Saldo de tokens atualizado', { ownerId, newBalance: newBalanceForOwner });
    }

    // 8. Registrar a transação em `token_transactions`
    const transactionMetadata = {
      team_id: teamId,
      petition_id: petitionId,
      member_who_initiated_charge_id: chargedByUserId,
      calling_user_id: callingUserId,
      tokens_deducted: tokensToDeduct,
      balance_before: currentOwnerTokens,
      balance_after: newBalanceForOwner
    };
    
    logStep('📝 Registrando transação', transactionMetadata);
    
    const { error: transactionInsertError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        user_id: ownerId,
        transaction_type: 'petition_creation_team',
        amount: -tokensToDeduct,
        metadata: transactionMetadata,
        description: `Criação de petição ${petitionId} pela equipe ${teamId} - ${tokensToDeduct} tokens`
      });

    if (transactionInsertError) {
      logStep('⚠️ AVISO CRÍTICO: Falha ao registrar a transação de tokens, MAS OS TOKENS FORAM DEDUZIDOS', { 
        ownerId, petitionId, details: transactionInsertError.message 
      });
    } else {
      logStep('✅ Transação de tokens registrada com sucesso', { ownerId, petitionId, amount: -tokensToDeduct });
    }

    // 9. Retornar sucesso
    const successResponse = { 
        success: true, 
        message: 'Tokens deduzidos com sucesso da conta do proprietário da equipe.',
        ownerId: ownerId,
        newBalance: newBalanceForOwner,
        tokensDeducted: tokensToDeduct,
        transactionRecorded: !transactionInsertError
    };
    
    logStep('🎉 Cobrança concluída com sucesso', successResponse);
    
    return createSuccessResponse(successResponse);

  } catch (e) {
    logStep('💥 ERRO GERAL INESPERADO na Edge Function:', { errorMessage: e.message, errorStack: e.stack });
    return createErrorResponse('Ocorreu um erro interno inesperado no servidor.', 500);
  }
});

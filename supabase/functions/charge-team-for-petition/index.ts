
// supabase/functions/charge-team-for-petition/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Ou a versão mais recente do std
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4' // Use sua versão instalada

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Considere restringir em produção
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Apenas POST é necessário para esta função
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  // Adicionando um timestamp mais legível e identificador da função
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
    logStep('Function execution started.');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      logStep('ERRO CRÍTICO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
      // Não retorne o erro de configuração ao cliente por segurança.
      return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
      });
    }
    // Criar cliente Supabase com privilégios de administrador (service_role)
    const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // 1. Autenticar o usuário que está fazendo a chamada (o chamador)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERRO: Cabeçalho de autorização ausente.');
      return new Response(JSON.stringify({ error: 'Autenticação é obrigatória.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !callingUser) {
      logStep('ERRO: Falha na autenticação do usuário chamador.', { details: authError?.message });
      return new Response(JSON.stringify({ error: 'Usuário não autenticado ou token inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }
    logStep(`Chamada autenticada pelo usuário: ${callingUser.id}`);

    // 2. Validar os parâmetros da requisição
    const { teamId, petitionId, tokensToDeduct, chargedByUserId }: PetitionChargeRequest = await req.json();

    if (!teamId || typeof teamId !== 'string' ||
        !petitionId || typeof petitionId !== 'string' ||
        typeof tokensToDeduct !== 'number' || tokensToDeduct <= 0 ||
        !chargedByUserId || typeof chargedByUserId !== 'string') {
      logStep('ERRO: Parâmetros da requisição inválidos.', { teamId, petitionId, tokensToDeduct, chargedByUserId });
      return new Response(JSON.stringify({ error: 'Parâmetros inválidos fornecidos para a cobrança.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400, // Bad Request
      });
    }
    logStep('Parâmetros da requisição validados.', { teamId, petitionId, tokensToDeduct, chargedByUserId });

    // 3. Verificar se o usuário chamador (callingUser.id) é membro da teamId.
    //    Isso garante que apenas um membro da equipe possa iniciar uma ação que custe tokens para a equipe.
    const { data: teamMember, error: memberCheckError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('user_id', callingUser.id) // Verifica se o usuário que fez a chamada à API é membro
      .maybeSingle();

    if (memberCheckError) {
      logStep('ERRO: Falha ao verificar associação do chamador à equipe.', { details: memberCheckError.message });
      throw new Error('Erro ao verificar permissão do chamador na equipe.'); // Será pego pelo catch geral
    }
    if (!teamMember) {
      logStep(`ACESSO NEGADO: Usuário chamador ${callingUser.id} não é membro da equipe ${teamId}.`);
      return new Response(JSON.stringify({ error: 'Acesso negado. O solicitante não é membro desta equipe.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403, // Forbidden
      });
    }
    logStep(`Usuário chamador ${callingUser.id} confirmado como membro da equipe ${teamId}.`);

    // 4. Identificar o proprietário (owner) da equipe (teamId)
    const { data: ownerMember, error: ownerError } = await supabaseAdmin
      .from('team_members')
      .select('user_id') // ID do usuário proprietário
      .eq('team_id', teamId)
      .eq('role', 'owner') // Assumindo que o papel do proprietário é 'owner'
      .maybeSingle(); // Deve haver apenas um proprietário por equipe ou use .limit(1).single()

    if (ownerError || !ownerMember) {
      logStep('ERRO: Proprietário da equipe não encontrado ou erro na busca.', { teamId, details: ownerError?.message });
      // Informar que a equipe pode não ter um proprietário configurado corretamente.
      return new Response(JSON.stringify({ error: 'Proprietário da equipe não encontrado. Verifique a configuração da equipe.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404, // Not Found
      });
    }
    const ownerId = ownerMember.user_id;
    logStep(`Proprietário da equipe ${teamId} identificado como: ${ownerId}.`);

    // 5. Buscar o saldo atual de tokens do proprietário
    const { data: ownerTokenData, error: ownerTokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', ownerId)
      .maybeSingle(); // Alterado de single() para maybeSingle() para evitar o erro PGRST116

    // Verificar se há erro diferente de "no rows found"
    if (ownerTokenError && ownerTokenError.code !== 'PGRST116') {
      logStep('ERRO: Falha ao buscar saldo atual de tokens do proprietário.', { ownerId, details: ownerTokenError.message });
      throw new Error("Erro ao buscar saldo de tokens do proprietário da equipe.");
    }
    
    const currentOwnerTokens = ownerTokenData?.tokens || 0;
    logStep(`Saldo atual do proprietário ${ownerId}: ${currentOwnerTokens} tokens.`);

    // 6. Verificar se o proprietário tem saldo suficiente
    if (currentOwnerTokens < tokensToDeduct) {
      logStep('ERRO: Saldo de tokens do proprietário da equipe insuficiente.', { ownerId, currentOwnerTokens, tokensToDeduct });
      return new Response(JSON.stringify({ error: 'Saldo de tokens do proprietário da equipe é insuficiente.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402, // Payment Required
      });
    }

    // 7. Deduzir os tokens do saldo do proprietário
    const newBalanceForOwner = currentOwnerTokens - tokensToDeduct;
    
    // Se não existir registro na tabela user_tokens, precisamos criar um
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
        logStep('ERRO: Falha ao criar registro de tokens para o proprietário.', { ownerId, details: insertError.message });
        throw new Error("Erro ao criar registro de tokens para o proprietário da equipe.");
      }
    } else {
      // Atualizar registro existente
      const { error: updateTokenError } = await supabaseAdmin
        .from('user_tokens')
        .update({ tokens: newBalanceForOwner, updated_at: new Date().toISOString() })
        .eq('user_id', ownerId);

      if (updateTokenError) {
        logStep('ERRO: Falha ao atualizar o saldo de tokens do proprietário.', { ownerId, details: updateTokenError.message });
        throw new Error("Erro ao deduzir tokens do proprietário da equipe.");
      }
    }
    
    logStep(`Tokens deduzidos com sucesso. Novo saldo para proprietário ${ownerId}: ${newBalanceForOwner}.`);

    // 8. Registrar a transação em `token_transactions`
    const transactionMetadata = {
      team_id: teamId,
      petition_id: petitionId,
      member_who_initiated_charge_id: chargedByUserId, // Quem da equipe realmente fez a ação
      calling_user_id: callingUser.id, // Quem autenticou esta chamada de API
      tokens_deducted: tokensToDeduct,
      balance_before: currentOwnerTokens,
      balance_after: newBalanceForOwner
    };
    const { error: transactionInsertError } = await supabaseAdmin
      .from('token_transactions')
      .insert({
        user_id: ownerId, // A transação é na conta do proprietário
        transaction_type: 'petition_creation_team', // Tipo específico para esta ação
        amount: -tokensToDeduct, // Valor negativo para indicar uma dedução
        metadata: transactionMetadata,
        // created_at é definido por default no banco
      });

    if (transactionInsertError) {
      // Este é um problema sério: os tokens foram deduzidos, mas a transação não foi registrada.
      // Idealmente, a dedução e o log da transação deveriam estar em uma transação de banco de dados.
      // Por enquanto, apenas logamos como um aviso crítico.
      logStep('AVISO CRÍTICO: Falha ao registrar a transação de tokens, MAS OS TOKENS FORAM DEDUZIDOS.', { ownerId, petitionId, details: transactionInsertError.message });
      // Não retorne um erro ao cliente neste ponto, pois a cobrança principal foi bem-sucedida.
      // A falha no log é um problema interno a ser investigado.
    } else {
      logStep('Transação de tokens registrada com sucesso.', { ownerId, petitionId, amount: -tokensToDeduct });
    }

    // 9. Retornar sucesso
    return new Response(JSON.stringify({ 
        success: true, 
        message: 'Tokens deduzidos com sucesso da conta do proprietário da equipe.',
        ownerId: ownerId,
        newBalance: newBalanceForOwner,
        tokensDeducted: tokensToDeduct
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (e) {
    // Captura qualquer erro não tratado nos blocos try/catch anteriores
    logStep('ERRO GERAL INESPERADO na Edge Function:', { errorMessage: e.message, errorStack: e.stack });
    // Não exponha detalhes do erro ao cliente em produção por segurança
    return new Response(JSON.stringify({ error: 'Ocorreu um erro interno inesperado no servidor.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

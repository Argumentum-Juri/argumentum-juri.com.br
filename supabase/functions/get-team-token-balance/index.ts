
// supabase/functions/get-team-token-balance/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[get-team-token-balance] ${new Date().toISOString()} | ${step}${detailsStr}`);
};

// Função para verificar JWT customizado do Go Auth
async function verifyGoAuthJWT(token: string) {
  try {
    const JWT_SECRET = Deno.env.get('JWT_SECRET');
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado');
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const payload = await verify(token, key);
    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logStep('Function started');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      logStep('ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
      throw new Error('Configuração do servidor Supabase incompleta.');
    }
    const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERRO: Cabeçalho de autorização ausente.');
      return new Response(JSON.stringify({ error: 'Autenticação necessária.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Verificar o JWT customizado do Go Auth
    const payload = await verifyGoAuthJWT(jwt);
    
    if (!payload || !payload.sub) {
      logStep('ERRO: Falha na autenticação do usuário - token Go Auth inválido.');
      return new Response(JSON.stringify({ error: 'Token de autenticação inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const requestingUserId = payload.sub as string;
    logStep(`Usuário solicitante verificado via Go Auth: ${requestingUserId}`);

    const { teamId } = await req.json();
    if (!teamId || typeof teamId !== 'string') {
      logStep('ERRO: teamId ausente ou inválido no corpo da requisição.');
      return new Response(JSON.stringify({ error: 'teamId é obrigatório e deve ser uma string.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }
    logStep(`Requisição para teamId: ${teamId}`);

    // 1. Verificar se o usuário solicitante é membro da teamId
    const { data: teamMember, error: memberCheckError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('user_id', requestingUserId)
      .maybeSingle();

    if (memberCheckError) {
      logStep('ERRO: Falha ao verificar associação à equipe.', { memberCheckError });
      throw new Error('Erro ao verificar permissão na equipe.');
    }
    if (!teamMember) {
      logStep(`ACESSO NEGADO: Usuário ${requestingUserId} não é membro da equipe ${teamId}.`);
      return new Response(JSON.stringify({ error: 'Acesso negado. Você não é membro desta equipe.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      });
    }
    logStep(`Usuário ${requestingUserId} é membro da equipe ${teamId}.`);

    // 2. Encontrar o proprietário (owner) da teamId
    const { data: ownerMember, error: ownerError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('role', 'owner')
      .maybeSingle();

    if (ownerError || !ownerMember) {
      logStep('ERRO: Proprietário da equipe não encontrado.', { ownerError, teamId });
      throw new Error('Proprietário da equipe não encontrado ou erro ao buscar.');
    }
    const ownerId = ownerMember.user_id;
    logStep(`Proprietário da equipe ${teamId} é ${ownerId}.`);

    // 3. Buscar o saldo de tokens do proprietário na tabela `user_tokens`
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', ownerId)
      .single(); // Assumindo um único registro de tokens por usuário

    if (tokenError && tokenError.code !== 'PGRST116') { // PGRST116: no rows found
      logStep('ERRO: Falha ao buscar saldo de tokens do proprietário.', { tokenError, ownerId });
      throw new Error("Erro ao buscar saldo de tokens do proprietário da equipe.");
    }
    if (tokenError && tokenError.code === 'PGRST116') { // Proprietário não tem registro de tokens
        logStep(`Proprietário ${ownerId} não possui registro de tokens.`);
        return new Response(JSON.stringify({ tokens: 0 }), { // Retorna 0 se não houver registro
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
        });
    }

    const teamTokens = tokenData?.tokens || 0;
    logStep(`Saldo de tokens da equipe (proprietário ${ownerId}): ${teamTokens}.`);

    return new Response(JSON.stringify({ tokens: teamTokens }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (e) {
    logStep('ERRO GERAL na Edge Function:', { errorMessage: e.message, errorStack: e.stack });
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});

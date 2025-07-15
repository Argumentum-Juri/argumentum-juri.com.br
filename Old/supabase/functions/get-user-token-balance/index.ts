// supabase/functions/get-user-token-balance/index.ts
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
  console.log(`[get-user-token-balance] ${new Date().toISOString()} | ${step}${detailsStr}`);
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

    const userId = payload.sub as string;
    logStep(`Usuário autenticado: ${userId}`);

    // Buscar o saldo de tokens do usuário na tabela `user_tokens`
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', userId)
      .single();

    if (tokenError && tokenError.code !== 'PGRST116') { // PGRST116: no rows found
      logStep('ERRO: Falha ao buscar saldo de tokens do usuário.', { tokenError, userId });
      throw new Error("Erro ao buscar saldo de tokens do usuário.");
    }
    
    if (tokenError && tokenError.code === 'PGRST116') { // Usuário não tem registro de tokens
      logStep(`Usuário ${userId} não possui registro de tokens. Criando registro inicial.`);
      
      // Criar registro inicial com 0 tokens
      const { data: newTokenData, error: createError } = await supabaseAdmin
        .from('user_tokens')
        .insert({ user_id: userId, tokens: 0 })
        .select('tokens')
        .single();
        
      if (createError) {
        logStep('ERRO: Falha ao criar registro inicial de tokens.', { createError, userId });
        throw new Error("Erro ao criar registro de tokens do usuário.");
      }
      
      logStep(`Registro de tokens criado para usuário ${userId} com 0 tokens.`);
      return new Response(JSON.stringify({ tokens: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }

    const userTokens = tokenData?.tokens || 0;
    logStep(`Saldo de tokens do usuário ${userId}: ${userTokens}.`);

    return new Response(JSON.stringify({ tokens: userTokens }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (e) {
    logStep('ERRO GERAL na Edge Function:', { errorMessage: e.message, errorStack: e.stack });
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
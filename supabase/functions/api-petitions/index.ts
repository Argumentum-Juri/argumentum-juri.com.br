import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

// CORS headers atualizados incluindo x-client-info
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, accept, cache-control, x-requested-with, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'false'
};

console.log('[API-PETITIONS] 🚀 === INICIALIZAÇÃO DA FUNÇÃO ===');

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[API-PETITIONS] ${new Date().toISOString()} | ${step}${detailsStr}`);
};

// Constante para o custo da petição
const PETITION_COST = 16;

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

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[API-PETITIONS] ✅ CORS preflight');
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    logStep('Function started');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      logStep('ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
      throw new Error('Configuração do servidor Supabase incompleta.');
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

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
    const isAdmin = payload.is_admin || false;
    logStep(`Usuário autenticado via Go Auth: ${userId}, Admin: ${isAdmin}`);

    // Buscar equipes do usuário
    const { data: userTeams } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);
    
    const teamIds = userTeams?.map(t => t.team_id) || [];

    const auth = {
      userId,
      isAdmin,
      teamIds
    };

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const petitionId = pathParts[pathParts.length - 1];

    switch (req.method) {
      case 'GET':
        if (petitionId && petitionId !== 'api-petitions') {
          return await getPetitionById(petitionId, auth, supabaseAdmin);
        } else {
          return await getPetitions(url.searchParams, auth, supabaseAdmin);
        }
      
      case 'POST':
        return await createPetition(req, auth, supabaseAdmin);
      
      case 'PUT':
        if (!petitionId || petitionId === 'api-petitions') {
          return new Response(
            JSON.stringify({ error: 'ID da petição é obrigatório' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        return await updatePetition(petitionId, req, auth, supabaseAdmin);
      
      case 'DELETE':
        if (!petitionId || petitionId === 'api-petitions') {
          return new Response(
            JSON.stringify({ error: 'ID da petição é obrigatório' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        return await deletePetition(petitionId, auth, supabaseAdmin);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Método não permitido' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('[API-PETITIONS] 🔥 Erro na API de petições:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function getPetitions(params: URLSearchParams, auth: any, supabaseAdmin: any) {
  const page = parseInt(params.get('page') || '1');
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100);
  const status = params.get('status');
  const sortDirection = params.get('sortDirection') || 'desc';
  
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('petitions')
    .select(`
      id, title, description, legal_area, petition_type, 
      status, created_at, updated_at, user_id, team_id,
      user:user_id(id, name, email, avatar_url)
    `, { count: 'exact' });

  // Filtrar por usuário/equipes se não for admin
  if (!auth.isAdmin) {
    const userAndTeamIds = [auth.userId, ...auth.teamIds];
    query = query.or(`user_id.eq.${auth.userId},team_id.in.(${auth.teamIds.join(',')})`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: sortDirection === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[API-PETITIONS] ❌ Erro ao buscar petições:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar petições' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(JSON.stringify({
    data: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function getPetitionById(id: string, auth: any, supabaseAdmin: any) {
  let query = supabaseAdmin
    .from('petitions')
    .select(`
      id, title, description, legal_area, petition_type, has_process,
      process_number, status, created_at, updated_at, user_id, team_id,
      form_answers,
      user:user_id(id, name, email, avatar_url)
    `)
    .eq('id', id);

  const { data: petition, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Petição não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Erro ao buscar petição' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Verificar permissões
  const hasAccess = auth.isAdmin || 
                   petition.user_id === auth.userId || 
                   (petition.team_id && auth.teamIds.includes(petition.team_id));

  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Sem permissão para acessar esta petição' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Buscar anexos, comentários e documentos
  const [attachmentsResult, commentsResult, documentsResult] = await Promise.allSettled([
    supabaseAdmin
      .from('petition_attachments')
      .select('*')
      .eq('petition_id', id),
    supabaseAdmin
      .from('petition_comments')
      .select('id, petition_id, author_id, content, created_at, updated_at')
      .eq('petition_id', id),
    supabaseAdmin
      .from('petition_documents')
      .select('*')
      .eq('petition_id', id)
      .order('created_at', { ascending: false })
  ]);

  const attachments = attachmentsResult.status === 'fulfilled' ? attachmentsResult.value.data || [] : [];
  const comments = commentsResult.status === 'fulfilled' ? commentsResult.value.data || [] : [];
  const documents = documentsResult.status === 'fulfilled' ? documentsResult.value.data || [] : [];

  return new Response(JSON.stringify({
    ...petition,
    attachments,
    comments,
    petition_documents: documents
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function createPetition(req: Request, auth: any, supabaseAdmin: any) {
  try {
    logStep('🔍 Iniciando createPetition');
    
    // Verificar o content-type
    const contentType = req.headers.get('content-type');
    logStep('📋 Content-Type recebido', { contentType });

    let body;
    try {
      const rawBody = await req.text();
      logStep('📄 Raw body recebido', { length: rawBody.length, preview: rawBody.substring(0, 200) });
      
      if (!rawBody.trim()) {
        logStep('❌ Body vazio recebido');
        return new Response(
          JSON.stringify({ error: 'Dados da petição não fornecidos' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      body = JSON.parse(rawBody);
      logStep('✅ JSON parseado com sucesso', { keys: Object.keys(body || {}) });
    } catch (parseError) {
      logStep('❌ Erro ao parsear JSON', { error: parseError.message });
      return new Response(
        JSON.stringify({ error: 'Dados inválidos fornecidos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar dados obrigatórios
    if (!body.title || typeof body.title !== 'string') {
      logStep('❌ Campo title inválido', { title: body.title });
      return new Response(
        JSON.stringify({ error: 'Título é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body.team_id || typeof body.team_id !== 'string') {
      logStep('❌ Campo team_id inválido', { team_id: body.team_id });
      return new Response(
        JSON.stringify({ error: 'ID da equipe é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 1. Verificar se o usuário é membro da equipe
    const { data: teamMember, error: memberCheckError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', body.team_id)
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (memberCheckError) {
      logStep('ERRO: Falha ao verificar associação à equipe', { memberCheckError });
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissão na equipe' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!teamMember) {
      logStep(`ACESSO NEGADO: Usuário ${auth.userId} não é membro da equipe ${body.team_id}`);
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Você não é membro desta equipe.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Encontrar o proprietário (owner) da equipe
    const { data: ownerMember, error: ownerError } = await supabaseAdmin
      .from('team_members')
      .select('user_id')
      .eq('team_id', body.team_id)
      .eq('role', 'owner')
      .maybeSingle();

    if (ownerError || !ownerMember) {
      logStep('ERRO: Proprietário da equipe não encontrado', { ownerError, teamId: body.team_id });
      return new Response(
        JSON.stringify({ error: 'Proprietário da equipe não encontrado' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ownerId = ownerMember.user_id;
    logStep(`Proprietário da equipe ${body.team_id} é ${ownerId}`);

    // 3. Verificar saldo de tokens do proprietário
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('tokens')
      .eq('user_id', ownerId)
      .maybeSingle();

    if (tokenError && tokenError.code !== 'PGRST116') {
      logStep('ERRO: Falha ao buscar saldo de tokens', { tokenError, ownerId });
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar saldo de tokens' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const currentTokens = tokenData?.tokens || 0;
    logStep(`Saldo atual de tokens: ${currentTokens}, Custo: ${PETITION_COST}`);

    // 4. Validar se há tokens suficientes
    if (currentTokens < PETITION_COST) {
      logStep(`SALDO INSUFICIENTE: ${currentTokens} < ${PETITION_COST}`);
      return new Response(
        JSON.stringify({ 
          error: `Saldo insuficiente. Você precisa de ${PETITION_COST} tokens mas possui ${currentTokens}.` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Preparar dados para inserção
    const petitionData = {
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : '',
      legal_area: body.legal_area ? String(body.legal_area).trim() : null,
      petition_type: body.petition_type ? String(body.petition_type).trim() : null,
      has_process: Boolean(body.has_process),
      process_number: body.has_process && body.process_number ? String(body.process_number).trim() : null,
      target: body.target ? String(body.target).trim() : null,
      form_answers: body.form_answers && typeof body.form_answers === 'object' ? body.form_answers : {},
      content: body.content ? String(body.content).trim() : '',
      category: body.category ? String(body.category).trim() : null,
      form_type: body.form_type ? String(body.form_type).trim() : null,
      form_schema: body.form_schema ? String(body.form_schema).trim() : null,
      team_id: body.team_id,
      user_id: auth.userId,
      status: 'pending'
    };

    logStep('📝 Dados preparados para inserção', { 
      title: petitionData.title,
      team_id: petitionData.team_id,
      user_id: petitionData.user_id,
      has_process: petitionData.has_process,
      form_answers_keys: Object.keys(petitionData.form_answers || {})
    });

    // 5. Inserir petição
    const { data: petition, error: petitionError } = await supabaseAdmin
      .from('petitions')
      .insert(petitionData)
      .select()
      .single();

    if (petitionError) {
      logStep('❌ Erro ao inserir petição no banco', { 
        code: petitionError.code, 
        message: petitionError.message,
        details: petitionError.details,
        hint: petitionError.hint
      });
      return new Response(
        JSON.stringify({ error: 'Erro ao criar petição no banco de dados' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logStep('✅ Petição criada com sucesso', { petitionId: petition.id });

    // 6. Registrar a transação de token (débito) - O trigger cuidará da atualização do saldo automaticamente
    const transactionData = {
      user_id: ownerId,
      amount: -PETITION_COST,
      transaction_type: 'petition_creation',
      description: `Criação de petição: ${petition.title}`,
      petition_id: petition.id,
      team_id: body.team_id,
      metadata: {
        petition_id: petition.id,
        created_by: auth.userId,
        cost: PETITION_COST,
        team_id: body.team_id
      }
    };

    logStep('💰 Registrando transação de token (trigger atualizou saldo automaticamente)', { transactionData });

    const { error: transactionError } = await supabaseAdmin
      .from('token_transactions')
      .insert(transactionData);

    if (transactionError) {
      logStep('❌ Erro ao inserir transação de token', { 
        error: transactionError,
        code: transactionError.code,
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
        transactionData
      });
      
      // Tentar reverter a criação da petição
      await supabaseAdmin
        .from('petitions')
        .delete()
        .eq('id', petition.id);

      return new Response(
        JSON.stringify({ 
          error: 'Erro ao registrar transação de tokens',
          details: transactionError
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    logStep('💰 Transação registrada com sucesso - trigger atualizou saldo automaticamente');

    return new Response(JSON.stringify(petition), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logStep('💥 Erro geral em createPetition', { 
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function updatePetition(id: string, req: Request, auth: any, supabaseAdmin: any) {
  const body = await req.json();
  
  // Verificar se o usuário pode editar esta petição
  const { data: petition } = await supabaseAdmin
    .from('petitions')
    .select('user_id, team_id')
    .eq('id', id)
    .single();

  if (!petition) {
    return new Response(
      JSON.stringify({ error: 'Petição não encontrada' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const hasAccess = auth.isAdmin || 
                   petition.user_id === auth.userId || 
                   (petition.team_id && auth.teamIds.includes(petition.team_id));

  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Sem permissão para editar esta petição' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('petitions')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[API-PETITIONS] ❌ Erro ao atualizar petição:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao atualizar petição' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function deletePetition(id: string, auth: any, supabaseAdmin: any) {
  // Verificar permissões primeiro
  const { data: petition } = await supabaseAdmin
    .from('petitions')
    .select('user_id, team_id')
    .eq('id', id)
    .single();

  if (!petition) {
    return new Response(
      JSON.stringify({ error: 'Petição não encontrada' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const hasAccess = auth.isAdmin || petition.user_id === auth.userId;

  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: 'Sem permissão para deletar esta petição' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const { error } = await supabaseAdmin
    .from('petitions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[API-PETITIONS] ❌ Erro ao deletar petição:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao deletar petição' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Registra o handler no runtime Deno
console.log('[API-PETITIONS] 🎬 Iniciando servidor HTTP da Edge Function');
serve(handler);

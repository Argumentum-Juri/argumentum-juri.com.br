
import { authenticateRequest, corsHeaders, createErrorResponse, createSuccessResponse, supabaseAdmin } from '../_shared/auth.ts';

// Atualizar os headers CORS para incluir Cache-Control
const corsHeadersExtended = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeadersExtended });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return createErrorResponse('Não autorizado', 401);
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const teamId = pathParts[pathParts.length - 1];

    let response;
    switch (req.method) {
      case 'GET':
        if (teamId && teamId !== 'api-teams') {
          response = await getTeamById(teamId, auth);
        } else {
          response = await getUserTeams(auth);
        }
        break;
      
      case 'POST':
        response = await createTeam(req, auth);
        break;
      
      case 'PUT':
        if (!teamId || teamId === 'api-teams') {
          return createErrorResponse('ID da equipe é obrigatório');
        }
        response = await updateTeam(teamId, req, auth);
        break;
      
      case 'DELETE':
        if (!teamId || teamId === 'api-teams') {
          return createErrorResponse('ID da equipe é obrigatório');
        }
        response = await deleteTeam(teamId, auth);
        break;
      
      default:
        return createErrorResponse('Método não permitido', 405);
    }

    // Adicionar headers CORS à resposta final
    Object.entries(corsHeadersExtended).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Erro na API de equipes:', error);
    const errorResponse = createErrorResponse('Erro interno do servidor', 500);
    
    // Adicionar headers CORS mesmo em caso de erro
    Object.entries(corsHeadersExtended).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    
    return errorResponse;
  }
});

async function getUserTeams(auth: any) {
  const { data: teamMemberships, error } = await supabaseAdmin
    .from('team_members')
    .select(`
      team_id,
      role,
      teams:team_id (
        id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', auth.userId);

  if (error) {
    console.error('Erro ao buscar equipes:', error);
    return createErrorResponse('Erro ao buscar equipes');
  }

  return createSuccessResponse(teamMemberships || []);
}

async function getTeamById(id: string, auth: any) {
  // Verificar se o usuário é membro da equipe
  const { data: membership } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', auth.userId)
    .single();

  if (!membership && !auth.isAdmin) {
    return createErrorResponse('Sem permissão para acessar esta equipe', 403);
  }

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse('Equipe não encontrada', 404);
    }
    return createErrorResponse('Erro ao buscar equipe');
  }

  // Buscar membros da equipe
  const { data: members } = await supabaseAdmin
    .from('team_members')
    .select(`
      id,
      role,
      created_at,
      profiles:user_id (
        id,
        name,
        email,
        avatar_url
      )
    `)
    .eq('team_id', id);

  return createSuccessResponse({
    ...team,
    members: members || []
  });
}

async function createTeam(req: Request, auth: any) {
  const body = await req.json();
  
  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .insert({})
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar equipe:', error);
    return createErrorResponse('Erro ao criar equipe');
  }

  // Adicionar o usuário como proprietário
  const { error: memberError } = await supabaseAdmin
    .from('team_members')
    .insert({
      team_id: team.id,
      user_id: auth.userId,
      role: 'owner'
    });

  if (memberError) {
    console.error('Erro ao adicionar membro:', memberError);
    // Limpar a equipe criada em caso de erro
    await supabaseAdmin.from('teams').delete().eq('id', team.id);
    return createErrorResponse('Erro ao configurar equipe');
  }

  return createSuccessResponse(team);
}

async function updateTeam(id: string, req: Request, auth: any) {
  const body = await req.json();
  
  // Verificar permissões (proprietário ou admin)
  const { data: membership } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', auth.userId)
    .single();

  if (!auth.isAdmin && (!membership || membership.role !== 'owner')) {
    return createErrorResponse('Sem permissão para editar esta equipe', 403);
  }

  const { data, error } = await supabaseAdmin
    .from('teams')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar equipe:', error);
    return createErrorResponse('Erro ao atualizar equipe');
  }

  return createSuccessResponse(data);
}

async function deleteTeam(id: string, auth: any) {
  // Verificar permissões (proprietário ou admin)
  const { data: membership } = await supabaseAdmin
    .from('team_members')
    .select('role')
    .eq('team_id', id)
    .eq('user_id', auth.userId)
    .single();

  if (!auth.isAdmin && (!membership || membership.role !== 'owner')) {
    return createErrorResponse('Sem permissão para deletar esta equipe', 403);
  }

  const { error } = await supabaseAdmin
    .from('teams')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar equipe:', error);
    return createErrorResponse('Erro ao deletar equipe');
  }

  return createSuccessResponse({ success: true });
}

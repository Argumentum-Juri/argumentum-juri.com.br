
import { authenticateRequest, corsHeaders, createErrorResponse, createSuccessResponse, supabaseAdmin } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return createErrorResponse('Não autorizado', 401);
    }

    switch (req.method) {
      case 'GET':
        return await getProfile(auth);
      
      case 'PUT':
        return await updateProfile(req, auth);
      
      default:
        return createErrorResponse('Método não permitido', 405);
    }
  } catch (error) {
    console.error('Erro na API de perfil:', error);
    return createErrorResponse('Erro interno do servidor', 500);
  }
});

async function getProfile(auth: any) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, name, email, avatar_url, oab_number, person_type, document,
      address, city, state, zip_code, phone, office_areas, delegation_areas,
      team_size, purchase_reason, delegation_intent, choice_reason,
      social_media, is_admin, terms_accepted, terms_accepted_at,
      created_at, updated_at
    `)
    .eq('id', auth.userId)
    .single();

  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return createErrorResponse('Erro ao buscar perfil');
  }

  return createSuccessResponse(data);
}

async function updateProfile(req: Request, auth: any) {
  const body = await req.json();
  
  // Remover campos que não devem ser editados pelo usuário
  const { id, is_admin, created_at, updated_at, ...updateData } = body;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', auth.userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar perfil:', error);
    return createErrorResponse('Erro ao atualizar perfil');
  }

  return createSuccessResponse(data);
}

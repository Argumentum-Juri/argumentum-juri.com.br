
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-jwt-secret-key';

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AuthenticatedRequest {
  userId: string;
  isAdmin: boolean;
  teamIds: string[];
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

// Função para verificar JWT customizado
export async function verifyCustomJWT(token: string) {
  try {
    console.log(`[auth] 🔍 Verificando JWT customizado...`);
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const payload = await verify(token, key);
    console.log(`[auth] ✅ JWT verificado com sucesso - payload:`, payload);
    return payload;
  } catch (error) {
    console.error('[auth] ❌ JWT verification failed:', error);
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedRequest | null> {
  try {
    console.log(`[auth] 🚀 Iniciando autenticação...`);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log(`[auth] ❌ Nenhum header Authorization encontrado`);
      return null;
    }

    console.log(`[auth] 🔑 Header Authorization encontrado: ${authHeader.substring(0, 20)}...`);

    const token = authHeader.replace('Bearer ', '');
    
    // Verificar o JWT customizado
    const payload = await verifyCustomJWT(token);
    
    if (!payload || !payload.sub) {
      console.log(`[auth] ❌ Payload inválido ou sem sub`);
      return null;
    }

    const userId = payload.sub as string;
    console.log(`[auth] 👤 User ID extraído: ${userId}`);

    // Buscar informações do perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`[auth] ❌ Erro ao buscar perfil:`, profileError);
      // Não falhar se não encontrar o perfil, assumir usuário normal
    }

    // Buscar equipes do usuário
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (teamError) {
      console.error(`[auth] ⚠️ Erro ao buscar equipes:`, teamError);
    }

    const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
    const isAdmin = profile?.is_admin || false;

    console.log(`[auth] ✅ Autenticação concluída - User: ${userId}, Admin: ${isAdmin}, Teams: ${teamIds.length}`);

    return {
      userId,
      isAdmin,
      teamIds
    };
  } catch (error) {
    console.error(`[auth] 💥 Erro crítico na autenticação:`, error);
    return null;
  }
}

export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Alias para compatibilidade com importações existentes
export const verifyGoToken = verifyCustomJWT;

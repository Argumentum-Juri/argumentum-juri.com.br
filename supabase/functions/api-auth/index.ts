// api-auth.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const SUPABASE_URL           = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY')!;
const JWT_SECRET             = Deno.env.get('JWT_SECRET')!;

// cliente administrativo (service role) e cliente público (anon)
const supabaseAdmin  = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/** CORS dinâmico p/ *.lovable.app (ajustar se necessário) */
function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = /\.lovable\.app$/.test(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, accept, cache-control, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
  };
}

// Geração e verificação de JWTs
async function createAccessToken(userId: string, email: string, isAdmin = false) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const payload = {
    sub: userId,
    email,
    is_admin: isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    scope: 'access'
  };
  return await create({ alg: 'HS256', typ: 'JWT' }, payload, key);
}

async function createRefreshToken(userId: string, email: string, isAdmin = false) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const payload = {
    sub: userId,
    email,
    is_admin: isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
    scope: 'refresh'
  };
  return await create({ alg: 'HS256', typ: 'JWT' }, payload, key);
}

async function verifyRefreshToken(token: string) {
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );
    const payload: any = await verify(token, key);
    if (payload.scope !== 'refresh') throw new Error('Not a refresh token');
    return payload;
  } catch {
    return null;
  }
}

// Handler principal
export default async function handler(req: Request) {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: cors });
  }

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop() || '';

  try {
    switch (endpoint) {
      case 'test':           return await handleTest(req, cors);
      case 'login':          return await handleLogin(req, cors);
      case 'register':       return await handleRegister(req, cors);
      case 'logout':         return await handleLogout(req, cors);
      case 'refresh':        return await handleRefresh(req, cors);
      case 'reset-password': return await handleResetPassword(req, cors);
      case 'verify':         return await handleVerify(req, cors);
      case 'subscription':   return await handleSubscription(req, cors);
      default:
        return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), {
          status: 404,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Erro interno', details: err.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
}

// ————————————— HANDLERS ————————————— //

async function handleTest(req: Request, cors: Record<string,string>) {
  return new Response(JSON.stringify({
    success: true,
    message: 'API-AUTH operando!',
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleLogin(req: Request, cors: Record<string,string>) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email e senha obrigatórios' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message || 'Falha no login' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  // perfil admin?
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('is_admin,name').eq('id', data.user.id).single();

  const accessToken  = await createAccessToken(data.user.id, data.user.email!, !!profile?.is_admin);
  const refreshToken = await createRefreshToken(data.user.id, data.user.email!, !!profile?.is_admin);

  return new Response(JSON.stringify({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.email,
      is_admin: !!profile?.is_admin
    },
    token: accessToken,
    refreshToken
  }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleRegister(req: Request, cors: Record<string,string>) {
  const { email, password, fullName, termsAccepted } = await req.json();
  if (!termsAccepted) {
    return new Response(JSON.stringify({ error: 'Termos de uso não aceitos' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, terms_accepted: true }
  });
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: error?.message || 'Falha no registro' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  const accessToken  = await createAccessToken(data.user.id, data.user.email!, false);
  const refreshToken = await createRefreshToken(data.user.id, data.user.email!, false);

  return new Response(JSON.stringify({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: fullName || data.user.email,
      is_admin: false
    },
    token: accessToken,
    refreshToken
  }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleLogout(_req: Request, cors: Record<string,string>) {
  return new Response(JSON.stringify({ message: 'Logout efetuado' }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleRefresh(req: Request, cors: Record<string,string>) {
  const { refreshToken } = await req.json();
  if (!refreshToken) {
    return new Response(JSON.stringify({ error: 'Refresh token obrigatório' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Refresh token inválido ou expirado' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }

  // buscar perfil atualizado
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('is_admin,name').eq('id', payload.sub as string).single();

  const newAccessToken  = await createAccessToken(payload.sub as string, payload.email as string, !!profile?.is_admin);
  const newRefreshToken = await createRefreshToken(payload.sub as string, payload.email as string, !!profile?.is_admin);

  return new Response(JSON.stringify({
    user: {
      id: payload.sub,
      email: payload.email,
      name: profile?.name || payload.email,
      is_admin: !!profile?.is_admin
    },
    token: newAccessToken,
    refreshToken: newRefreshToken
  }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleResetPassword(req: Request, cors: Record<string,string>) {
  const { email } = await req.json();
  await supabaseAdmin.auth.resetPasswordForEmail(email);
  return new Response(JSON.stringify({ message: 'Se o email existir, você receberá instruções.' }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

async function handleVerify(req: Request, cors: Record<string,string>) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );
    const payload: any = await verify(token, key);
    if (payload.scope !== 'access') throw new Error();
    return new Response(JSON.stringify({
      valid: true,
      user: {
        id: payload.sub,
        email: payload.email,
        is_admin: payload.is_admin
      }
    }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
}

async function handleSubscription(req: Request, cors: Record<string,string>) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/, '');
  
  try {
    // Verificar token JWT
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );
    const payload: any = await verify(token, key);
    if (payload.scope !== 'access') throw new Error('Invalid token scope');
    
    const userId = payload.sub as string;
    console.log('[handleSubscription] Buscando subscription para user_id:', userId);
    
    // Buscar subscription ativa usando service role (bypassa RLS)
    const { data: subscriptionData, error } = await supabaseAdmin
      .from('subscription_tracker')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
      
    console.log('[handleSubscription] Query result:', { subscriptionData, error });
    
    if (error) {
      console.error('[handleSubscription] Database error:', error);
      return new Response(JSON.stringify({ error: 'Erro ao buscar subscription' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      subscription: subscriptionData,
      user_id: userId
    }), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[handleSubscription] Error:', error);
    return new Response(JSON.stringify({ error: 'Token inválido ou expirado' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
}

// lança o servidor Edge da função
Deno.serve(handler);

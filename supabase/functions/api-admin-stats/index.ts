// functions/api-admin-stats.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify as jwtVerify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET                = Deno.env.get("JWT_SECRET")!;

// Supabase Admin Client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers: agora incluindo cache-control, apikey, accept…
const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": [
    "authorization",
    "content-type",
    "cache-control",
    "apikey",
    "accept"
  ].join(", "),
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Função principal
serve(async (req: Request) => {
  // 1. Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Extrai JWT
  const authHeader = req.headers.get("Authorization") || "";
  const token       = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Authorization header missing" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 3. Verifica JWT com o mesmo secret do api-auth
  let payload: Record<string, any>;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    payload = await jwtVerify(token, key) as Record<string, any>;
    if (payload.scope !== "access") {
      throw new Error("Invalid token scope");
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4. Checa se é admin no banco
  const userId = payload.sub as string;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.is_admin) {
    return new Response(JSON.stringify({ error: "Access denied. Admin required." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 5. Chama a RPC que busca as estatísticas
  const { data: stats, error: statsError } = await supabaseAdmin
    .rpc("get_admin_stats");

  if (statsError) {
    console.error("Failed to fetch stats:", statsError);
    return new Response(JSON.stringify({ error: "Failed to fetch statistics" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 6. Retorna sucesso
  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

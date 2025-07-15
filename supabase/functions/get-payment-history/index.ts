
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.9.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("[get-payment-history] Iniciando função");
    
    // Obter a chave secreta do Stripe das variáveis de ambiente
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }
    
    // Inicializar o cliente Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Autenticar usuário através do token JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Cabeçalho de autorização ausente");
    }
    
    // Inicializar o cliente do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variáveis de ambiente do Supabase não configuradas");
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar o token de usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !userData?.user) {
      console.error("[get-payment-history] Erro de autenticação:", authError);
      throw new Error("Autenticação falhou ou usuário não encontrado");
    }
    
    // Verificar se foi fornecido um userId específico no body (para admins)
    let targetUserId = userData.user.id;
    let requestBody;
    
    try {
      if (req.bodyUsed) {
        console.log("[get-payment-history] Body já foi usado");
      } else {
        requestBody = await req.json().catch(() => null);
        if (requestBody && requestBody.userId) {
          // Verificar se o usuário atual é um admin antes de permitir ver histórico de outro usuário
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("is_admin")
            .eq("id", userData.user.id)
            .single();
            
          if (profileData?.is_admin) {
            targetUserId = requestBody.userId;
            console.log(`[get-payment-history] Admin solicitou histórico para usuário: ${targetUserId}`);
          } else {
            console.log("[get-payment-history] Usuário não-admin tentou acessar histórico de outro usuário");
          }
        }
      }
    } catch (e) {
      console.log("[get-payment-history] Erro ao processar body:", e);
    }
    
    // Obter o email do usuário-alvo
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", targetUserId)
      .single();
      
    if (profileError || !userProfile?.email) {
      console.error("[get-payment-history] Erro ao buscar perfil do usuário:", profileError);
      throw new Error("Perfil do usuário não encontrado");
    }
    
    console.log(`[get-payment-history] Buscando cliente Stripe para o email: ${userProfile.email}`);
    
    // Buscar o cliente do Stripe com base no email
    const customers = await stripe.customers.list({
      email: userProfile.email,
      limit: 1,
    });
    
    if (customers.data.length === 0) {
      console.log("[get-payment-history] Nenhum cliente Stripe encontrado para este usuário");
      return new Response(
        JSON.stringify({ data: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const customerId = customers.data[0].id;
    console.log(`[get-payment-history] Cliente Stripe encontrado: ${customerId}`);
    
    // Buscar pagamentos feitos pelo cliente
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,  // Aumentar se necessário
    });
    
    // Buscar assinaturas do cliente
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });
    
    // Buscar faturas do cliente que foram pagas
    const invoices = await stripe.invoices.list({
      customer: customerId,
      status: 'paid',
      limit: 100,
    });
    
    const payments = [
      // Adicionar cobranças avulsas
      ...charges.data.map(charge => ({
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        date: new Date(charge.created * 1000).toISOString(),
        type: 'charge',
        description: charge.description || 'Pagamento avulso',
        status: charge.status,
      })),
      
      // Adicionar faturas de assinatura
      ...invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        date: new Date(invoice.created * 1000).toISOString(),
        type: 'invoice',
        description: `Fatura ${invoice.number || invoice.id}`,
        status: invoice.status,
        subscription: invoice.subscription,
      })),
    ];
    
    console.log(`[get-payment-history] Total de registros encontrados: ${payments.length}`);
    
    return new Response(
      JSON.stringify({ data: payments }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error(`[get-payment-history] Erro: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

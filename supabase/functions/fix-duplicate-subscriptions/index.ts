import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [FIX-DUPLICATES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Iniciando correção de assinaturas duplicadas");

    // Verificar variáveis de ambiente
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("Usuário autenticado", { userId: user.id, email: user.email });

    // Inicializar Stripe e Supabase
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // Buscar cliente no Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("Cliente não encontrado no Stripe");
    }

    const customer = customers.data[0];
    logStep("Cliente encontrado", { customerId: customer.id });

    // Buscar todas as assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      expand: ["data.items.data.price"],
      limit: 10,
    });

    if (subscriptions.data.length <= 1) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Nenhuma duplicata encontrada",
        subscriptions: subscriptions.data.length 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Assinaturas ativas encontradas", { count: subscriptions.data.length });

    // Ordenar assinaturas por data de criação (mais recente primeiro)
    const sortedSubscriptions = subscriptions.data.sort((a, b) => b.created - a.created);
    const newestSubscription = sortedSubscriptions[0];
    const subscriptionsToCancel = sortedSubscriptions.slice(1);

    logStep("Assinatura mais recente identificada", { 
      id: newestSubscription.id, 
      created: new Date(newestSubscription.created * 1000).toISOString() 
    });

    // Cancelar assinaturas antigas
    const cancelResults = [];
    for (const subscription of subscriptionsToCancel) {
      try {
        const canceled = await stripe.subscriptions.cancel(subscription.id);
        cancelResults.push({
          id: subscription.id,
          status: "canceled",
          canceled_at: canceled.canceled_at
        });
        logStep("Assinatura cancelada", { id: subscription.id });
      } catch (error) {
        logStep("Erro ao cancelar assinatura", { id: subscription.id, error: error.message });
        cancelResults.push({
          id: subscription.id,
          status: "error",
          error: error.message
        });
      }
    }

    // Extrair dados da assinatura mantida
    const price = newestSubscription.items.data[0].price;
    const subscriptionData = {
      stripe_subscription_id: newestSubscription.id,
      stripe_customer_id: customer.id,
      stripe_price_id: price.id,
      billing_cycle: price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      tokens_per_cycle: price.unit_amount && price.unit_amount <= 99900 ? 
        (price.unit_amount <= 19900 ? 200 : price.unit_amount <= 59900 ? 600 : 1200) : 1200,
      plan_type: price.unit_amount && price.unit_amount <= 99900 ? 
        (price.unit_amount <= 19900 ? 'Básico' : price.unit_amount <= 59900 ? 'Premium' : 'Elite') : 'Elite',
      status: 'active',
      next_token_grant_date: new Date(newestSubscription.current_period_end * 1000).toISOString().split('T')[0],
      granted_cycles_count: 0,
      user_id: user.id
    };

    logStep("Dados da assinatura extraídos", subscriptionData);

    // Atualizar banco de dados
    const { error: upsertError } = await supabase
      .from('subscription_tracker')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      logStep("Erro ao atualizar banco", { error: upsertError });
      throw new Error(`Erro ao atualizar banco: ${upsertError.message}`);
    }

    logStep("Banco de dados atualizado com sucesso");

    return new Response(JSON.stringify({
      success: true,
      message: "Assinaturas duplicadas corrigidas com sucesso",
      kept_subscription: {
        id: newestSubscription.id,
        plan: subscriptionData.plan_type,
        billing_cycle: subscriptionData.billing_cycle,
        tokens_per_cycle: subscriptionData.tokens_per_cycle
      },
      canceled_subscriptions: cancelResults,
      database_updated: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERRO", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
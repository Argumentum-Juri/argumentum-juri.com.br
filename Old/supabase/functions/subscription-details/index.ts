
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.9.0"; // Atualizado para a mesma versão do Stripe
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

// Define subscription plans with tokens mapping
const SUBSCRIPTION_PLANS = [
  // Plano Essencial - Mensal
  {
    id: 'essential-monthly',
    priceId: 'price_1RC6CKR5X4PxrShiX6BDVcfL',
    name: 'Essencial',
    tokens: 48,
  },
  // Plano Essencial - Anual
  {
    id: 'essential-annual',
    priceId: 'price_1RKTGSR5X4PxrShi5pNwghGv',
    name: 'Essencial Anual',
    tokens: 48,
  },
  // Plano Avançado - Mensal
  {
    id: 'advanced-monthly',
    priceId: 'price_1RKTHPR5X4PxrShij5V6JM8e',
    name: 'Avançado',
    tokens: 96,
  },
  // Plano Avançado - Anual
  {
    id: 'advanced-annual',
    priceId: 'price_1RKTJFR5X4PxrShibGQspEse',
    name: 'Avançado Anual',
    tokens: 96,
  },
  // Plano Elite - Mensal
  {
    id: 'elite-monthly',
    priceId: 'price_1RKTKOR5X4PxrShi0OZc2eOK',
    name: 'Elite',
    tokens: 160,
  },
  // Plano Elite - Anual
  {
    id: 'elite-annual',
    priceId: 'price_1RKTL9R5X4PxrShi9FMIzYuM',
    name: 'Elite Anual',
    tokens: 160,
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    const jwt = authHeader.replace("Bearer ", "");
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validar usuário pelo token JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error("Erro de autenticação:", authError?.message || "Usuário não encontrado");
      return new Response(
        JSON.stringify({ error: "Erro de autenticação", details: authError?.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    
    console.log("Usuário autenticado:", user.email, "ID:", user.id);

    // Buscar profile do usuário para obter stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error("Erro ao buscar perfil do usuário:", profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar perfil do usuário", details: profileError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Inicializar Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    // Primeiro tentar usar stripe_customer_id do perfil, se disponível
    let customerId;
    
    if (profile.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
      console.log("Usando stripe_customer_id do perfil:", customerId);
    } else {
      // Se não tiver no perfil, buscar no Stripe por email
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      
      if (customers.data.length === 0) {
        // Usuário não tem conta no Stripe
        console.log("Nenhum cliente Stripe encontrado para o email:", user.email);
        return new Response(
          JSON.stringify({ active: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      customerId = customers.data[0].id;
      console.log("Cliente Stripe encontrado:", customerId);
      
      // Atualizar o perfil do usuário com o stripe_customer_id encontrado
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      
      console.log("Perfil atualizado com stripe_customer_id:", customerId);
    }
    
    // Buscar assinaturas ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
      expand: ['data.default_payment_method'],
    });
    
    if (subscriptions.data.length === 0) {
      // Usuário não tem assinatura ativa
      console.log("Nenhuma assinatura ativa encontrada");
      return new Response(
        JSON.stringify({ active: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    const subscription = subscriptions.data[0];
    
    // Agora buscamos o ID do preço da assinatura ativa
    if (!subscription.items.data[0]?.price?.id) {
      console.error("Dados de preço não encontrados na assinatura");
      return new Response(
        JSON.stringify({ error: "Dados de assinatura incompletos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const priceId = subscription.items.data[0].price.id;
    
    // Buscar qual plano corresponde ao priceId da assinatura ativa
    let planId = "";
    let planName = "";
    
    // Procurar nos planos de assinatura
    for (const plan of SUBSCRIPTION_PLANS) {
      if (plan.priceId === priceId) {
        planId = plan.id;
        planName = plan.name;
        break;
      }
    }
    
    if (!planId) {
      console.error("Plano não encontrado para o priceId:", priceId);
      planId = "unknown";
      planName = "Plano Desconhecido";
    }
    
    // Verificar se é um plano anual
    const isAnnualPlan = planId.includes("annual");
    
    // Para planos anuais, buscar informações da próxima renovação na tabela subscription_renewals
    let nextRenewalInfo = null;
    if (isAnnualPlan) {
      const { data: renewalData, error: renewalError } = await supabase
        .from('subscription_renewals')
        .select('next_renewal_date')
        .eq('subscription_id', subscription.id)
        .maybeSingle();
        
      if (!renewalError && renewalData) {
        nextRenewalInfo = renewalData.next_renewal_date;
      }
    }
    
    console.log("Assinatura ativa encontrada:", {
      subscriptionId: subscription.id,
      priceId,
      planId,
      planName,
      endDate: new Date(subscription.current_period_end * 1000).toISOString(),
      nextRenewal: nextRenewalInfo
    });
    
    return new Response(
      JSON.stringify({
        active: true,
        subscriptionId: subscription.id,
        priceId,
        planId,
        planName,
        endDate: new Date(subscription.current_period_end * 1000).toISOString(),
        nextRenewal: nextRenewalInfo
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Erro ao verificar detalhes da assinatura:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

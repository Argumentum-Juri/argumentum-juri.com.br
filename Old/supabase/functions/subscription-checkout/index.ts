import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyGoToken } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verificar autenticação usando GoAuth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyGoToken(token);
    
    if (!payload) {
      throw new Error("Invalid token");
    }
    
    logStep("User authenticated", { userId: payload.sub, email: payload.email });

    const { priceId, planName, billingType, planId } = await req.json();
    
    if (!priceId || !planName || !billingType || !planId) {
      throw new Error("Missing required fields");
    }

    logStep("Request data", { priceId, planName, billingType, planId });

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar se o usuário já tem assinaturas ativas
    const existingCustomers = await stripe.customers.list({
      email: payload.email,
      limit: 1,
    });

    let customerId: string;
    let existingSubscriptions: Stripe.Subscription[] = [];

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      logStep("Found existing customer", { customerId });
      
      // Buscar assinaturas ativas
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });
      
      existingSubscriptions = subscriptions.data;
      logStep("Found existing subscriptions", { count: existingSubscriptions.length });
    } else {
      // Criar novo cliente
      const customer = await stripe.customers.create({
        email: payload.email,
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Se há assinaturas existentes, marcar para cancelamento após nova assinatura
    let subscriptionsToCancel: string[] = [];
    if (existingSubscriptions.length > 0) {
      subscriptionsToCancel = existingSubscriptions.map(sub => sub.id);
      logStep("Will cancel existing subscriptions", { subscriptionsToCancel });
    }

    // Criar sessão de checkout
    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tokens/store`,
      metadata: {
        planId,
        planName,
        billingType,
        userId: payload.sub,
        subscriptionsToCancel: subscriptionsToCancel.join(','),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in subscription-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
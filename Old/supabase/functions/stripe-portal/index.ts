import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";
import { verifyGoToken } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PORTAL] ${step}${detailsStr}`);
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

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-08-16",
    });

    // Buscar cliente do Stripe
    const customers = await stripe.customers.list({
      email: payload.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    logStep("Found Stripe customer", { customerId: customers.data[0].id });

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const returnUrl = `${origin}/tokens`;
    
    logStep("Creating billing portal session", { returnUrl });

    // Criar sessão do portal de faturamento
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl,
    });
    
    logStep("Session created", { url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMsg);
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
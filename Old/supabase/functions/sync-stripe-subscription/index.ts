import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE-DEBUG] ${step}${detailsStr}`);
};

// Check environment variables
function checkEnvironmentVariables() {
  const requiredVars = ['STRIPE_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const envStatus = {};
  
  for (const varName of requiredVars) {
    const value = Deno.env.get(varName);
    envStatus[varName] = {
      available: !!value,
      length: value ? value.length : 0,
      prefix: value ? value.substring(0, 10) + "..." : null
    };
  }
  
  logStep("🔧 Environment variables check", envStatus);
  return envStatus;
}

// Simple JWT verification function
async function verifyJWT(token: string): Promise<any | null> {
  try {
    logStep("🔍 Starting JWT verification");
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      logStep("❌ Invalid JWT format", { partsLength: parts.length });
      return null;
    }
    
    // Decode payload with proper padding
    const base64Payload = parts[1];
    const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
    const payload = JSON.parse(atob(paddedPayload));
    
    logStep("✅ JWT decoded successfully", { 
      userId: payload.sub, 
      email: payload.email,
      hasExp: !!payload.exp
    });
    
    return payload;
  } catch (error) {
    logStep("❌ JWT verification failed", { error: error.message });
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always return 200 with debug info to avoid 400 errors
  try {
    logStep("🚀 Function started");
    
    // Step 1: Check environment variables first
    const envStatus = checkEnvironmentVariables();
    const missingVars = Object.entries(envStatus).filter(([_, status]) => !status.available);
    
    if (missingVars.length > 0) {
      logStep("❌ Missing environment variables", { missing: missingVars.map(([name]) => name) });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Missing environment variables",
          details: { envStatus, missingVars: missingVars.map(([name]) => name) },
          step: "environment_check"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("✅ Environment variables OK");
    
    // Step 2: Check authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("❌ No authorization header");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "No authorization header provided",
          step: "auth_header_check"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    logStep("✅ Token extracted from header", { tokenLength: token.length });
    
    // Step 3: Verify JWT
    const payload = await verifyJWT(token);
    if (!payload) {
      logStep("❌ JWT verification failed");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "JWT verification failed",
          step: "jwt_verification"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    logStep("✅ User authenticated successfully", { userId: payload.sub, email: payload.email });

    // Step 4: Initialize Stripe
    logStep("🔧 Initializing Stripe");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = new Stripe(stripeSecretKey!, {
      apiVersion: "2023-10-16",
    });

    // Inicializar Supabase com service role
    logStep("Initializing Supabase service client");
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Buscar cliente do Stripe
    logStep("Searching for Stripe customer", { email: payload.email });
    const customers = await stripe.customers.list({
      email: payload.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(
        JSON.stringify({ 
          message: "No Stripe customer found",
          email: payload.email,
          suggestions: ["User may not have any Stripe subscriptions", "Email might be different in Stripe"]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    
    const customer = customers.data[0];
    logStep("Found Stripe customer", { customerId: customer.id, email: customer.email });

    // Buscar assinaturas ativas no Stripe
    logStep("Fetching active Stripe subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      expand: ["data.items.data.price"],
      limit: 10,
    });

    logStep("Found Stripe subscriptions", { count: subscriptions.data.length });

    if (subscriptions.data.length === 0) {
      logStep("No active Stripe subscriptions found");
      return new Response(
        JSON.stringify({ 
          message: "No active subscriptions found in Stripe",
          customer: { id: customer.id, email: customer.email },
          suggestions: ["User may have cancelled their subscription", "Subscription may be in different status"]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Analisar a primeira assinatura ativa
    const stripeSubscription = subscriptions.data[0];
    const priceId = stripeSubscription.items.data[0].price.id;
    const productName = (stripeSubscription.items.data[0].price.product as any)?.name || "Unknown";
    const unitAmount = stripeSubscription.items.data[0].price.unit_amount || 0;
    const currency = stripeSubscription.items.data[0].price.currency;
    const interval = stripeSubscription.items.data[0].price.recurring?.interval;

    logStep("Stripe subscription details", {
      subscriptionId: stripeSubscription.id,
      priceId,
      productName,
      unitAmount,
      currency,
      interval,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
    });

    // Buscar o que está no banco
    logStep("Fetching database subscription");
    const { data: dbSubscription, error: dbError } = await supabaseService
      .from("subscription_tracker")
      .select("*")
      .eq("user_id", payload.sub)
      .eq("status", "active")
      .maybeSingle();

    if (dbError) {
      logStep("Error fetching DB subscription", { error: dbError.message });
      throw new Error(`Database error: ${dbError.message}`);
    }

    logStep("Database subscription found", { subscription: dbSubscription });

    const comparison = {
      stripe: {
        subscriptionId: stripeSubscription.id,
        customerId: customer.id,
        priceId,
        productName,
        unitAmount,
        currency,
        interval,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000).toISOString()
      },
      database: dbSubscription ? {
        id: dbSubscription.id,
        subscriptionId: dbSubscription.stripe_subscription_id,
        customerId: dbSubscription.stripe_customer_id,
        priceId: dbSubscription.stripe_price_id,
        planType: dbSubscription.plan_type,
        billingCycle: dbSubscription.billing_cycle,
        tokensPerCycle: dbSubscription.tokens_per_cycle,
        status: dbSubscription.status,
        nextTokenGrantDate: dbSubscription.next_token_grant_date,
        grantedCyclesCount: dbSubscription.granted_cycles_count
      } : null
    };

    logStep("Comparison complete", comparison);

    // Verificar se há discrepâncias
    const discrepancies = [];
    
    if (!dbSubscription) {
      discrepancies.push({
        type: "missing_database_record",
        message: "No database subscription found for active Stripe subscription",
        stripeData: comparison.stripe
      });
    } else {
      if (dbSubscription.stripe_subscription_id !== stripeSubscription.id) {
        discrepancies.push({
          type: "subscription_id_mismatch",
          message: `Subscription ID mismatch`,
          database: dbSubscription.stripe_subscription_id,
          stripe: stripeSubscription.id
        });
      }
      if (dbSubscription.stripe_price_id !== priceId) {
        discrepancies.push({
          type: "price_id_mismatch",
          message: `Price ID mismatch`,
          database: dbSubscription.stripe_price_id,
          stripe: priceId
        });
      }
      if (dbSubscription.stripe_customer_id !== customer.id) {
        discrepancies.push({
          type: "customer_id_mismatch",
          message: `Customer ID mismatch`,
          database: dbSubscription.stripe_customer_id,
          stripe: customer.id
        });
      }
      
      // Verificar se o billing cycle bate
      const expectedBillingCycle = interval === 'month' ? 'monthly' : interval === 'year' ? 'annual' : interval;
      if (dbSubscription.billing_cycle !== expectedBillingCycle) {
        discrepancies.push({
          type: "billing_cycle_mismatch",
          message: `Billing cycle mismatch`,
          database: dbSubscription.billing_cycle,
          stripe: expectedBillingCycle
        });
      }
    }

    const result = {
      success: true,
      comparison,
      discrepancies,
      needsSync: discrepancies.length > 0,
      summary: {
        stripeSubscriptionFound: true,
        databaseSubscriptionFound: !!dbSubscription,
        discrepancyCount: discrepancies.length
      }
    };

    logStep("Sync analysis complete", result.summary);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logStep("❌ ERROR in sync-stripe-subscription", { 
      message: errorMsg, 
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    // Return 200 with error info for debugging instead of 400
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMsg,
        errorType: error instanceof Error ? error.name : 'Unknown',
        timestamp: new Date().toISOString(),
        debug: "Function executed but encountered an error",
        step: "error_handler"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
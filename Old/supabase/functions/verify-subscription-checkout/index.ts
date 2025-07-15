import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { verifyGoToken } from "../_shared/auth.ts";
import { TOKEN_PLANS, SUBSCRIPTION_PLANS } from "../_shared/tokenPlans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await verifyGoToken(token);
    
    if (!payload) {
      throw new Error("Invalid token");
    }
    
    const userId = payload.sub;
    logStep("User authenticated", { userId: payload.sub, email: payload.email });

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Request parsed", { sessionId });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { sessionId: session.id, status: session.payment_status });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    logStep("Subscription retrieved", { subscriptionId: subscription.id, status: subscription.status });

    if (subscription.status !== 'active') {
      throw new Error("Subscription not active");
    }

    // Cancelar assinaturas anteriores se existirem
    const subscriptionsToCancel = session.metadata?.subscriptionsToCancel;
    if (subscriptionsToCancel) {
      const subscriptionIds = subscriptionsToCancel.split(',').filter(id => id.trim());
      for (const subId of subscriptionIds) {
        try {
          const canceledSub = await stripe.subscriptions.cancel(subId);
          logStep("Canceled previous subscription", { subscriptionId: subId, status: canceledSub.status });
          
          // Marcar como cancelada na nossa tabela
          await supabaseService.from('subscription_tracker')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', subId);
            
        } catch (cancelError) {
          logStep("Error canceling subscription", { subscriptionId: subId, error: cancelError });
        }
      }
    }

    // Find the plan details
    const priceId = subscription.items.data[0].price.id;
    const planDetails = SUBSCRIPTION_PLANS.find(plan => plan.priceId === priceId);
    
    if (!planDetails) {
      throw new Error(`Plan not found for price ID: ${priceId}`);
    }

    logStep("Plan details found", { planId: planDetails.id, tokens: planDetails.tokens });

    // Check if subscription already exists in tracker
    const { data: existingTracker } = await supabaseService
      .from("subscription_tracker")
      .select("*")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (existingTracker) {
      logStep("Subscription already exists in tracker", { trackerId: existingTracker.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Subscription already processed",
        trackerId: existingTracker.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Credit initial tokens
    await supabaseService.rpc('add_user_tokens', {
      p_user_id: userId,
      p_amount: planDetails.tokens
    });

    logStep("Initial tokens credited", { userId, tokens: planDetails.tokens });

    // Calculate next token grant date
    const now = new Date();
    const nextGrantDate = new Date(now);
    
    if (planDetails.billingType === 'monthly') {
      nextGrantDate.setMonth(nextGrantDate.getMonth() + 1);
    } else if (planDetails.billingType === 'annual') {
      nextGrantDate.setMonth(nextGrantDate.getMonth() + 1); // Monthly grants for annual plans
    }

    // Insert into subscription tracker
    const { data: trackerData, error: trackerError } = await supabaseService
      .from("subscription_tracker")
      .insert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        plan_type: planDetails.billingType,
        billing_cycle: planDetails.billingType,
        tokens_per_cycle: planDetails.tokens,
        next_token_grant_date: nextGrantDate.toISOString().split('T')[0],
        granted_cycles_count: 1, // Initial credit counts as first cycle
        status: 'active'
      })
      .select()
      .single();

    if (trackerError) {
      throw new Error(`Error creating subscription tracker: ${trackerError.message}`);
    }

    logStep("Subscription tracker created", { trackerId: trackerData.id });

    // Record the transaction
    await supabaseService
      .from("token_transactions")
      .insert({
        user_id: userId,
        amount: planDetails.tokens,
        transaction_type: 'subscription_initial',
        description: `Crédito inicial de ${planDetails.tokens} tokens para plano ${planDetails.name}`,
        stripe_session_id: sessionId,
         metadata: {
           subscription_tracker_id: trackerData.id,
           stripe_subscription_id: subscription.id,
           plan_type: planDetails.billingType,
           billing_cycle: planDetails.billingType,
           is_initial_credit: true,
           replaced_subscriptions: subscriptionsToCancel || null
         }
      });

    logStep("Transaction recorded", { userId, amount: planDetails.tokens });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Subscription processed successfully",
      trackerId: trackerData.id,
      tokensCredited: planDetails.tokens
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-subscription-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
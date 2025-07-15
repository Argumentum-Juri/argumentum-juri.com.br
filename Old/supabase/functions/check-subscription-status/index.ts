import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION-STATUS] ${step}${detailsStr}`);
};

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT has expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error(`JWT decode error: ${error.message}`);
  }
}

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
    const decodedToken = decodeJWT(token);
    const userId = decodedToken.sub;

    if (!userId) {
      throw new Error("No user ID in token");
    }

    logStep("User authenticated", { userId });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get active subscription from tracker
    const { data: subscription, error: subscriptionError } = await supabaseService
      .from("subscription_tracker")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (subscriptionError) {
      logStep("Error fetching subscription", { error: subscriptionError.message });
      throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
    }

    if (!subscription) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        hasSubscription: false,
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Active subscription found", { 
      subscriptionId: subscription.id,
      planType: subscription.plan_type,
      tokensPerCycle: subscription.tokens_per_cycle,
      nextGrantDate: subscription.next_token_grant_date
    });

    // Calculate subscription end date (for display purposes)
    const nextGrantDate = new Date(subscription.next_token_grant_date);
    let subscriptionEnd = new Date(nextGrantDate);
    
    if (subscription.billing_cycle === 'monthly') {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else if (subscription.billing_cycle === 'annual') {
      // For annual plans, calculate when the 12 months will be complete
      const cyclesRemaining = 12 - subscription.granted_cycles_count;
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + cyclesRemaining);
    }

    const subscriptionData = {
      id: subscription.id,
      planId: `${subscription.plan_type}_${subscription.billing_cycle}`,
      planType: subscription.plan_type,
      billingCycle: subscription.billing_cycle,
      tokensPerCycle: subscription.tokens_per_cycle,
      nextTokenGrantDate: subscription.next_token_grant_date,
      grantedCyclesCount: subscription.granted_cycles_count,
      status: subscription.status,
      subscriptionEnd: subscriptionEnd.toISOString(),
      stripeSubscriptionId: subscription.stripe_subscription_id
    };

    return new Response(JSON.stringify({ 
      hasSubscription: true,
      subscription: subscriptionData 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
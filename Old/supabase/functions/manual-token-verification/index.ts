import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[MANUAL-TOKEN-VERIFICATION ${timestamp}] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("Manual token verification started", { method: req.method });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userEmail = userData.user.email;
    logStep("User authenticated", { userEmail });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get recent checkout sessions for this customer
    const customers = await stripe.customers.list({ 
      email: userEmail, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { userEmail });
      return new Response(JSON.stringify({ 
        success: false,
        error: "No Stripe customer found",
        email: userEmail,
        suggestion: "User needs to make at least one purchase to create a Stripe customer record",
        totalTokensAdded: 0,
        processedSessions: []
      }), { 
        status: 200, // Changed to 200 since this is a valid scenario
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get recent checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      customer: customerId,
      limit: 10,
      status: 'complete'
    });

    logStep("Found checkout sessions", { count: sessions.data.length });

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user profile using maybeSingle to avoid errors
    const { data: profile, error: profileError } = await supabaseService
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (profileError) {
      logStep("Profile query error", { error: profileError.message });
      return new Response(JSON.stringify({ 
        error: "Database error", 
        details: profileError.message 
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!profile) {
      logStep("Profile not found", { userEmail });
      return new Response(JSON.stringify({ 
        error: "User profile not found",
        userEmail,
        suggestion: "User may need to complete registration"
      }), { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userId = profile.id;
    const processedSessions = [];
    let totalTokensAdded = 0;

    // Process each completed session
    for (const session of sessions.data) {
      logStep("Processing session", { sessionId: session.id });

      // Extract tokens from metadata or calculate from amount
      let tokens = parseInt(session.metadata?.tokens || "0");
      if (tokens <= 0 && session.amount_total) {
        tokens = Math.floor(session.amount_total / 1000); // R$10 per token
      }

      if (tokens > 0) {
        // Try to process tokens idempotently with detailed error handling
        const rpcParams = {
          p_user_id: userId,
          p_amount: tokens,
          p_session_id: session.id,
          p_description: `Manual verification - ${tokens} tokens for session ${session.id}`,
          p_metadata: {
            customer_id: customerId,
            session_amount: session.amount_total,
            verification_type: 'manual',
            timestamp: new Date().toISOString()
          }
        };

        logStep("Calling purchase_tokens_idempotent RPC", {
          sessionId: session.id,
          tokens,
          rpcParams: rpcParams
        });

        const { data: rpcResult, error: rpcError } = await supabaseService
          .rpc('purchase_tokens_idempotent', rpcParams);

        if (rpcError) {
          logStep("RPC ERROR - Detailed breakdown", { 
            sessionId: session.id,
            error: rpcError.message, 
            code: rpcError.code,
            details: rpcError.details,
            hint: rpcError.hint,
            rpcParams: rpcParams
          });
          
          // Provide more helpful error context
          let errorContext = "Unknown RPC error";
          if (rpcError.code === '42883') {
            errorContext = "Function signature mismatch - parameter types may be incorrect";
          } else if (rpcError.code === '42P01') {
            errorContext = "Function does not exist in database";
          } else if (rpcError.code === '23505') {
            errorContext = "Duplicate key constraint violation";
          }
          
          processedSessions.push({
            sessionId: session.id,
            tokens,
            processed: false,
            reason: `RPC Error (${rpcError.code}): ${rpcError.message} - ${errorContext}`,
            createdAt: new Date(session.created * 1000).toISOString()
          });
          continue; // Continue processing other sessions
        }

        logStep("RPC result", { sessionId: session.id, rpcResult, rpcError });

        if (!rpcError && rpcResult === true) {
          totalTokensAdded += tokens;
          processedSessions.push({
            sessionId: session.id,
            tokens,
            processed: true,
            createdAt: new Date(session.created * 1000).toISOString()
          });
        } else {
          processedSessions.push({
            sessionId: session.id,
            tokens,
            processed: false,
            reason: rpcError?.message || "Already processed",
            createdAt: new Date(session.created * 1000).toISOString()
          });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Token verification completed",
      userEmail,
      userId,
      totalTokensAdded,
      processedSessions,
      totalSessionsFound: sessions.data.length
    }), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error && error.stack ? error.stack : null;
    
    logStep("CRITICAL ERROR - Full details", { 
      message: errorMessage,
      stack: errorStack,
      type: typeof error,
      error: error
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Verification failed",
      message: errorMessage,
      timestamp: new Date().toISOString(),
      details: "Check function logs for complete error information"
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
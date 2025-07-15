import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[WEBHOOK-STRIPE ${timestamp}] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Log TUDO para debug
  logStep("🚀 WEBHOOK STRIPE INICIADO", { 
    method: req.method, 
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    logStep("✅ CORS OPTIONS request handled");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Log environment variables (sem expor valores sensíveis)
  logStep("🔧 Environment check", {
    hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
    hasServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    hasStripeKey: !!Deno.env.get("STRIPE_SECRET_KEY"),
    hasWebhookSecret: !!Deno.env.get("STRIPE_WEBHOOK_SECRET")
  });

  try {
    // Get raw body and parse JSON directly (skip signature verification)
    const body = await req.text();
    logStep("Received webhook body", { 
      bodyLength: body.length,
      contentType: req.headers.get("content-type")
    });

    let event: any;
    try {
      event = JSON.parse(body);
      logStep("Parsed webhook event", { eventType: event.type, eventId: event.id });
    } catch (err) {
      logStep("ERROR: Invalid JSON payload", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Filter events - only process checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      logStep("Event type ignored", { eventType: event.type });
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Evento ${event.type} ignorado`,
        event_type: event.type 
      }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Process the checkout.session.completed event
    const session = event.data.object;
      logStep("Processing checkout.session.completed", { 
        sessionId: session.id, 
        customerId: session.customer,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total 
      });

      // Get customer email
      const customerEmail = session.customer_details?.email;
      if (!customerEmail) {
        logStep("ERROR: No customer email found in session", { 
          sessionId: session.id,
          customerDetails: session.customer_details,
          customerEmail: session.customer_email
        });
        return new Response(JSON.stringify({ error: "No customer email" }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Find user by email
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, email")
        .eq("email", customerEmail)
        .maybeSingle();

      if (profileError) {
        logStep("ERROR: Database error finding user", { email: customerEmail, error: profileError.message });
        return new Response(JSON.stringify({ error: "Database error" }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (!profile) {
        logStep("ERROR: User not found", { email: customerEmail });
        return new Response(JSON.stringify({ error: "User not found" }), { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const userId = profile.id;
      logStep("Found user", { userId, email: customerEmail });

      // Extract token information from metadata
      logStep("Session metadata received", { 
        metadata: session.metadata,
        amountTotal: session.amount_total,
        currency: session.currency,
        mode: session.mode
      });

      let tokens = parseInt(session.metadata?.tokens || session.metadata?.token_amount || "0");
      const planName = session.metadata?.planName || session.metadata?.plan_name || "Custom Token Purchase";
      
      logStep("Token extraction from metadata", {
        metadataTokens: session.metadata?.tokens,
        metadataTokenAmount: session.metadata?.token_amount,
        parsedTokens: tokens,
        planName
      });
      
      // Fallback: Calculate tokens from amount if not in metadata 
      // Preço correto: R$10,00 por token = 1000 centavos
      if (tokens <= 0 && session.amount_total) {
        const pricePerTokenCentavos = 1000; // R$10,00 por token em centavos
        const calculatedTokens = Math.round(session.amount_total / pricePerTokenCentavos); // Arredondar para evitar problemas de ponto flutuante
        
        logStep("🚨 FALLBACK: Calculando tokens do valor pago (METADATA AUSENTE)", { 
          amountTotal: session.amount_total,
          pricePerTokenCentavos,
          calculatedTokens,
          originalTokens: tokens,
          calculation: `${session.amount_total} / ${pricePerTokenCentavos} = ${calculatedTokens}`,
          warning: "METADATA NÃO ENCONTRADO - usando cálculo de fallback"
        });
        tokens = calculatedTokens;
      }
      
      if (tokens <= 0) {
        logStep("ERROR: Invalid token amount even after fallback", { 
          tokens, 
          metadata: session.metadata,
          amountTotal: session.amount_total,
          calculatedFromAmount: session.amount_total ? Math.round(session.amount_total / 920) : 0
        });
        return new Response(JSON.stringify({ error: "Invalid token amount" }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // VALIDAÇÃO ADICIONAL: Verificar se há discrepância entre valor pago e tokens
      if (session.amount_total && tokens > 0) {
        const expectedAmountForTokens = tokens * 1000; // R$10,00 por token em centavos
        const paidAmount = session.amount_total;
        const discrepancyPercentage = Math.abs((paidAmount - expectedAmountForTokens) / expectedAmountForTokens) * 100;
        
        logStep("💰 VALIDAÇÃO DE PREÇO", {
          tokensToCredit: tokens,
          paidAmount: paidAmount,
          expectedAmount: expectedAmountForTokens,
          pricePerToken: 1000,
          discrepancyPercentage: Math.round(discrepancyPercentage * 100) / 100,
          isWithinTolerance: discrepancyPercentage <= 5, // Tolerância de 5% para descontos
          calculation: `${tokens} tokens × R$10.00 = R$${expectedAmountForTokens/100}`
        });
        
        // Alertar se há discrepância significativa (mais de 5%)
        if (discrepancyPercentage > 5) {
          logStep("⚠️ DISCREPÂNCIA DETECTADA!", {
            warning: "Valor pago não condiz com quantidade de tokens esperada",
            tokensToCredit: tokens,
            paidAmount: paidAmount,
            expectedAmount: expectedAmountForTokens,
            discrepancyPercentage: Math.round(discrepancyPercentage * 100) / 100,
            recommendation: "Verificar se o checkout está enviando metadata correto"
          });
        }
      }

      logStep("Processing token purchase", { userId, tokens, planName, sessionId: session.id });

      // Debug do tipo de evento
      console.log(`[WEBHOOK] recebendo evento`, event.type, `para session`, session.id);

      // Use atomic function to process tokens with idempotency
      logStep("Processing tokens atomically", { userId, tokens, sessionId: session.id });

      const transactionMetadata = {
        stripe_session_id: session.id,
        stripe_customer_id: session.customer,
        plan_name: planName,
        amount_paid: session.amount_total,
        currency: session.currency,
      };

      // Call the purchase_tokens_idempotent RPC (nova versão atômica)
      const { data: rpcResult, error: rpcError } = 
        await supabaseClient.rpc('purchase_tokens_idempotent', {
          p_user_id: userId,
          p_amount: tokens,
          p_session_id: session.id
        });

      // Log detalhado do resultado do RPC
      console.log('[RPC purchase_tokens_idempotent]', { rpcResult, rpcError });
      if (rpcError) {
        console.error('⚠️ RPC ERROR:', rpcError);
        logStep("RPC failed", { rpcError });
        return new Response(JSON.stringify({ 
          error: 'Failed to process token purchase',
          details: rpcError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (rpcResult === true) {
        logStep("✅ Tokens creditados pela primeira vez", { userId, tokens, sessionId: session.id });
      } else if (rpcResult === false) {
        logStep("ℹ️ Transação já processada (idempotência)", { sessionId: session.id });
      } else {
        logStep("⚠️ Resultado inesperado do RPC", { rpcResult });
      }

      logStep("Checkout processing completed successfully", { 
        userId, 
        tokens, 
        sessionId: session.id 
      });

      return new Response(JSON.stringify({ 
        success: true,
        tokens_added: tokens,
        user_id: userId,
        session_id: session.id
      }), { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Unexpected error in webhook processing", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      success: false
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.9.0?target=deno";
import { authenticateRequest, createErrorResponse, createSuccessResponse, supabaseAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment verification");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return createErrorResponse("Stripe key not configured", 500);
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const auth = await authenticateRequest(req);
    if (!auth) {
      return createErrorResponse("Unauthorized", 401);
    }

    const { session_id } = await req.json();
    if (!session_id) {
      return createErrorResponse("Session ID required", 400);
    }

    logStep("Retrieving Stripe session", { session_id });

    // Buscar a sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return createErrorResponse("Session not found", 404);
    }

    logStep("Session retrieved", { 
      status: session.payment_status, 
      customer: session.customer,
      client_reference_id: session.client_reference_id 
    });

    // Verificar se o pagamento foi completado
    if (session.payment_status !== 'paid') {
      return createSuccessResponse({ 
        success: false, 
        message: "Payment not completed yet",
        status: session.payment_status 
      });
    }

    logStep("Payment verification completed successfully", { 
      session_id,
      payment_status: session.payment_status,
      customer: session.customer 
    });

    return createSuccessResponse({
      success: true,
      message: "Payment verified successfully - tokens will be credited via webhook",
      payment_status: session.payment_status,
      session_id: session_id
    });

  } catch (error) {
    logStep("ERROR in verify-payment", { message: error.message });
    return createErrorResponse(error.message, 500);
  }
});
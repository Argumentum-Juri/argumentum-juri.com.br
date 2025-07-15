import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` - ${JSON.stringify(details, null, 2)}` : '';
  console.log(`[WEBHOOK-STRIPE-DEBUG ${timestamp}] ${step}${detailsStr}`);
};

serve(async (req) => {
  logStep("🔍 DEBUG WEBHOOK INICIADO", { 
    method: req.method, 
    url: req.url,
    allHeaders: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get("user-agent"),
    contentType: req.headers.get("content-type"),
    authorization: req.headers.get("authorization") ? "PRESENTE" : "AUSENTE"
  });

  // Handle CORS
  if (req.method === "OPTIONS") {
    logStep("✅ CORS DEBUG - OPTIONS handled");
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Log environment
    logStep("🔧 DEBUG ENV", {
      supabaseUrl: Deno.env.get("SUPABASE_URL")?.slice(0, 30) + "...",
      hasServiceRole: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasStripeSecret: !!Deno.env.get("STRIPE_SECRET_KEY"),
      hasWebhookSecret: !!Deno.env.get("STRIPE_WEBHOOK_SECRET")
    });

    // Get raw body
    const body = await req.text();
    logStep("📥 DEBUG BODY RECEIVED", { 
      bodyLength: body.length,
      bodyPreview: body.slice(0, 200),
      contentType: req.headers.get("content-type")
    });

    // Parse event
    let event: any;
    try {
      event = JSON.parse(body);
      logStep("📋 DEBUG EVENT PARSED", { 
        eventType: event.type, 
        eventId: event.id,
        hasData: !!event.data,
        hasObject: !!event.data?.object
      });
    } catch (err) {
      logStep("❌ DEBUG JSON PARSE ERROR", { error: err.message, body: body.slice(0, 500) });
      return new Response(JSON.stringify({ 
        debug: true,
        error: "Invalid JSON", 
        bodyPreview: body.slice(0, 200)
      }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Test Supabase connection
    logStep("🔗 DEBUG SUPABASE CONNECTION TEST");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Test database access
    const { data: testData, error: testError } = await supabaseClient
      .from("profiles")
      .select("id")
      .limit(1);

    logStep("🗃️ DEBUG DATABASE TEST", {
      hasData: !!testData,
      hasError: !!testError,
      errorMessage: testError?.message,
      dataCount: testData?.length || 0
    });

    if (testError) {
      logStep("❌ DEBUG DATABASE CONNECTION FAILED", { error: testError });
      return new Response(JSON.stringify({ 
        debug: true,
        error: "Database connection failed",
        details: testError.message
      }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Only process checkout.session.completed for real processing
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      logStep("💳 DEBUG CHECKOUT SESSION", { 
        sessionId: session.id,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        metadata: session.metadata
      });

      // Test email lookup
      const customerEmail = session.customer_details?.email;
      if (customerEmail) {
        const { data: profile, error: profileError } = await supabaseClient
          .from("profiles")
          .select("id, email")
          .eq("email", customerEmail)
          .maybeSingle();

        logStep("👤 DEBUG USER LOOKUP", {
          email: customerEmail,
          foundUser: !!profile,
          userId: profile?.id,
          error: profileError?.message
        });
      }
    }

    // Return comprehensive debug info
    return new Response(JSON.stringify({ 
      debug: true,
      success: true,
      message: "Debug webhook funcionando!",
      eventType: event.type,
      eventId: event.id,
      timestamp: new Date().toISOString(),
      databaseConnected: !testError,
      environment: {
        hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
        hasServiceRole: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      }
    }), { 
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("💥 DEBUG UNEXPECTED ERROR", { 
      message: errorMessage,
      stack: error instanceof Error ? error.stack : "No stack"
    });
    
    return new Response(JSON.stringify({ 
      debug: true,
      error: "Debug webhook error",
      message: errorMessage,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
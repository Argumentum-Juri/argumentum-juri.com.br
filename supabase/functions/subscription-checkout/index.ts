
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.9.0"; // Usar versão consistente do Stripe
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  priceId: string;
  planName: string;
  billingType: 'monthly' | 'annual';
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Subscription checkout function started");
    
    // Get Stripe secret key from environment
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe key not configured");
      return new Response(JSON.stringify({ error: "Stripe key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe instance
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get authentication token from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header found");
      return new Response(JSON.stringify({ error: "Authentication token not provided" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract token without Bearer prefix
    const token = authHeader.replace('Bearer ', '');
    console.log("Auth token extracted");

    // Create Supabase client with service key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase URL or service key missing");
      return new Response(JSON.stringify({ error: "Supabase configuration incomplete" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Creating Supabase admin client");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Verifying user from JWT");
    // Verify JWT to get user information
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(JSON.stringify({ error: "Error verifying user", details: userError }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`User verified: ${user.id}`);
    
    // Get user profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Error fetching user profile", details: profileError }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!profile || !profile.email) {
      console.error("User profile not found or email missing");
      return new Response(JSON.stringify({ error: "User profile not found or email missing" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Parsing request JSON");
    let requestData: RequestBody;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return new Response(JSON.stringify({ error: "Error parsing request data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { priceId, planName, billingType } = requestData;
    const userId = user.id; // Use authenticated user's ID
    
    // Validate required fields
    if (!priceId) {
      console.error("Price ID is required");
      return new Response(JSON.stringify({ error: "Price ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!planName) {
      console.error("Plan name is required");
      return new Response(JSON.stringify({ error: "Plan name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Creating subscription checkout for user ${user.id}, email ${profile.email}, priceId: ${priceId}`);

    // Check if the customer already has a Stripe ID
    let customerId = profile.stripe_customer_id;
    
    if (!customerId) {
      // If no stored stripe_customer_id, search by email
      const { data: customers } = await stripe.customers.list({
        email: profile.email,
        limit: 1
      });
      
      if (customers && customers.data && customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log(`Usando stripe_customer_id existente: ${customerId}`);
        
        // Update user's profile with stripe_customer_id
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
          
        if (updateError) {
          console.error(`Error updating stripe_customer_id for user ${userId}: ${updateError.message}`);
        } else {
          console.log(`stripe_customer_id ${customerId} updated for user ${userId}`);
        }
        
        // Update customer metadata
        await stripe.customers.update(customerId, {
          metadata: {
            client_reference_id: userId
          }
        });
        console.log(`Metadados do cliente ${customerId} atualizados com client_reference_id`);
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: profile.email,
          metadata: {
            client_reference_id: userId
          }
        });
        customerId = customer.id;
        console.log(`New customer created: ${customerId}`);
        
        // Update user profile with stripe_customer_id
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
          
        if (updateError) {
          console.error(`Error updating stripe_customer_id for user ${userId}: ${updateError.message}`);
        } else {
          console.log(`stripe_customer_id ${customerId} associated with user ${userId}`);
        }
      }
    } else {
      console.log(`Using existing stripe_customer_id from profile: ${customerId}`);
    }

    // Check if the user already has an active subscription
    console.log("Checking for active subscriptions");
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10
    });
    
    console.log(`Assinaturas ativas encontradas: ${subscriptions.data.length}`);
    
    // Create checkout session
    console.log("Creating checkout session");
    try {
      const origin = req.headers.get('origin');
      if (!origin) {
        console.error("Origin header not found");
        return new Response(JSON.stringify({ error: "Origin header not provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${origin}/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/tokens/store`,
        client_reference_id: userId,
        subscription_data: {
          metadata: {
            user_id: userId,
            plan_name: planName,
            billing_type: billingType
          },
        },
      });

      console.log(`Sessão de checkout criada: ${session.id}, URL: ${session.url}`);

      return new Response(JSON.stringify({ url: session.url }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (stripeError) {
      console.error("Error creating Stripe checkout session:", stripeError);
      return new Response(JSON.stringify({ error: "Error creating checkout session", details: stripeError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in subscription-checkout function:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

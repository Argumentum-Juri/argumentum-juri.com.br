
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Parse the request body
    const { priceId, planName, billingType, userId } = await req.json()

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Price ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Get user details for the checkout
    const { data: userData, error: userDataError } = await supabaseClient
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single()

    if (userDataError) {
      console.error('Error fetching user data:', userDataError)
      return new Response(JSON.stringify({ error: 'Error fetching user data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Create metadata for the subscription
    const metadata = {
      user_id: user.id,
      plan_name: planName || 'Subscription',
      billing_type: billingType || 'monthly',
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (subscriptionError) {
      console.error('Error checking existing subscription:', subscriptionError)
    }

    // If upgrading from one annual plan to another, preserve the granted_months_this_cycle
    // This is crucial to avoid resetting the token grant cycle when upgrading
    let preserveGrantedMonths = null
    if (existingSubscription && billingType === 'annual' && existingSubscription.billing_type === 'annual') {
      // Check in the renewal tracker table for the current cycle count
      const { data: trackerData } = await supabaseClient
        .from('annual_token_renewal_tracker')
        .select('granted_months_this_cycle, next_token_grant_date')
        .eq('stripe_subscription_id', existingSubscription.subscription_id)
        .maybeSingle()

      if (trackerData) {
        preserveGrantedMonths = trackerData.granted_months_this_cycle
        metadata.preserve_granted_months = preserveGrantedMonths.toString()
        metadata.preserve_next_grant_date = trackerData.next_token_grant_date
        
        console.log('Preserving granted months for annual plan upgrade:', {
          current_granted_months: preserveGrantedMonths,
          next_grant_date: trackerData.next_token_grant_date
        })
      }
    }

    // Create a checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${Deno.env.get('SITE_URL')}/dashboard?success=true`,
      cancel_url: `${Deno.env.get('SITE_URL')}/tokens`,
      customer_email: userData.email,
      client_reference_id: user.id,
      subscription_data: {
        metadata,
      },
      metadata,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

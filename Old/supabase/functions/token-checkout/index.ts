
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.9.0?target=deno";
import { authenticateRequest, createErrorResponse, createSuccessResponse, supabaseAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBodyToken {
  tokens: number;
  amount?: number;
  planName?: string;
  custom?: boolean;
  userId?: string; // Campo para armazenar o ID do usuário
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Token checkout function started");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe key not configured");
      return new Response(JSON.stringify({ error: "Chave do Stripe não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    console.log("Authenticating request with custom JWT");
    const auth = await authenticateRequest(req);
    if (!auth) {
      console.error("Authentication failed");
      return createErrorResponse("Acesso não autorizado", 401);
    }

    console.log(`User authenticated: ${auth.userId}`);
    
    // Buscar email do usuário no perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', auth.userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return createErrorResponse("Erro ao obter perfil do usuário");
    }
    
    if (!profile) {
      console.error("User profile not found");
      return createErrorResponse("Perfil do usuário não encontrado", 404);
    }
    
    console.log("Parsing request JSON");
    let requestData: RequestBodyToken;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return new Response(JSON.stringify({ error: "Erro ao analisar dados da requisição" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { tokens, amount, planName, custom = false } = requestData;
    const userId = auth.userId; // Usar o ID do usuário autenticado
    
    // Validações básicas
    if (!tokens || tokens <= 0) {
      console.error("Invalid token amount:", tokens);
      return new Response(JSON.stringify({ error: "Quantidade de tokens inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Creating checkout for user ${auth.userId}, email ${profile.email}, tokens: ${tokens}`);

    // Se é uma compra personalizada, calcular o preço baseado na quantidade
    // Função para calcular desconto baseado na quantidade de tokens
    const calculateDiscount = (tokens: number): number => {
      if (tokens < 100) return 0;
      if (tokens >= 100 && tokens < 200) return 8;
      if (tokens >= 200 && tokens < 300) return 10;
      return 12; // 12% para acima de 300 tokens
    };
    
    // Função para calcular preço com desconto
    const calculatePrice = (tokens: number): number => {
      const basePrice = tokens * 1000; // R$10,00 por token (em centavos)
      const discount = calculateDiscount(tokens);
      return Math.round(basePrice - (basePrice * discount / 100));
    };
    
    const pricePerToken = 10.00; // R$10,00 por token
    const finalAmount = custom ? calculatePrice(tokens) / 100 : amount; // Convertendo centavos para reais se for custom
    
    if (!finalAmount || finalAmount <= 0) {
      console.error("Invalid purchase amount:", finalAmount);
      return new Response(JSON.stringify({ error: "Valor inválido para a compra" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Calculated final amount: ${finalAmount} for ${tokens} tokens (custom: ${custom})`);
    
    // Criar descrição do produto
    const description = custom 
      ? `Compra de ${tokens} tokens` 
      : planName 
        ? `${planName} - ${tokens} tokens` 
        : `Compra de ${tokens} tokens`;

    console.log("Looking for existing Stripe customer");
    
    // Verificar se o usuário já tem um stripe_customer_id salvo
    const { data: userProfile, error: userProfileError } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    let customerId: string | undefined;
    
    if (userProfileError) {
      console.error("Error fetching user profile for stripe_customer_id:", userProfileError);
    } else if (userProfile && userProfile.stripe_customer_id) {
      customerId = userProfile.stripe_customer_id;
      console.log(`Found existing stripe_customer_id in profile: ${customerId}`);
    }
    
    // Se não encontrou no perfil, buscar no Stripe pelo email
    if (!customerId) {
      const { data: customers } = await stripe.customers.list({
        email: profile.email,
        limit: 1
      });

      // Se já existe um cliente, usar o ID existente, caso contrário criar um novo
      if (customers && customers.data && customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log(`Cliente existente encontrado para ${profile.email}: ${customerId}`);
        
        // Atualizar o perfil com o ID do cliente do Stripe encontrado
        try {
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId);
          
          if (updateError) {
            console.error(`Erro ao atualizar stripe_customer_id para usuário ${userId}: ${updateError.message}`);
          } else {
            console.log(`stripe_customer_id ${customerId} associado ao usuário ${userId}`);
          }
        } catch (error) {
          console.error(`Exceção ao atualizar stripe_customer_id: ${error.message}`);
        }
      } else {
        // Criar um novo cliente
        try {
          console.log(`Creating new Stripe customer for ${profile.email}`);
          const customer = await stripe.customers.create({
            email: profile.email,
            metadata: {
              client_reference_id: userId
            }
          });
          customerId = customer.id;
          console.log(`Novo cliente criado para ${profile.email}: ${customerId}`);
          
          // Associar o stripe_customer_id ao perfil do usuário
          try {
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ stripe_customer_id: customerId })
              .eq('id', userId);
              
            if (updateError) {
              console.error(`Erro ao atualizar stripe_customer_id para usuário ${userId}: ${updateError.message}`);
            } else {
              console.log(`stripe_customer_id ${customerId} associado ao usuário ${userId}`);
            }
          } catch (error) {
            console.error(`Exceção ao atualizar stripe_customer_id: ${error.message}`);
          }
        } catch (stripeError) {
          console.error("Error creating Stripe customer:", stripeError);
          return new Response(JSON.stringify({ error: "Erro ao criar cliente no Stripe", details: stripeError.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Criando a sessão de checkout
    console.log("Creating checkout session");
    try {
      const origin = req.headers.get('origin');
      if (!origin) {
        console.error("Origin header not found");
        return new Response(JSON.stringify({ error: "Cabeçalho de origem não fornecido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const calculatedAmount = Math.round(finalAmount * 100); // Converter para centavos para o Stripe
      console.log(`Final amount in cents: ${calculatedAmount}`);
      
      // Log detalhado dos metadados que serão enviados
      const sessionMetadata = {
        user_id: userId,
        tokens: tokens.toString(),
        token_amount: tokens.toString(),
        plan_name: planName || 'Custom',
        custom_purchase: custom.toString()
      };
      
      const paymentIntentMetadata = {
        tokens: tokens.toString(),
        token_amount: tokens.toString(),
        user_id: userId,
        session_context: 'token_purchase'
      };
      
      console.log("📋 METADATA SENDO ENVIADO:", {
        sessionMetadata,
        paymentIntentMetadata,
        finalAmount,
        calculatedAmount,
        tokens,
        planName
      });
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: 'Tokens Argumentum',
                description: description,
              },
              unit_amount: calculatedAmount, // Usando o valor já convertido para centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/tokens`,
        customer: customerId,
        client_reference_id: userId,
        metadata: sessionMetadata,
        payment_intent_data: {
          metadata: paymentIntentMetadata,
        },
      });

      console.log(`Sessão de checkout criada: ${session.id}, URL: ${session.url}`);

      return createSuccessResponse({ url: session.url });
    } catch (stripeError) {
      console.error("Error creating Stripe checkout session:", stripeError);
      return new Response(JSON.stringify({ error: "Erro ao criar sessão de checkout", details: stripeError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in token-checkout function:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

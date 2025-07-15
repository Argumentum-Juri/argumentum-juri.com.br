
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log("[process-monthly-renewals] Processamento de renovações mensais iniciado");

    // Inicializar cliente Supabase com role de serviço para operações privilegiadas
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const now = new Date();
    console.log(`[process-monthly-renewals] Buscando renovações pendentes para a data: ${now.toISOString()}`);

    // Buscar todas as assinaturas anuais que precisam de renovação mensal
    const { data: renewals, error: fetchError } = await supabaseAdmin
      .from("subscription_renewals")
      .select("*")
      .eq("status", "active")
      .lt("next_renewal_date", now.toISOString());

    if (fetchError) {
      throw new Error(`Erro ao buscar renovações: ${fetchError.message}`);
    }

    console.log(`[process-monthly-renewals] Encontradas ${renewals?.length || 0} renovações pendentes`);

    // Processar cada renovação
    const results = [];
    for (const renewal of renewals || []) {
      try {
        console.log(`[process-monthly-renewals] Processando renovação para usuário ${renewal.user_id}, assinatura ${renewal.subscription_id}`);

        // 1. Adicionar tokens ao usuário
        const { error: tokenError } = await supabaseAdmin.rpc(
          'add_user_tokens',
          { p_user_id: renewal.user_id, p_amount: renewal.tokens_per_renewal }
        );

        if (tokenError) {
          throw new Error(`Erro ao adicionar tokens: ${tokenError.message}`);
        }

        // 2. Registrar transação de token
        await supabaseAdmin.from("token_transactions").insert({
          user_id: renewal.user_id,
          amount: renewal.tokens_per_renewal,
          transaction_type: "subscription",
          description: `Crédito mensal de ${renewal.tokens_per_renewal} tokens para assinatura anual (${renewal.subscription_id})`,
          metadata: { 
            subscription_id: renewal.subscription_id, 
            renewal_id: renewal.id,
            price_id: renewal.price_id 
          }
        });

        // 3. Atualizar a data da próxima renovação
        const nextRenewalDate = new Date();
        nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);

        await supabaseAdmin
          .from("subscription_renewals")
          .update({
            next_renewal_date: nextRenewalDate.toISOString(),
            last_renewal_date: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq("id", renewal.id);

        results.push({
          user_id: renewal.user_id,
          subscription_id: renewal.subscription_id,
          tokens_added: renewal.tokens_per_renewal,
          next_renewal: nextRenewalDate.toISOString(),
          status: "success"
        });

        console.log(`[process-monthly-renewals] Renovação processada com sucesso. Próxima renovação: ${nextRenewalDate.toISOString()}`);
      } catch (error) {
        console.error(`[process-monthly-renewals] Erro ao processar renovação ${renewal.id}: ${error.message}`);
        results.push({
          renewal_id: renewal.id,
          user_id: renewal.user_id,
          subscription_id: renewal.subscription_id,
          error: error.message,
          status: "error"
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: renewals?.length || 0,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error(`[process-monthly-renewals] ERRO GERAL: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

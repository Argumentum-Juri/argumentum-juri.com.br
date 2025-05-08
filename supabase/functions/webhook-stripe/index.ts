import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Considere verificar por versões mais recentes
import Stripe from "https://esm.sh/stripe@15.10.0?target=deno"; // TENTE USAR A VERSÃO MAIS RECENTE DISPONÍVEL
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"; // Ou mais recente

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[webhook-stripe] ${new Date().toISOString()} | ${step}${detailsStr}`);
};

// ATENÇÃO: Substitua pelos seus Price IDs e valores REAIS
const planoTokensMensais: Record<string, number> = {
  "price_1RC6CKR5X4PxrShiX6BDVcfL": 48,
  "price_1RKTGSR5X4PxrShi5pNwghGv": 48, // Tokens MENSAIS para este plano anual
  "price_1RKTHPR5X4PxrShij5V6JM8e": 96,
  "price_1RKTJFR5X4PxrShibGQspEse": 96, // Tokens MENSAIS para este plano anual
  "price_1RKTKOR5X4PxrShi0OZc2eOK": 160,
  "price_1RKTL9R5X4PxrShi9FMIzYuM": 160  // Tokens MENSAIS para este plano anual
};

// ATENÇÃO: Substitua pelos seus Price IDs ANUAIS REAIS
const annualPriceIds: string[] = [
  "price_1RKTGSR5X4PxrShi5pNwghGv",
  "price_1RKTJFR5X4PxrShibGQspEse",
  "price_1RKTL9R5X4PxrShi9FMIzYuM"
];

// STRIPE_MONTHLY_TOKEN_MARKER_PRICE_ID não é mais necessário para esta abordagem

const handleAddTokens = async (
  supabaseAdmin: SupabaseClient,
  userId: string,
  amount: number,
  description: string,
  transactionType: "subscription" | "purchase" | "adjustment" | "annual_grant" = "subscription",
  metadata: Record<string, unknown> = {}
) => {
  if (amount <= 0) {
    logStep(`Nenhum token a ser adicionado para usuário ${userId}. Quantidade: ${amount}. Descrição: ${description}`);
    return;
  }
  logStep(`Adicionando ${amount} tokens para usuário ${userId}. Descrição: ${description}`, metadata);
  const { error: rpcError } = await supabaseAdmin.rpc('add_user_tokens', { p_user_id: userId, p_amount: amount });
  if (rpcError) {
    logStep(`ERRO CRÍTICO ao chamar RPC 'add_user_tokens' para usuário ${userId}, valor ${amount}: ${rpcError.message}`, { rpcError });
    throw new Error(`Erro RPC ao adicionar tokens: ${rpcError.message}`);
  }
  const { error: transactionError } = await supabaseAdmin.from("token_transactions").insert({
    user_id: userId, amount: amount, transaction_type: transactionType, description: description, metadata: metadata
  });
  if (transactionError) {
    logStep(`AVISO: Erro ao registrar transação de tokens para usuário ${userId}: ${transactionError.message}`, { transactionError });
  } else {
    logStep(`Transação de ${amount} tokens registrada com sucesso para usuário ${userId}.`);
  }
};

const getUserByCustomer = async (
    supabaseAdmin: SupabaseClient,
    stripeCustomerId: string | Stripe.Customer | Stripe.DeletedCustomer | null,
    customerEmail?: string | null
): Promise<{ id: string; email: string | null } | null> => {
    logStep('[getUserByCustomer] Iniciando busca de usuário.', { stripeCustomerIdInput: stripeCustomerId, customerEmailInput: customerEmail });
    if (stripeCustomerId && typeof stripeCustomerId === 'string' && stripeCustomerId.startsWith('cus_')) {
        logStep(`[getUserByCustomer] Tentando buscar por stripe_customer_id: ${stripeCustomerId}`);
        const { data: userByStripeId, error: errorByStripeId, status: statusStripeId } = await supabaseAdmin
            .from("profiles").select("id, email, stripe_customer_id").eq("stripe_customer_id", stripeCustomerId).maybeSingle();
        if (errorByStripeId) { logStep("[getUserByCustomer] Erro na query por stripe_customer_id", { error: errorByStripeId.message, status: statusStripeId }); }
        else { logStep("[getUserByCustomer] Resultado da query por stripe_customer_id:", { userByStripeIdCount: userByStripeId ? 1:0, status: statusStripeId }); }
        if (userByStripeId) {
            logStep(`[getUserByCustomer] Usuário encontrado por stripe_customer_id: ${userByStripeId.id}`);
            return { id: userByStripeId.id, email: userByStripeId.email };
        }
    } else { logStep("[getUserByCustomer] stripe_customer_id inválido ou não fornecido.", { stripeCustomerId });}
    if (customerEmail && typeof customerEmail === 'string') {
        logStep(`[getUserByCustomer] Tentando buscar por email: ${customerEmail.toLowerCase()}`);
        const normalizedEmail = customerEmail.toLowerCase(); 
        const { data: userByEmail, error: errorByEmail, status: statusEmail } = await supabaseAdmin
            .from("profiles").select("id, email, stripe_customer_id").eq("email", normalizedEmail).maybeSingle();
        if (errorByEmail) { logStep("[getUserByCustomer] Erro na query por email", { error: errorByEmail.message, status: statusEmail }); }
        else { logStep("[getUserByCustomer] Resultado da query por email:", { userByEmailCount: userByEmail ? 1:0, status: statusEmail }); }
        if (userByEmail) {
            logStep(`[getUserByCustomer] Usuário encontrado por email: ${userByEmail.id}`);
            return { id: userByEmail.id, email: userByEmail.email };
        }
    } else { logStep("[getUserByCustomer] Email inválido ou não fornecido.", { customerEmail });}
    logStep("[getUserByCustomer] Usuário não encontrado por nenhum método.", { stripeCustomerId, customerEmail });
    return null;
};

const updateProfileWithStripeCustomerId = async (
    supabaseAdmin: SupabaseClient, userId: string, stripeCustomerId: string
): Promise<void> => {
    if (!userId || typeof userId !== 'string' || !userId.trim()) { /* ... log erro ... */ return; }
    if (!stripeCustomerId || typeof stripeCustomerId !== 'string' || !stripeCustomerId.trim() || !stripeCustomerId.startsWith('cus_')) { /* ... log erro ... */ return; }
    try {
        logStep(`[updateProfile] Associando stripe_customer_id ${stripeCustomerId} ao usuário ${userId}`);
        const { error } = await supabaseAdmin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", userId);
        if (error) { logStep(`[updateProfile] ERRO ao associar stripe_customer_id: ${error.message}`, { error }); }
        else { logStep(`[updateProfile] stripe_customer_id ${stripeCustomerId} associado com sucesso ao usuário ${userId}`); }
    } catch (error:any) { logStep(`[updateProfile] EXCEÇÃO ao associar stripe_customer_id: ${error.message}`, { errorName: error.name }); }
};

// A função createOrUpdateAnnualSchedule NÃO é mais necessária nesta abordagem. REMOVA-A.

serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response(null, { status: 204, headers: corsHeaders }); }
  try {
    logStep("Webhook Stripe recebido", { method: req.method, url: req.url });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) { return new Response(JSON.stringify({error:"Assinatura Stripe ausente"}),{status:400, headers:corsHeaders});}
    
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeSecretKey || !webhookSecret) { return new Response(JSON.stringify({error:"Configuração de servidor Stripe incompleta"}),{status:500, headers:corsHeaders});}

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
    let event: Stripe.Event | undefined = undefined;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep(`Assinatura verificada. Evento ID: ${event.id}, Tipo: ${event.type}`);
    } catch (error: any) {
      logStep(`ERRO na verificação da assinatura: ${error.message}`, { errorName: error.name });
      return new Response(JSON.stringify({ error: `Erro assinatura webhook: ${error.message}` }), { status: 400, headers:corsHeaders });
    }
    if (!event || typeof event.type === 'undefined') {
        logStep("ERRO CRÍTICO: Objeto evento Stripe inválido APÓS verificação.", {eventObject: event});
        return new Response(JSON.stringify({ error: "Objeto de evento Stripe inválido" }), { status: 500, headers:corsHeaders });
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) { return new Response(JSON.stringify({error:"Configuração Supabase incompleta"}),{status:500, headers:corsHeaders});}
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep(`Evento 'customer.subscription.created', ID: ${subscription.id}, Status: ${subscription.status}`);
        if (subscription.status === "active") {
          const priceId = subscription.items.data[0]?.price.id;
          const tokensToAdd = priceId ? planoTokensMensais[priceId] : 0;
          if (tokensToAdd > 0 && priceId) {
            const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            let user = await getUserByCustomer(supabaseAdmin, customer.id, customer.email);
            if (!user?.id && customer.metadata?.client_reference_id) {
              const userIdCR = customer.metadata.client_reference_id as string;
              const { data: userByRefId } = await supabaseAdmin.from("profiles").select("id, email").eq("id", userIdCR).maybeSingle();
              if (userByRefId) user = userByRefId;
            }
            if (user?.id) {
              logStep(`[cs.created] Usuário ${user.id} para sub ATIVA ${subscription.id}. Price: ${priceId}, Tokens: ${tokensToAdd}`);
              const { data: existingTx, error: txErr } = await supabaseAdmin.from('token_transactions')
                .select('id', {count: 'exact', head: true}).eq('metadata->>subscription_id', subscription.id)
                .eq('metadata->>event_type', 'customer.subscription.created_active').limit(1);
              if(txErr) logStep(`[cs.created] Erro check tx: ${txErr.message}`);
              if (existingTx && existingTx.count && existingTx.count > 0) {
                logStep(`[cs.created] Sub ${subscription.id} (ativa) já processada.`);
              } else {
                await handleAddTokens( supabaseAdmin, user.id, tokensToAdd, `Crédito inicial por nova assinatura ATIVA (${priceId})`, "subscription",
                  { subscription_id: subscription.id, price_id: priceId, invoice_id: subscription.latest_invoice, event_type: 'customer.subscription.created_active' });
                await updateProfileWithStripeCustomerId(supabaseAdmin, user.id, customer.id);
                if (annualPriceIds.includes(priceId)) {
                  const nextGrant = new Date(); nextGrant.setMonth(nextGrant.getMonth() + 1);
                  const { error: trkErr } = await supabaseAdmin.from('annual_token_renewal_tracker').upsert({
                      stripe_subscription_id: subscription.id, user_id: user.id, stripe_customer_id: customer.id,
                      stripe_annual_price_id: priceId, tokens_per_month: tokensToAdd,
                      next_token_grant_date: nextGrant.toISOString().split('T')[0], granted_months_this_cycle: 1, status: 'active', updated_at: new Date().toISOString()
                    }, { onConflict: 'stripe_subscription_id' });
                  if (trkErr) logStep(`[cs.created] Erro tracker anual para ${subscription.id}:`, trkErr); else logStep(`[cs.created] Tracker anual config para ${subscription.id}.`);
                }
              }
            } else { logStep(`[cs.created] ERRO: Usuário não para sub ATIVA ${subscription.id}.`); }
          } else { logStep(`[cs.created] AVISO: Plano/tokens não reconhecidos para sub ATIVA ${subscription.id}.`); }
        } else { logStep(`[cs.created] Sub ${subscription.id} status ${subscription.status}. Ações via invoice.paid.`); }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep(`Evento 'customer.subscription.updated', ID: ${subscription.id}, Status: ${subscription.status}`);
        const currentPriceId = subscription.items.data[0]?.price.id;

        if (["canceled", "unpaid", "past_due"].includes(subscription.status)) {
          logStep(`[cs.updated] Sub ${subscription.id} status ${subscription.status}. Desativando tracker anual.`);
          await supabaseAdmin.from('annual_token_renewal_tracker').update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscription.id);
        } else if (subscription.status === "active") {
          const oldPriceId = event.data.previous_attributes?.items?.data?.[0]?.price?.id;
          if (currentPriceId && oldPriceId && currentPriceId !== oldPriceId) { // Mudança de plano
            logStep(`[cs.updated] Mudança de plano para ${subscription.id}: de ${oldPriceId} para ${currentPriceId}`);
            const customerStripeObj = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
            const user = await getUserByCustomer(supabaseAdmin, customerStripeObj.id, customerStripeObj.email);
            if (user?.id && currentPriceId) {
              const newTokensMonthly = planoTokensMensais[currentPriceId] || 0;
              const oldTokensMonthly = planoTokensMensais[oldPriceId] || 0;
              const tokensDifference = newTokensMonthly - oldTokensMonthly;
              logStep(`[cs.updated] Detalhes da mudança: Novo (${currentPriceId})=${newTokensMonthly}tk, Antigo (${oldPriceId})=${oldTokensMonthly}tk. Dif=${tokensDifference}tk`);
              if (tokensDifference > 0) { // UPGRADE
                const {data: existingAdj} = await supabaseAdmin.from('token_transactions').select('id', {count:'exact', head:true})
                  .eq('metadata->>event_id', event.id).eq('transaction_type', 'adjustment').limit(1);
                if(existingAdj && existingAdj.count && existingAdj.count > 0) {logStep(`[cs.updated] Ajuste para evento ${event.id} já feito.`);}
                else {
                  await handleAddTokens(supabaseAdmin, user.id, tokensDifference,
                    `Crédito de ${tokensDifference} tokens por upgrade de ${oldPriceId} para ${currentPriceId}`, "adjustment",
                    { subscription_id: subscription.id, old_price_id: oldPriceId, new_price_id: currentPriceId, event_id: event.id });
                }
              } else { logStep(`[cs.updated] Downgrade/mudança lateral. Sem tokens diferenciais.`); }
              
              const newPlanIsAnnual = annualPriceIds.includes(currentPriceId);
              const oldPlanWasAnnual = annualPriceIds.includes(oldPriceId);

              if (newPlanIsAnnual && !oldPlanWasAnnual) { // Mensal para Anual
                logStep(`[cs.updated] Mudou de mensal para anual (${currentPriceId}). Tracker será criado/atualizado por invoice.paid.`);
                // O invoice.paid para o novo plano anual cuidará do tracker.
              } else if (oldPlanWasAnnual && !newPlanIsAnnual) { // Anual para Mensal
                logStep(`[cs.updated] Mudou de anual para mensal (${currentPriceId}). Desativando tracker anual.`);
                await supabaseAdmin.from('annual_token_renewal_tracker').update({ status: 'inactive', updated_at: new Date().toISOString() })
                  .eq('stripe_subscription_id', subscription.id);
              } else if (newPlanIsAnnual && oldPlanWasAnnual && currentPriceId !== oldPriceId) { // Anual para Anual Diferente
                logStep(`[cs.updated] Mudou entre planos anuais: de ${oldPriceId} para ${currentPriceId}. Tracker será atualizado por invoice.paid.`);
                // O invoice.paid do novo plano anual cuidará de atualizar o tracker (via upsert).
              }
            } else { logStep(`[cs.updated] AVISO: Usuário não encontrado ou priceId ausente para sub ${subscription.id}.`);}
          } else { logStep(`[cs.updated] Atualização da sub ${subscription.id} sem mudança de plano.`); }
        } else { logStep(`[cs.updated] Sub ${subscription.id} status ${subscription.status} não requer ação aqui.`);}
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        let resolvedSubscriptionId = invoice.subscription as string | undefined;
        let subscriptionSource = "invoice.subscription";
        if (!resolvedSubscriptionId && invoice.lines?.data?.length > 0) {
            const lineWithSub = invoice.lines.data.find(line => line.subscription);
            if (lineWithSub) { resolvedSubscriptionId = lineWithSub.subscription as string; subscriptionSource = "line.subscription"; }
            else {
                for (const line of invoice.lines.data) {
                    const parentDetails = line.parent as any; 
                    if (parentDetails?.type === "subscription_item_details" && parentDetails?.subscription_item_details?.subscription) {
                        resolvedSubscriptionId = parentDetails.subscription_item_details.subscription as string;
                        subscriptionSource = "line.parent.sub_item_details.sub"; break; 
                    }
                }
            }
        }
        logStep(`Evento 'invoice.paid', ID: ${invoice.id}, Sub(de ${subscriptionSource}):${resolvedSubscriptionId}, Motivo:${invoice.billing_reason}, Cliente:${invoice.customer}, Status:${invoice.status}, Paid:${invoice.paid}`);
        const condSubId = !!resolvedSubscriptionId && typeof resolvedSubscriptionId === 'string' && resolvedSubscriptionId.startsWith('sub_');
        const condPaid = !!invoice.paid || invoice.status === 'paid';
        const condCustomer = !!invoice.customer && typeof invoice.customer === 'string';
        logStep(`[invoice.paid] Condições para ${invoice.id}: subIdOk=${condSubId}, isPaid=${condPaid}, hasCust=${condCustomer}, final=${(condSubId && condPaid && condCustomer)}`);

        if (condSubId && condPaid && condCustomer) {
          const currentSubscriptionId = resolvedSubscriptionId as string;
          try {
            const subscriptionDetails = await stripe.subscriptions.retrieve(currentSubscriptionId, { expand: ["items.data.price"] });
            const customerStripeObj = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
            let user = await getUserByCustomer(supabaseAdmin, customerStripeObj.id, customerStripeObj.email);
             if (!user?.id && customerStripeObj.metadata?.client_reference_id) { /* ... lógica client_reference_id ... */ }

            if (user?.id) {
              logStep(`[invoice.paid] Usuário ${user.id} para invoice ${invoice.id}. Sub ${currentSubscriptionId}. Metadata da Sub: ${JSON.stringify(subscriptionDetails.metadata)}`);
              let tokensToGrant = 0; let desc = ""; let priceId = "";
              
              if (invoice.billing_reason === 'subscription_update') {
                logStep(`[invoice.paid] Fatura ${invoice.id} (motivo: subscription_update). Tokens diferenciais tratados por 'cs.updated'. Nenhuma concessão de tokens aqui.`);
                // Para 'subscription_update', cs.updated já tratou da diferença.
                // Se for uma atualização PARA um plano anual, precisamos configurar/resetar o tracker.
                priceId = subscriptionDetails.items.data[0]?.price.id || "";
                if (annualPriceIds.includes(priceId)) {
                    const tokensPerMonth = planoTokensMensais[priceId] || 0;
                    if (tokensPerMonth > 0) {
                        logStep(`[invoice.paid] Atualização para plano anual ${priceId}. Configurando/Resetando rastreador anual.`);
                        const nextGrant = new Date(); nextGrant.setMonth(nextGrant.getMonth() + 1);
                        await supabaseAdmin.from('annual_token_renewal_tracker').upsert({
                            stripe_subscription_id: currentSubscriptionId, user_id: user.id, stripe_customer_id: customerStripeObj.id,
                            stripe_annual_price_id: priceId, tokens_per_month: tokensPerMonth,
                            next_token_grant_date: nextGrant.toISOString().split('T')[0], granted_months_this_cycle: 0, /* Será 1 após o primeiro grant do cron */ status: 'active', updated_at: new Date().toISOString()
                        }, { onConflict: 'stripe_subscription_id' });
                         // O PRIMEIRO LOTE DE TOKENS PARA O NOVO PLANO ANUAL APÓS UPDATE SERÁ DADO PELO CRON JOB.
                         // Ou, se preferir, conceda tokensDifference + o primeiro mês aqui, mas a lógica de cs.updated teria que mudar.
                         // A lógica atual em cs.updated já dá a diferença ou o valor total do novo plano.
                         // Para simplificar, vamos assumir que cs.updated deu os tokens corretos para a transição.
                         // O tracker aqui é preparado para o cron job começar a gotejar a partir do próximo mês.
                         // Se o cs.updated já deu o valor TOTAL do novo plano anual (tokens do primeiro mês), então granted_months_this_cycle seria 1.
                         // Ajustando para refletir que o invoice.paid de um 'subscription_create' ou 'subscription_cycle' anual concede o primeiro mês:
                         // Se billing_reason é update, o cs.updated deu a diferença. A próxima cobrança normal (cycle) do plano anual tratará o tracker.
                         // Melhor: invoice.paid para 'subscription_create' ou 'subscription_cycle' de plano anual concede o 1º lote e seta o tracker.
                    }
                }
              } else { // subscription_create ou subscription_cycle
                if (subscriptionDetails.items?.data?.length > 0 && subscriptionDetails.items.data[0].price?.id) {
                  priceId = subscriptionDetails.items.data[0].price.id;
                  logStep(`[invoice.paid] Price ID da assinatura ${currentSubscriptionId} é: ${priceId}`);
                  if (annualPriceIds.includes(priceId)) {
                    tokensToGrant = planoTokensMensais[priceId] || 0;
                    desc = `Crédito inicial/anual (${tokensToGrant}) para plano ${priceId}`;
                    if (tokensToGrant > 0) {
                      const nextGrant = new Date(); nextGrant.setMonth(nextGrant.getMonth() + 1);
                      const tokensPerMonth = planoTokensMensais[priceId] || 0;
                      await supabaseAdmin.from('annual_token_renewal_tracker').upsert({
                          stripe_subscription_id: currentSubscriptionId, user_id: user.id, stripe_customer_id: customerStripeObj.id,
                          stripe_annual_price_id: priceId, tokens_per_month: tokensPerMonth,
                          next_token_grant_date: nextGrant.toISOString().split('T')[0], granted_months_this_cycle: 1, status: 'active', updated_at: new Date().toISOString()
                      }, { onConflict: 'stripe_subscription_id' });
                      logStep(`[invoice.paid] Rastreador anual config/reset para sub ${currentSubscriptionId}.`);
                    }
                  } else if (planoTokensMensais[priceId]) {
                    tokensToGrant = planoTokensMensais[priceId] || 0;
                    desc = (invoice.billing_reason === 'subscription_create') ? `Crédito inicial (${tokensToGrant}) por nova sub mensal ${priceId}` : `Crédito (${tokensToGrant}) por pag de plano mensal ${priceId}`;
                  } else { logStep(`[invoice.paid] Price ID ${priceId} não mapeado.`); }
                } else { logStep(`[invoice.paid] Sub ${currentSubscriptionId} sem itens/priceId.`); }
              }
              
              if (tokensToGrant > 0 && desc && priceId) {
                const { data: existingTx } = await supabaseAdmin.from('token_transactions').select('id').eq('metadata->>invoice_id', invoice.id).limit(1).maybeSingle();
                if (existingTx) { logStep(`[invoice.paid] Invoice ${invoice.id} JÁ PROCESSADA. Pulando tokens.`); }
                else {
                  logStep(`[invoice.paid] PREPARANDO handleAddTokens para invoice ${invoice.id}: user=${user.id}, tokens=${tokensToGrant}, price='${priceId}'`);
                  await handleAddTokens(supabaseAdmin, user.id, tokensToGrant, desc, "subscription", { subscription_id: currentSubscriptionId, invoice_id: invoice.id, price_id: priceId });
                }
              } else { logStep(`[invoice.paid] Sem tokens a conceder para invoice ${invoice.id} ou dados insuficientes. Tokens: ${tokensToGrant}, Desc: '${desc}', Price: '${priceId}'`);}
              await updateProfileWithStripeCustomerId(supabaseAdmin, user.id, customerStripeObj.id);
            } else { logStep(`[invoice.paid] AVISO CRÍTICO: Usuário não encontrado para invoice ${invoice.id}.`); }
          } catch (error: any) { logStep(`[invoice.paid] ERRO ao processar invoice ${invoice.id}: ${error.message}`, { error_name: error.name }); }
        } else { logStep(`[invoice.paid] CONDIÇÃO PRINCIPAL FALHOU para Invoice ${invoice.id}. Ignorando.`);}
        break;
      }
      
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep(`Evento 'payment_intent.succeeded'. ID: ${paymentIntent.id}, Fatura: ${paymentIntent.invoice}`);
        if (paymentIntent.invoice) {
          logStep(`[pi.succeeded] PI ${paymentIntent.id} associado à fatura ${paymentIntent.invoice}. Será tratado por 'invoice.paid'.`);
          break;
        }
        const customerId = paymentIntent.customer as string;
        const tokenAmountStr = paymentIntent.metadata?.token_amount; 
        const userIdFromMetadata = paymentIntent.metadata?.user_id; 
        if (tokenAmountStr && (customerId || userIdFromMetadata)) {
            let user: { id: string; email: string | null } | null = null;
            if (userIdFromMetadata) user = { id: userIdFromMetadata, email: null };
            else if (customerId) {
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                user = await getUserByCustomer(supabaseAdmin, customer.id, customer.email);
            }
          if (user?.id) {
            const tokenAmount = parseInt(tokenAmountStr, 10);
            if (!isNaN(tokenAmount) && tokenAmount > 0) {
              await handleAddTokens( supabaseAdmin, user.id, tokenAmount, `Compra avulsa de ${tokenAmount} tokens`, "purchase", { payment_intent_id: paymentIntent.id });
            } else { logStep(`[pi.succeeded] AVISO: Metadado 'token_amount' (${tokenAmountStr}) inválido para PI ${paymentIntent.id}`);}
          } else { logStep(`[pi.succeeded] AVISO: Usuário não encontrado para PI ${paymentIntent.id}`);}
        } else { logStep(`[pi.succeeded] AVISO: Metadados 'token_amount' ou customer/user_id ausentes no PI ${paymentIntent.id}`);}
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep(`Evento 'checkout.session.completed', ID: ${session.id}, Modo: ${session.mode}, Status Pag.: ${session.payment_status}`);
        if (session.payment_status === "paid") {
          if (session.mode === "subscription") {
            logStep(`[cs.completed] Sessão checkout para sub ${session.subscription} concluída. Ações principais em outros eventos.`);
            if (session.customer && session.client_reference_id) { 
                const stripeCustomerId = session.customer as string;
                const internalUserId = session.client_reference_id;
                logStep(`[cs.completed] Associando stripe_customer_id ${stripeCustomerId} ao usuário ${internalUserId} via checkout session.`);
                const {data: profile} = await supabaseAdmin.from('profiles').select('id, stripe_customer_id').eq('id', internalUserId).maybeSingle();
                if (profile && (!profile.stripe_customer_id || profile.stripe_customer_id !== stripeCustomerId) ) { // Associar ou atualizar se diferente
                    await updateProfileWithStripeCustomerId(supabaseAdmin, internalUserId, stripeCustomerId); // Usa a função helper
                    // Também adicionar o client_reference_id aos metadados do cliente Stripe para referência futura
                    try {
                        await stripe.customers.update(stripeCustomerId, { metadata: {  client_reference_id: internalUserId } });
                        logStep(`[cs.completed] Metadados do cliente Stripe ${stripeCustomerId} atualizados com client_reference_id.`);
                    } catch (error: any) { logStep(`[cs.completed] Erro ao atualizar metadados do cliente Stripe: ${error.message}`); }
                } else if (!profile) {
                    logStep(`[cs.completed] AVISO: Perfil com ID ${internalUserId} (client_reference_id) não encontrado no Supabase.`);
                } else {
                    logStep(`[cs.completed] Usuário ${internalUserId} já possui stripe_customer_id ${profile.stripe_customer_id} correto.`);
                }
            } else { logStep(`[cs.completed] AVISO: Sessão checkout sem cliente (${session.customer}) ou client_reference_id (${session.client_reference_id}).`); }
          } else if (session.mode === "payment") {
            logStep(`[cs.completed] Sessão checkout para pagamento avulso (PI: ${session.payment_intent}) concluída. Ações em 'payment_intent.succeeded'.`);
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep(`[cs.deleted] Evento 'customer.subscription.deleted', ID: ${subscription.id}`);
        await supabaseAdmin.from('annual_token_renewal_tracker')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id);
        logStep(`[cs.deleted] Tracker para sub ${subscription.id} marcado como inativo (se existia).`);
        break;
      }
      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        logStep(`Evento 'invoice.payment_failed', fatura ${failedInvoice.id}, Sub: ${failedInvoice.subscription}`);
        if (failedInvoice.subscription) {
          const subId = failedInvoice.subscription as string;
           await supabaseAdmin.from('annual_token_renewal_tracker')
            .update({ status: 'payment_failed', updated_at: new Date().toISOString() }) // Um status específico
            .eq('stripe_subscription_id', subId);
          logStep(`[inv.payment_failed] Tracker para sub ${subId} status atualizado para payment_failed (se existia).`);
        }
        break;
      }
      default:
        logStep(`Evento '${event.type}' recebido, ignorando.`);
    }

    logStep(`Processamento do evento ${event.id} concluído.`);
    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200});
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep(`ERRO GERAL NÃO TRATADO: ${errorMessage}`, { stack: error.stack, errorObj: error });
    return new Response(JSON.stringify({ error: `Erro interno: ${errorMessage}` }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500});
  }
});
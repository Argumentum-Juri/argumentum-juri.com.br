-- Create unified subscription tracker table
CREATE TABLE public.subscription_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- 'monthly', 'annual'
  billing_cycle TEXT NOT NULL, -- 'monthly', 'annual'
  tokens_per_cycle INTEGER NOT NULL,
  next_token_grant_date DATE NOT NULL,
  granted_cycles_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscription_tracker 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" 
ON public.subscription_tracker 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_subscription_tracker_updated_at
BEFORE UPDATE ON public.subscription_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Migrate existing data from annual_token_renewal_tracker
INSERT INTO public.subscription_tracker (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  plan_type,
  billing_cycle,
  tokens_per_cycle,
  next_token_grant_date,
  granted_cycles_count,
  status,
  created_at,
  updated_at
)
SELECT 
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_annual_price_id,
  'annual',
  'annual',
  tokens_per_month,
  next_token_grant_date,
  granted_months_this_cycle,
  status,
  created_at,
  updated_at
FROM public.annual_token_renewal_tracker;

-- Create function to process subscription renewals
CREATE OR REPLACE FUNCTION public.process_subscription_renewals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subscription_record RECORD;
    v_user_id UUID;
    v_tokens_to_grant INTEGER;
    v_description TEXT;
    v_metadata JSONB;
    v_next_grant_date DATE;
    v_new_granted_cycles INTEGER;
    processed_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '[process_subscription_renewals] Iniciando processo em %', NOW();

    FOR subscription_record IN
        SELECT *
        FROM public.subscription_tracker
        WHERE status = 'active' AND next_token_grant_date <= current_date
    LOOP
        RAISE NOTICE '[process_subscription_renewals] Processando subscription_id: %, user_id: %', 
            subscription_record.stripe_subscription_id, subscription_record.user_id;

        v_user_id := subscription_record.user_id;
        v_tokens_to_grant := subscription_record.tokens_per_cycle;
        
        v_description := 'Crédito de ' || v_tokens_to_grant::TEXT || 
                         ' tokens para plano ' || subscription_record.plan_type || 
                         ' (ID Plano: ' || subscription_record.stripe_price_id || ')';
        v_metadata := jsonb_build_object(
            'subscription_tracker_id', subscription_record.id,
            'stripe_subscription_id', subscription_record.stripe_subscription_id,
            'plan_type', subscription_record.plan_type,
            'billing_cycle', subscription_record.billing_cycle,
            'cycle_number', subscription_record.granted_cycles_count + 1
        );

        BEGIN
            -- Add tokens
            PERFORM public.add_user_tokens(v_user_id, v_tokens_to_grant);
            RAISE NOTICE '[process_subscription_renewals] Tokens adicionados para user % com % tokens.', v_user_id, v_tokens_to_grant;

            -- Register transaction
            INSERT INTO public.token_transactions (user_id, amount, transaction_type, description, metadata)
            VALUES (v_user_id, v_tokens_to_grant, 'subscription_renewal', v_description, v_metadata);
            RAISE NOTICE '[process_subscription_renewals] Transação registrada para user %.', v_user_id;

            v_new_granted_cycles := subscription_record.granted_cycles_count + 1;
            
            -- Calculate next grant date based on billing cycle
            IF subscription_record.billing_cycle = 'monthly' THEN
                v_next_grant_date := subscription_record.next_token_grant_date + INTERVAL '1 month';
            ELSIF subscription_record.billing_cycle = 'annual' THEN
                v_next_grant_date := subscription_record.next_token_grant_date + INTERVAL '1 month';
            END IF;

            -- Update subscription tracker
            UPDATE public.subscription_tracker
            SET 
                next_token_grant_date = v_next_grant_date,
                granted_cycles_count = v_new_granted_cycles,
                updated_at = NOW()
            WHERE id = subscription_record.id;

            RAISE NOTICE '[process_subscription_renewals] Subscription % atualizado. Próximo grant: %, Ciclos concedidos: %', 
                subscription_record.id, v_next_grant_date, v_new_granted_cycles;
            processed_count := processed_count + 1;

        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING '[process_subscription_renewals] ERRO ao processar subscription_id % para user_id %: % - SQLSTATE: %', 
                    subscription_record.id, v_user_id, SQLERRM, SQLSTATE;
                error_count := error_count + 1;
        END;
    END LOOP;

    RAISE NOTICE '[process_subscription_renewals] Processamento concluído. Renovações: %, Erros: %', processed_count, error_count;
END;
$$;
-- Limpeza dos índices conflitantes em token_transactions.stripe_session_id
-- Remove índices existentes que podem estar causando ambiguidade
DROP INDEX IF EXISTS token_transactions_stripe_session_id_idx;
DROP INDEX IF EXISTS idx_token_transactions_stripe_session_id;

-- Remove constraint se existir
ALTER TABLE public.token_transactions 
DROP CONSTRAINT IF EXISTS token_transactions_stripe_session_id_key;

-- Cria um único índice único simples para stripe_session_id
CREATE UNIQUE INDEX token_transactions_stripe_session_id_unique_idx
  ON public.token_transactions (stripe_session_id);

-- Recria a função purchase_tokens_idempotent com lógica correta
CREATE OR REPLACE FUNCTION public.purchase_tokens_idempotent(
  p_user_id     uuid,
  p_amount      integer,
  p_session_id  text,
  p_description text DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_transaction_inserted boolean := false;
BEGIN
  -- 1) Tenta inserir a transação (única pela stripe_session_id)
  INSERT INTO public.token_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    stripe_session_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount,
    'purchase',
    COALESCE(p_description, format('Compra via Stripe – %s tokens', p_amount)),
    p_session_id,
    p_metadata
  )
  ON CONFLICT (stripe_session_id) DO NOTHING;

  -- Verifica se inseriu (primeira vez) ou não (duplicata)
  GET DIAGNOSTICS v_transaction_inserted = ROW_COUNT;
  
  -- Se já foi processado antes, retorna false
  IF v_transaction_inserted = 0 THEN
    RETURN false;
  END IF;

  -- 2) UPSERT atômico em user_tokens usando o índice único user_id
  INSERT INTO public.user_tokens (user_id, tokens, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET tokens     = public.user_tokens.tokens + EXCLUDED.tokens,
        updated_at = NOW();

  RETURN true; -- Tokens foram creditados pela primeira vez
END;
$$;

-- Garante permissão de execução
GRANT EXECUTE ON FUNCTION public.purchase_tokens_idempotent(uuid, integer, text, text, jsonb) TO public;
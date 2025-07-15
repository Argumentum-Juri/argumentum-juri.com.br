-- Corrigir duplicação de tokens na função purchase_tokens_idempotent
-- Remove o UPSERT da função e deixa apenas o trigger fn_adjust_user_tokens fazer o trabalho

DROP FUNCTION IF EXISTS public.purchase_tokens_idempotent(uuid, integer, text, text, jsonb);

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
  v_rows_affected integer := 0;
BEGIN
  -- 1) Tenta inserir a transação (única pela constraint)
  -- O trigger fn_adjust_user_tokens vai automaticamente atualizar user_tokens
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

  -- Verifica quantas linhas foram inseridas
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Se já foi processado antes (0 linhas inseridas), retorna false
  IF v_rows_affected = 0 THEN
    RETURN false;
  END IF;

  -- O trigger fn_adjust_user_tokens já cuidou de atualizar user_tokens
  -- Não precisamos fazer UPSERT manual aqui
  
  RETURN true; -- Tokens foram creditados pela primeira vez via trigger
END;
$$;

-- Garante permissão de execução
GRANT EXECUTE ON FUNCTION public.purchase_tokens_idempotent(uuid, integer, text, text, jsonb) TO public;
-- Implementar função purchase_tokens_idempotent verdadeiramente atômica
-- Elimina condições de corrida usando apenas INSERT ... ON CONFLICT DO UPDATE
CREATE OR REPLACE FUNCTION public.purchase_tokens_idempotent(
  p_user_id     uuid,
  p_amount      integer,
  p_session_id  text,
  p_description text DEFAULT NULL,
  p_metadata    jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  -- 1) Tenta inserir a transação; se já existir, ON CONFLICT DO NOTHING
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

  -- 2) FOUND = true se inseriu de fato (1ª vez); false em duplicata
  IF FOUND THEN
    -- 3) UPSERT atômico no saldo de tokens
    INSERT INTO public.user_tokens (user_id, tokens, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET tokens     = user_tokens.tokens + EXCLUDED.tokens,
          updated_at = NOW();

    RETURN TRUE;   -- creditei
  ELSE
    RETURN FALSE;  -- já tinha sido processado
  END IF;
END;
$$;

-- Garante permissão de execução
GRANT EXECUTE ON FUNCTION public.purchase_tokens_idempotent(uuid, integer, text, text, jsonb) TO public;
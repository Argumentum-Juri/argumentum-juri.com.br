-- Implementar função purchase_tokens_idempotent verdadeiramente atômica
-- Elimina condições de corrida usando apenas INSERT ... ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.purchase_tokens_idempotent(
  p_user_id     uuid,
  p_amount      integer,
  p_session_id  text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  -- 1) Tenta criar a transaction; se já existir, ON CONFLICT DO NOTHING
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
    format('Compra via Stripe – %s tokens', p_amount),
    p_session_id,
    jsonb_build_object('stripe_session_id', p_session_id)
  )
  ON CONFLICT (stripe_session_id) DO NOTHING;

  -- 2) FOUND = true se inseriu de fato (1ª vez); false em duplicata
  IF FOUND THEN
    -- Atualiza saldo
    UPDATE public.user_tokens
    SET tokens      = tokens + p_amount,
        updated_at  = NOW()
    WHERE user_id = p_user_id;

    -- Se não existe linha, insere
    IF NOT FOUND THEN
      INSERT INTO public.user_tokens (user_id, tokens)
      VALUES (p_user_id, p_amount);
    END IF;

    RETURN TRUE;   -- creditei
  ELSE
    RETURN FALSE;  -- já tinha sido processado
  END IF;
END;
$$;

-- Garante permissão de execução
GRANT EXECUTE ON FUNCTION public.purchase_tokens_idempotent(uuid, integer, text) TO public;
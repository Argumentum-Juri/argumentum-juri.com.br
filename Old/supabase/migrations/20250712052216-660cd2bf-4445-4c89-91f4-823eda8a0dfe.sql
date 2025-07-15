-- Criar função atômica para compra de tokens com idempotência
CREATE OR REPLACE FUNCTION public.purchase_tokens_idempotent(
  p_user_id        uuid,
  p_amount         integer,
  p_session_id     text,
  p_description    text DEFAULT NULL,
  p_metadata       jsonb DEFAULT '{}'::jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inserted boolean := false;
BEGIN
  -- Tenta registrar a transação; se já existir, não faz nada
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

  -- Verifica se a inserção foi bem-sucedida
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Se inseriu de fato (v_inserted > 0), então credita também no saldo
  IF v_inserted THEN
    -- Atualiza o saldo de tokens do usuário
    UPDATE public.user_tokens
    SET tokens = tokens + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Se o usuário não existir na tabela user_tokens, cria um registro
    IF NOT FOUND THEN
      INSERT INTO public.user_tokens (user_id, tokens)
      VALUES (p_user_id, p_amount);
    END IF;
    
    RETURN true; -- Tokens foram creditados
  ELSE
    RETURN false; -- Transação já existia, nenhum crédito foi dado
  END IF;
END;
$$;
-- Corrigir função purchase_tokens_idempotent com lógica mais robusta
CREATE OR REPLACE FUNCTION public.purchase_tokens_idempotent(
  p_user_id        uuid,
  p_amount         integer,
  p_session_id     text,
  p_description    text DEFAULT NULL,
  p_metadata       jsonb DEFAULT '{}'::jsonb
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transaction_exists boolean := false;
BEGIN
  -- Verifica se a transação já existe
  SELECT EXISTS(
    SELECT 1 FROM public.token_transactions 
    WHERE stripe_session_id = p_session_id
  ) INTO v_transaction_exists;

  -- Se já existe, retorna false (não processa novamente)
  IF v_transaction_exists THEN
    RETURN false;
  END IF;

  -- Insere a transação (primeira vez)
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
  );

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
END;
$$;
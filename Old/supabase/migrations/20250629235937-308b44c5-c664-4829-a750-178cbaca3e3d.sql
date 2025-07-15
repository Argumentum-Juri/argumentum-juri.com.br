
-- 1) Função que atualiza user_tokens automaticamente
CREATE OR REPLACE FUNCTION public.fn_adjust_user_tokens()
RETURNS trigger AS $$
BEGIN
  -- Atualiza o saldo de tokens do usuário
  UPDATE public.user_tokens
  SET tokens = tokens + NEW.amount,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Se o usuário não existir na tabela user_tokens, cria um registro
  IF NOT FOUND THEN
    INSERT INTO public.user_tokens (user_id, tokens)
    VALUES (NEW.user_id, NEW.amount);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Criar o trigger na tabela de transações
DROP TRIGGER IF EXISTS trg_adjust_user_tokens ON public.token_transactions;
CREATE TRIGGER trg_adjust_user_tokens
AFTER INSERT ON public.token_transactions
FOR EACH ROW
EXECUTE FUNCTION public.fn_adjust_user_tokens();

-- Adicionar coluna stripe_session_id na tabela token_transactions para idempotência
ALTER TABLE public.token_transactions 
ADD COLUMN stripe_session_id TEXT;

-- Criar índice único para prevenir processamento duplicado da mesma sessão Stripe
CREATE UNIQUE INDEX token_transactions_stripe_session_unique 
ON public.token_transactions (stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;
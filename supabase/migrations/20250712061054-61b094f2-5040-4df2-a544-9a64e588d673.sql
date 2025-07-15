-- Remove a sobrecarga ambígua da função purchase_tokens_idempotent
-- Mantém apenas a versão com parâmetros opcionais (com defaults)
DROP FUNCTION IF EXISTS public.purchase_tokens_idempotent(uuid, integer, text);
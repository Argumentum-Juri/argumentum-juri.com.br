-- Adiciona constraint única em user_tokens.user_id para permitir ON CONFLICT
-- Isso resolve o erro 42P10: there is no unique or exclusion constraint matching the ON CONFLICT

ALTER TABLE public.user_tokens
ADD CONSTRAINT user_tokens_user_id_unique UNIQUE (user_id);
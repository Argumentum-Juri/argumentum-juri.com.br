
-- Remover o trigger específico primeiro
DROP TRIGGER IF EXISTS sync_team_tokens_after_transaction ON public.token_transactions;

-- Agora remover a função com CASCADE para remover todas as dependências
DROP FUNCTION IF EXISTS public.sync_team_owner_tokens() CASCADE;

-- Executar a migração original
-- 1) Adicionar a coluna team_id como nullable primeiro
ALTER TABLE public.token_transactions 
ADD COLUMN team_id uuid REFERENCES public.teams(id);

-- 2) Atualizar registros existentes com team_id baseado no user_id
-- Busca o primeiro team_id onde o user é owner para cada transação existente
UPDATE public.token_transactions 
SET team_id = (
  SELECT tm.team_id 
  FROM public.team_members tm 
  WHERE tm.user_id = token_transactions.user_id 
    AND tm.role = 'owner'
  LIMIT 1
)
WHERE team_id IS NULL;

-- 3) Criar policies de RLS
DROP POLICY IF EXISTS "insert_token_transactions" ON public.token_transactions;
CREATE POLICY "insert_token_transactions" 
ON public.token_transactions
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    team_id IN (
      SELECT team_id
      FROM public.team_members
      WHERE user_id = auth.uid()
    )
    OR team_id IS NULL  -- Permite inserção sem team_id temporariamente
  )
);

DROP POLICY IF EXISTS "select_token_transactions" ON public.token_transactions;
CREATE POLICY "select_token_transactions" 
ON public.token_transactions
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR team_id IN (
    SELECT team_id
    FROM public.team_members
    WHERE user_id = auth.uid()
  )
);

-- 4) Habilitar RLS na tabela
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

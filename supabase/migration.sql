
-- Criar tabela para controlar as renovações mensais de planos anuais
CREATE TABLE IF NOT EXISTS public.subscription_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  subscription_id TEXT NOT NULL UNIQUE,
  price_id TEXT NOT NULL,
  tokens_per_renewal INTEGER NOT NULL,
  next_renewal_date TIMESTAMPTZ NOT NULL,
  last_renewal_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_subscription_renewals_user_id ON public.subscription_renewals(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_renewals_next_renewal_date ON public.subscription_renewals(next_renewal_date);

-- Adicionar políticas RLS para a tabela subscription_renewals
ALTER TABLE public.subscription_renewals ENABLE ROW LEVEL SECURITY;

-- Permitir que os usuários vejam apenas suas próprias renovações
CREATE POLICY "Usuários podem ver suas próprias renovações" 
ON public.subscription_renewals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que a função de webhook possa inserir registros
CREATE POLICY "webhook_insert_policy" 
ON public.subscription_renewals 
FOR INSERT 
WITH CHECK (true);

-- Permitir que a função de webhook possa atualizar registros
CREATE POLICY "webhook_update_policy" 
ON public.subscription_renewals 
FOR UPDATE 
USING (true);

-- Configurar acionador para atualizar o timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_subscription_renewals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscription_renewals_updated_at
BEFORE UPDATE ON public.subscription_renewals
FOR EACH ROW
EXECUTE FUNCTION update_subscription_renewals_updated_at();

-- Add format_settings column to petitions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'petitions'
    AND column_name = 'format_settings'
  ) THEN
    ALTER TABLE public.petitions ADD COLUMN format_settings JSONB DEFAULT NULL;
  END IF;
END $$;


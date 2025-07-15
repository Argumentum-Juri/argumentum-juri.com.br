-- Corrigir mapeamentos incorretos de tokens na tabela subscription_tracker
-- baseado nos price_ids corretos dos planos

-- Atualizar Essencial para 48 tokens por ciclo
UPDATE public.subscription_tracker 
SET tokens_per_cycle = 48, updated_at = NOW() 
WHERE stripe_price_id = 'price_1RC6CKR5X4PxrShiX6BDVcfL' 
   OR stripe_price_id = 'price_1RKTGSR5X4PxrShi5pNwghGv';

-- Atualizar Avançado para 96 tokens por ciclo 
UPDATE public.subscription_tracker 
SET tokens_per_cycle = 96, updated_at = NOW() 
WHERE stripe_price_id = 'price_1RKTHPR5X4PxrShij5V6JM8e' 
   OR stripe_price_id = 'price_1RKTJFR5X4PxrShibGQspEse';

-- Atualizar Elite para 160 tokens por ciclo
UPDATE public.subscription_tracker 
SET tokens_per_cycle = 160, updated_at = NOW() 
WHERE stripe_price_id = 'price_1RKTKOR5X4PxrShi0OZc2eOK' 
   OR stripe_price_id = 'price_1RKTL9R5X4PxrShi9FMIzYuM';

-- Atualizar plan_type baseado nos price_ids para nomes consistentes
UPDATE public.subscription_tracker 
SET plan_type = 'Essencial'
WHERE stripe_price_id = 'price_1RC6CKR5X4PxrShiX6BDVcfL';

UPDATE public.subscription_tracker 
SET plan_type = 'Essencial Anual'
WHERE stripe_price_id = 'price_1RKTGSR5X4PxrShi5pNwghGv';

UPDATE public.subscription_tracker 
SET plan_type = 'Avançado'
WHERE stripe_price_id = 'price_1RKTHPR5X4PxrShij5V6JM8e';

UPDATE public.subscription_tracker 
SET plan_type = 'Avançado Anual'
WHERE stripe_price_id = 'price_1RKTJFR5X4PxrShibGQspEse';

UPDATE public.subscription_tracker 
SET plan_type = 'Elite'
WHERE stripe_price_id = 'price_1RKTKOR5X4PxrShi0OZc2eOK';

UPDATE public.subscription_tracker 
SET plan_type = 'Elite Anual'
WHERE stripe_price_id = 'price_1RKTL9R5X4PxrShi9FMIzYuM';
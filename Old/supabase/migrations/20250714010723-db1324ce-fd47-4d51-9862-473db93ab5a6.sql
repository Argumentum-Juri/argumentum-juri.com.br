-- Ajustar tokens_per_cycle do plano Premium para 96 tokens (para bater com o plano "Avançado" do frontend)
-- Usuario: teste@teste.com (d319d4c0-84d3-4dc4-84de-2baf71bc8f20)

UPDATE public.subscription_tracker 
SET 
  tokens_per_cycle = 96,
  updated_at = NOW()
WHERE user_id = 'd319d4c0-84d3-4dc4-84de-2baf71bc8f20' 
  AND stripe_subscription_id = 'sub_1RkYwzR5X4PxrShimeXgTq7h';
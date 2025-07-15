-- Atualizar subscription_tracker com os dados corretos do Stripe
-- Usuario: teste@teste.com (d319d4c0-84d3-4dc4-84de-2baf71bc8f20)

UPDATE public.subscription_tracker 
SET 
  stripe_subscription_id = 'sub_1RkYwzR5X4PxrShimeXgTq7h',
  stripe_customer_id = 'cus_SfumS2i4Os5m1t', 
  stripe_price_id = 'price_1RKTHPR5X4PxrShij5V6JM8e',
  billing_cycle = 'monthly',
  plan_type = 'Premium',
  tokens_per_cycle = 100,
  next_token_grant_date = CURRENT_DATE + INTERVAL '1 month',
  updated_at = NOW()
WHERE user_id = 'd319d4c0-84d3-4dc4-84de-2baf71bc8f20';
export const SUBSCRIPTION_PLANS = [
  // Plano Essencial - Mensal
  {
    id: 'essential-monthly',
    name: 'Essencial',
    description: 'Plano ideal para advogados autônomos e pequenos escritórios',
    tokens: 48,
    price: 480.00,
    priceId: 'price_1RC6CKR5X4PxrShiX6BDVcfL',
    billingType: 'monthly' as const,
    features: [
      'Até 48 tokens por mês',
      'Suporte técnico por email',
      'Templates básicos'
    ]
  },
  // Plano Essencial - Anual
  {
    id: 'essential-annual',
    name: 'Essencial Anual',
    description: 'Plano ideal para advogados autônomos e pequenos escritórios',
    tokens: 48,
    price: 432.00, // R$480 × 12 × 0.9 = R$5.184 ÷ 12 = R$432/mês
    priceId: 'price_1RKTGSR5X4PxrShi5pNwghGv',
    billingType: 'annual' as const,
    features: [
      'Até 48 tokens por mês',
      'Suporte técnico por email',
      'Templates básicos',
      '10% de desconto anual'
    ]
  },
  // Plano Avançado - Mensal
  {
    id: 'advanced-monthly',
    name: 'Avançado',
    description: 'Nosso plano mais popular para escritórios de médio porte',
    tokens: 96,
    price: 780.00,
    priceId: 'price_1RKTHPR5X4PxrShij5V6JM8e',
    billingType: 'monthly' as const,
    features: [
      'Até 96 tokens por mês',
      'Suporte técnico prioritário',
      'Templates avançados',
      'Relatórios detalhados'
    ]
  },
  // Plano Avançado - Anual
  {
    id: 'advanced-annual',
    name: 'Avançado Anual',
    description: 'Nosso plano mais popular para escritórios de médio porte',
    tokens: 96,
    price: 702.00, // R$780 × 12 × 0.9 = R$8.424 ÷ 12 = R$702/mês
    priceId: 'price_1RKTJFR5X4PxrShibGQspEse',
    billingType: 'annual' as const,
    features: [
      'Até 96 tokens por mês',
      'Suporte técnico prioritário',
      'Templates avançados',
      'Relatórios detalhados',
      '10% de desconto anual'
    ]
  },
  // Plano Elite - Mensal
  {
    id: 'elite-monthly',
    name: 'Elite',
    description: 'Para escritórios com alta demanda de petições jurídicas',
    tokens: 160,
    price: 1000.00,
    priceId: 'price_1RKTKOR5X4PxrShi0OZc2eOK',
    billingType: 'monthly' as const,
    features: [
      'Até 160 tokens por mês',
      'Suporte técnico 24/7',
      'Templates personalizados',
      'API personalizada',
      'Gerenciamento de equipes'
    ]
  },
  // Plano Elite - Anual
  {
    id: 'elite-annual',
    name: 'Elite Anual',
    description: 'Para escritórios com alta demanda de petições jurídicas',
    tokens: 160,
    price: 900.00, // R$1.000 × 12 × 0.9 = R$10.800 ÷ 12 = R$900/mês
    priceId: 'price_1RKTL9R5X4PxrShi9FMIzYuM',
    billingType: 'annual' as const,
    features: [
      'Até 160 tokens por mês',
      'Suporte técnico 24/7',
      'Templates personalizados',
      'API personalizada',
      'Gerenciamento de equipes',
      '10% de desconto anual'
    ]
  }
];

export const TOKEN_PLANS = [
  {
    id: 'tokens_10',
    name: '10 Tokens',
    tokens: 10,
    price: 19.90,
    priceInCents: 1990
  },
  {
    id: 'tokens_25',
    name: '25 Tokens',
    tokens: 25,
    price: 44.90,
    priceInCents: 4490
  },
  {
    id: 'tokens_50',
    name: '50 Tokens',
    tokens: 50,
    price: 79.90,
    priceInCents: 7990
  },
  {
    id: 'tokens_100',
    name: '100 Tokens',
    tokens: 100,
    price: 149.90,
    priceInCents: 14990
  }
];
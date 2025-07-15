
// Configuração dos planos de tokens disponíveis para compra

export interface TokenPlan {
  id: string;
  name: string;
  tokens: number;
  priceInCents: number;
  discount: number;
  description: string;
  featured?: boolean;
  priceId?: string;  // ID do plano no Stripe
  billingType?: 'monthly' | 'annual'; // Tipo de cobrança
  annualEquivalent?: string; // ID do plano anual correspondente (para planos mensais)
  monthlyEquivalent?: string; // ID do plano mensal correspondente (para planos anuais)
}

// Planos de assinatura
export const SUBSCRIPTION_PLANS: TokenPlan[] = [
  // Plano Essencial - Mensal
  {
    id: 'essential-monthly',
    name: 'Essencial',
    tokens: 48,
    priceInCents: 48000, // R$480,00
    discount: 0,
    description: 'Plano ideal para advogados autônomos e pequenos escritórios',
    billingType: 'monthly',
    priceId: 'price_1RC6CKR5X4PxrShiX6BDVcfL',
    annualEquivalent: 'essential-annual'
  },
  // Plano Essencial - Anual
  {
    id: 'essential-annual',
    name: 'Essencial Anual',
    tokens: 48 * 12, // 576 tokens anuais
    priceInCents: 518400, // R$5.184,00 com 10% de desconto (R$480 × 12 × 0.9)
    discount: 10,
    description: 'Plano ideal para advogados autônomos e pequenos escritórios',
    billingType: 'annual',
    priceId: 'price_1RKTGSR5X4PxrShi5pNwghGv',
    monthlyEquivalent: 'essential-monthly'
  },
  // Plano Avançado - Mensal
  {
    id: 'advanced-monthly',
    name: 'Avançado',
    tokens: 96,
    priceInCents: 78000, // R$780,00
    discount: 0,
    description: 'Nosso plano mais popular para escritórios de médio porte',
    featured: true,
    billingType: 'monthly',
    priceId: 'price_1RKTHPR5X4PxrShij5V6JM8e',
    annualEquivalent: 'advanced-annual'
  },
  // Plano Avançado - Anual
  {
    id: 'advanced-annual',
    name: 'Avançado Anual',
    tokens: 96 * 12, // 1152 tokens anuais
    priceInCents: 842400, // R$8.424,00 com 10% de desconto (R$780 × 12 × 0.9)
    discount: 10,
    description: 'Nosso plano mais popular para escritórios de médio porte',
    billingType: 'annual',
    priceId: 'price_1RKTJFR5X4PxrShibGQspEse',
    monthlyEquivalent: 'advanced-monthly'
  },
  // Plano Elite - Mensal
  {
    id: 'elite-monthly',
    name: 'Elite',
    tokens: 160,
    priceInCents: 100000, // R$1.000,00
    discount: 0,
    description: 'Para escritórios com alta demanda de petições jurídicas',
    billingType: 'monthly',
    priceId: 'price_1RKTKOR5X4PxrShi0OZc2eOK',
    annualEquivalent: 'elite-annual'
  },
  // Plano Elite - Anual
  {
    id: 'elite-annual',
    name: 'Elite Anual',
    tokens: 160 * 12, // 1920 tokens anuais
    priceInCents: 1080000, // R$10.800,00 com 10% de desconto (R$1.000 × 12 × 0.9)
    discount: 10,
    description: 'Para escritórios com alta demanda de petições jurídicas',
    billingType: 'annual',
    priceId: 'price_1RKTL9R5X4PxrShi9FMIzYuM',
    monthlyEquivalent: 'elite-monthly'
  }
];

// Mantendo os planos antigos de compra única para compatibilidade
export const TOKEN_PLANS: TokenPlan[] = [
  {
    id: 'basic',
    name: 'Básico',
    tokens: 20,
    priceInCents: 20000, // R$200,00
    discount: 0,
    description: 'Plano inicial ideal para advogados que estão começando.'
  },
  {
    id: 'standard',
    name: 'Padrão',
    tokens: 60,
    priceInCents: 57000, // R$570,00 (5% de desconto aplicado)
    discount: 5,
    description: 'Nosso plano mais popular para escritórios de médio porte.',
    featured: true
  },
  {
    id: 'premium',
    name: 'Premium',
    tokens: 100,
    priceInCents: 92000, // R$920,00 (8% de desconto aplicado)
    discount: 8,
    description: 'Para escritórios com alta demanda de petições.'
  }
];

// Função para calcular desconto baseado na quantidade de tokens
export const calculateDiscount = (tokens: number): number => {
  if (tokens < 100) return 0;
  if (tokens >= 100 && tokens < 200) return 8;
  if (tokens >= 200 && tokens < 300) return 10;
  return 12; // 12% para acima de 300 tokens
};

// Função para calcular preço com desconto
// Valor fixo de R$10,00 por token (baseado no preço definido pelo usuário)
export const calculatePrice = (tokens: number): number => {
  const basePrice = tokens * 1000; // R$10,00 por token (em centavos)
  const discount = calculateDiscount(tokens);
  return Math.round(basePrice - (basePrice * discount / 100));
};

// Tipos de petição e seus custos em tokens
export interface PetitionType {
  id: string;
  name: string;
  tokenCost: number;
  description: string;
}

export const PETITION_TYPES: PetitionType[] = [
  {
    id: 'initial',
    name: 'Petição Inicial',
    tokenCost: 15,
    description: 'Petição para dar início a um processo judicial'
  },
  {
    id: 'appeal',
    name: 'Recurso',
    tokenCost: 20,
    description: 'Contestação de decisões judiciais'
  },
  {
    id: 'defense',
    name: 'Defesa',
    tokenCost: 25,
    description: 'Defesa em processos judiciais'
  },
  {
    id: 'motion',
    name: 'Petição Incidental',
    tokenCost: 30,
    description: 'Petição para questões secundárias no processo'
  },
  {
    id: 'complaint',
    name: 'Denúncia',
    tokenCost: 35,
    description: 'Formulação de denúncias em processos criminais'
  }
];

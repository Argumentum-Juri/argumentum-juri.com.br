
import React, { FC, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Star } from "lucide-react";
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaText: string;
  highlighted?: boolean;
  billingType: 'monthly' | 'annual';
  tokenAmount: string;
  discount?: string;
  discountedPrice?: string;
}

interface PricingProps {
  className?: string;
}

const PricingSection: FC<PricingProps> = ({ className }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const pricingPlans: PricingPlan[] = [
    // Plano Essencial
    {
      name: "Essencial",
      price: billingCycle === 'monthly' ? "R$ 480" : "R$ 5.760",
      discountedPrice: billingCycle === 'annual' ? "R$ 5.414" : undefined,
      description: "Ideal para advogados autônomos e pequenos escritórios.",
      tokenAmount: billingCycle === 'monthly' ? "48 tokens/mês" : "48 tokens/mês (576 ao ano)",
      features: [
        "Acesso a todas as áreas jurídicas",
        "Entrega em até 48h úteis",
        "Suporte por e-mail",
        "Biblioteca de modelos básicos",
      ],
      ctaText: billingCycle === 'monthly' ? "Assinar Agora" : "Assinar Anualmente",
      billingType: billingCycle,
      discount: billingCycle === 'annual' ? "6%" : undefined
    },
    // Plano Avançado
    {
      name: "Avançado",
      price: billingCycle === 'monthly' ? "R$ 780" : "R$ 9.360",
      discountedPrice: billingCycle === 'annual' ? "R$ 8.611" : undefined,
      description: "Perfeito para escritórios de pequeno e médio porte.",
      tokenAmount: billingCycle === 'monthly' ? "96 tokens/mês" : "96 tokens/mês (1152 ao ano)",
      features: [
        "Todas as funcionalidades do Essencial",
        "Entrega em até 24h úteis",
        "Suporte prioritário",
        "Biblioteca completa de modelos",
        "Dashboard avançado de análise"
      ],
      ctaText: billingCycle === 'monthly' ? "Assinar Agora" : "Assinar Anualmente",
      highlighted: true,
      billingType: billingCycle,
      discount: billingCycle === 'annual' ? "8%" : undefined
    },
    // Plano Elite
    {
      name: "Elite",
      price: billingCycle === 'monthly' ? "R$ 1.000" : "R$ 12.000",
      discountedPrice: billingCycle === 'annual' ? "R$ 10.800" : undefined,
      description: "Solução completa para alta demanda e grandes escritórios.",
      tokenAmount: billingCycle === 'monthly' ? "160 tokens/mês" : "160 tokens/mês (1920 ao ano)",
      features: [
        "Todas as funcionalidades do Avançado",
        "Entrega com SLA definido",
        "Suporte dedicado 24/7",
        "Modelos personalizados",
        "Integrações customizadas",
        "Dashboard premium e relatórios"
      ],
      ctaText: billingCycle === 'monthly' ? "Assinar Agora" : "Assinar Anualmente",
      billingType: billingCycle,
      discount: billingCycle === 'annual' ? "10%" : undefined
    }
  ];

  const getPlanLink = (planName: string): string => {
    if (planName === "Elite") {
      return "/auth?tab=signup";
    }
    return "/auth?tab=signup";
  }

  return (
    <section id="planos" className="py-20 bg-white border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif text-argumentum-gold mb-4">
            Planos Flexíveis para Cada Necessidade
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano Argumentum que melhor se adapta ao seu volume de trabalho e acelere sua produção jurídica.
          </p>
        </div>

        <div className="mb-10 flex justify-center">
          <Tabs 
            defaultValue="monthly" 
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as 'monthly' | 'annual')}
            className="w-full max-w-md mx-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Cobrança Mensal</TabsTrigger>
              <TabsTrigger value="annual">Cobrança Anual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col h-full rounded-xl shadow-md border transition-all duration-300 hover:shadow-lg ${
                plan.highlighted
                ? 'border-argumentum-gold ring-2 ring-argumentum-gold/20 shadow-lg transform hover:-translate-y-1' 
                : 'border-gray-200 hover:border-argumentum-gold/30'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3">
                  <div className="bg-argumentum-gold text-argumentum-dark px-4 py-1 rounded-full text-xs font-semibold shadow-md">
                    Mais Popular
                  </div>
                </div>
              )}
              
              <CardHeader className={`pb-4 ${plan.highlighted ? 'bg-argumentum-gold/10' : ''}`}>
                <CardTitle className="text-2xl font-serif text-argumentum-text">{plan.name}</CardTitle>
                <div className="mt-2 flex flex-col">
                  {/* Exibição de preço com desconto */}
                  {plan.discountedPrice ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-argumentum-text">
                          {plan.discountedPrice}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /ano
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground line-through">
                        Valor regular: {plan.price}/ano
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-argumentum-text">
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {billingCycle === 'monthly' ? '/mês' : '/ano'}
                      </span>
                    </div>
                  )}
                  
                  {plan.discount && (
                    <div className="mt-1 text-sm text-green-600 font-medium">
                      Economize {plan.discount} com pagamento anual
                    </div>
                  )}
                </div>
                <CardDescription className="text-sm text-muted-foreground pt-1 min-h-[40px]">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-grow pt-2">
                <div className="text-sm font-medium text-argumentum-gold mb-3">
                  {plan.tokenAmount}
                </div>
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-4 text-argumentum-gold mr-2.5 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-4">
                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className={`landing-btn ${plan.highlighted
                    ? 'bg-argumentum-gold hover:bg-argumentum-gold/90 text-argumentum-dark' 
                    : 'border-argumentum-gold text-argumentum-gold hover:bg-argumentum-gold/10'
                  }`}
                  asChild
                >
                  <Link to={getPlanLink(plan.name)}>
                    {plan.ctaText}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h3 className="text-3xl font-serif text-argumentum-text mb-10">
            Perguntas Frequentes sobre Planos
          </h3>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="text-left p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <h4 className="font-semibold text-lg mb-2 text-argumentum-text">Como funciona a cobrança?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nossos planos são de assinatura com período de teste gratuito de 7 dias. A cobrança recorrente é feita no cartão de crédito. Oferecemos também a opção de compra de tokens avulsos sem assinatura.
              </p>
            </div>

            <div className="text-left p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <h4 className="font-semibold text-lg mb-2 text-argumentum-text">Posso trocar de plano depois?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sim, a flexibilidade é total. Você pode realizar o upgrade ou downgrade do seu plano a qualquer momento diretamente pela plataforma. As alterações são aplicadas no próximo ciclo de faturamento.
              </p>
            </div>

            <div className="text-left p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <h4 className="font-semibold text-lg mb-2 text-argumentum-text">Existe período de teste gratuito?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sim! Todos os planos incluem um período de teste gratuito de 7 dias para experimentar os recursos da plataforma na prática antes de decidir qual plano é o ideal para você.
              </p>
            </div>

            <div className="text-left p-6 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <h4 className="font-semibold text-lg mb-2 text-argumentum-text">Como funciona o suporte técnico?</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Todos os planos incluem acesso à nossa base de conhecimento e suporte via chamado/email. Os planos Avançado e Elite oferecem canais de suporte prioritários com tempos de resposta reduzidos.
              </p>
            </div>
          </div>
          
          <p className="mt-10 text-muted-foreground text-sm">
            Ainda tem dúvidas? <a href="#contato" className="text-argumentum-gold hover:underline font-medium">Entre em contato</a> ou consulte nosso <a href="/faq" className="text-argumentum-gold hover:underline font-medium">FAQ completo</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

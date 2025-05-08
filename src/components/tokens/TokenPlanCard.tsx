
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TokenPlan } from '@/config/tokenPlans';

interface TokenPlanCardProps {
  title: string;
  description?: string;
  tokenAmount: number;
  price: number;
  discountPercent?: number;
  features?: string[];
  popular?: boolean;
  onClick: () => void;
  loading?: boolean;
  billingType?: 'monthly' | 'annual';
  isCurrentPlan?: boolean;
  loadingSubscription?: boolean;
  hasActiveSubscription?: boolean;
}

// Overload with plan prop for compatibility
interface TokenPlanCardWithPlanProps {
  plan: TokenPlan;
  onPurchase: (planId: string) => Promise<void>;
  isLoading: boolean;
  loadingPlanId: string | null;
  formatCurrency: (price: number) => string;
  isCurrentPlan?: boolean;
  loadingSubscription?: boolean;
  hasActiveSubscription?: boolean;
}

// This function handles both prop types
const TokenPlanCard: React.FC<TokenPlanCardProps | TokenPlanCardWithPlanProps> = (props) => {
  // If the plan prop exists, convert it to the standard props
  if ('plan' in props) {
    const { plan, onPurchase, isLoading, loadingPlanId, isCurrentPlan, loadingSubscription, hasActiveSubscription } = props;
    const loading = isLoading && loadingPlanId === plan.id;
    
    return (
      <TokenPlanCard
        title={plan.name}
        description={plan.description}
        tokenAmount={plan.tokens}
        price={plan.priceInCents}
        discountPercent={plan.discount}
        popular={plan.featured}
        onClick={() => onPurchase(plan.id)}
        loading={loading}
        billingType={plan.billingType}
        isCurrentPlan={isCurrentPlan}
        loadingSubscription={loadingSubscription}
        hasActiveSubscription={hasActiveSubscription}
      />
    );
  }

  // Regular rendering with standard props
  const { 
    title, 
    description, 
    tokenAmount, 
    price, 
    discountPercent = 0, 
    features = [], 
    popular = false, 
    onClick, 
    loading = false,
    billingType,
    isCurrentPlan = false,
    loadingSubscription = false,
    hasActiveSubscription = false
  } = props;
  
  // Calculamos o desconto se houver
  const hasDiscount = discountPercent > 0;
  const originalPrice = hasDiscount ? (price / (1 - (discountPercent / 100))) : price;

  // Determinar o texto do botão com base no estado de assinatura
  let buttonText = 'Carregando...';
  
  if (!loadingSubscription) {
    if (loading) {
      buttonText = 'Processando...';
    } else if (isCurrentPlan) {
      buttonText = 'Plano Atual';
    } else if (hasActiveSubscription) {
      buttonText = 'Gerenciar Assinatura'; // Novo texto para quando tem assinatura mas não é este plano
    } else if (billingType === 'annual' || billingType === 'monthly') {
      buttonText = 'Contratar Assinatura';
    } else {
      buttonText = 'Comprar agora';
    }
  }
  
  // Texto informativo sobre a cobrança
  const billingInfo = billingType === 'monthly' 
    ? tokenAmount > 0 ? `${tokenAmount} tokens por mês` : ''
    : billingType === 'annual' && tokenAmount > 0
      ? `${Math.round(tokenAmount / 12)} tokens por mês`
      : tokenAmount > 0 ? `${tokenAmount} tokens` : '';

  return (
    <Card className={`${isCurrentPlan ? 'border-green-500 shadow-lg' : popular ? 'border-primary shadow-lg' : 'border-border'} flex flex-col h-full`}>
      {popular && !isCurrentPlan && (
        <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 absolute right-4 top-0 transform -translate-y-1/2 rounded-sm">
          Popular
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 absolute right-4 top-0 transform -translate-y-1/2 rounded-sm">
          Plano Atual
        </div>
      )}
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pb-3 flex-grow">
        <div className="flex items-baseline flex-wrap gap-2 mb-4">
          <span className="text-3xl font-bold">
            {formatCurrency(
              billingType === 'annual' ? (price / 1200) : (price / 100)
            )}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(
                billingType === 'annual' ? (originalPrice / 1200) : (originalPrice / 100)
              )}
            </span>
          )}
          {billingType && (
            <span className="text-sm text-muted-foreground ml-1">
              {billingType === 'monthly' ? '/mês' : '/ano'}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {billingInfo && (
            <div className="flex flex-wrap items-center text-sm gap-2">
              <span className="font-semibold text-lg">{billingInfo}</span>
              {hasDiscount && (
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-0.5 rounded whitespace-nowrap">
                  Economize {discountPercent}%
                </span>
              )}
            </div>
          )}
        </div>
        
        {features.length > 0 && (
          <ul className="space-y-2 mt-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      
      <CardFooter className="pt-3">
        <Button 
          onClick={onClick} 
          disabled={loading || loadingSubscription || isCurrentPlan}
          className={`w-full ${isCurrentPlan ? 'bg-green-500 hover:bg-green-600' : hasActiveSubscription ? 'bg-blue-500 hover:bg-blue-600' : ''} whitespace-normal h-auto min-h-10 py-2 px-2 flex items-center justify-center`}
          variant={popular && !hasActiveSubscription ? "default" : "outline"}
        >
          {loading || loadingSubscription ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin flex-shrink-0" />
              {loading ? 'Processando...' : 'Carregando...'}
            </>
          ) : (
            <span className="text-center">{buttonText}</span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TokenPlanCard;

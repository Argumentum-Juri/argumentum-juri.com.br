
import React from 'react';
import { CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateDiscount, calculatePrice } from '@/config/tokenPlans';

interface CustomTokenFormProps {
  customTokens: number;
  onTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPurchase: () => void;
  isLoading: boolean;
  loadingPlanId: string | null;
  formatCurrency: (priceInCents: number) => string;
}

const CustomTokenForm: React.FC<CustomTokenFormProps> = ({
  customTokens,
  onTokenChange,
  onPurchase,
  isLoading,
  loadingPlanId,
  formatCurrency
}) => {
  // Calculate base price (tokens * 10)
  const basePrice = customTokens * 10;
  
  // Calculate discount amount
  const discountPercent = calculateDiscount(customTokens);
  const discountAmount = basePrice * discountPercent / 100;
  
  // Calculate total price (from the calculatePrice function)
  const totalPrice = basePrice - discountAmount;
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Tokens Personalizados</CardTitle>
        <CardDescription>
          Defina a quantidade de Tokens que deseja comprar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="custom-tokens">Quantidade de Tokens</Label>
            <Input
              id="custom-tokens"
              type="number"
              min="20"
              value={customTokens}
              onChange={onTokenChange}
            />
            <p className="text-sm text-muted-foreground">
              Mínimo de 20 Tokens. Quanto maior a quantidade, maior o desconto.
            </p>
          </div>
          
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Preço base:</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Desconto ({discountPercent}%):</span>
              <span className="text-green-600">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full flex items-center justify-center gap-2 whitespace-normal h-auto min-h-10 px-4 py-3 text-sm sm:text-base"
          onClick={onPurchase}
          disabled={isLoading || customTokens < 20}
        >
          {loadingPlanId === 'custom' ? 'Processando...' : (
            <>
              <CreditCard className="h-4 w-4 flex-shrink-0" />
              <span className="text-center">Comprar tokens personalizados</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CustomTokenForm;

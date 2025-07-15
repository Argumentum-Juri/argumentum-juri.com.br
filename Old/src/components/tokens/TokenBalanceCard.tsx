
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, ChevronsRight } from "lucide-react";

interface TokenBalanceCardProps {
  currentTokens: number;
  loading: boolean;
  petitionCost?: number;
}

const TokenBalanceCard: React.FC<TokenBalanceCardProps> = ({ 
  currentTokens, 
  loading,
  petitionCost = 16 
}) => {
  // Calculate how many petitions can be created with current balance
  const possiblePetitions = Math.floor(currentTokens / petitionCost);
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Seu Saldo de Tokens</CardTitle>
        <CardDescription>
          Tokens são utilizados para criar petições jurídicas em nossa plataforma.
          Cada petição custa {petitionCost} tokens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Saldo atual</div>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{currentTokens} tokens</div>
            )}
          </div>
          
          <div className="flex flex-col p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Custo por petição</div>
            <div className="text-2xl font-bold">{petitionCost} tokens</div>
          </div>
          
          <div className="flex flex-col p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">Petições possíveis</div>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                <div className="text-2xl font-bold">{possiblePetitions}</div>
                {possiblePetitions === 0 && (
                  <div className="ml-auto flex items-center text-sm text-amber-600 dark:text-amber-400">
                    <span>Compre tokens</span>
                    <ChevronsRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenBalanceCard;

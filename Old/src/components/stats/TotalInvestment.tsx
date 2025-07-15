
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamOwnership } from '@/hooks/useTeamOwnership';

// Constantes para cache
const INVESTMENT_CACHE_KEY = 'total_investment';
const INVESTMENT_TIMESTAMP_KEY = 'total_investment_timestamp';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos

interface TotalInvestmentProps {
  className?: string;
}

const TotalInvestment: React.FC<TotalInvestmentProps> = ({ className }) => {
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, teamId } = useAuth();
  const { isOwner: isTeamOwner } = useTeamOwnership(teamId);

  useEffect(() => {
    const fetchTotalInvestment = async () => {
      if (!user || !isTeamOwner) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Verificar cache primeiro
        const cachedInvestment = localStorage.getItem(INVESTMENT_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(INVESTMENT_TIMESTAMP_KEY);
        const now = Date.now();
        
        if (cachedInvestment && cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
          setTotalAmount(parseFloat(cachedInvestment));
          setIsLoading(false);
          console.log('[TotalInvestment] Usando investimento total do cache:', cachedInvestment);
          return;
        }
        
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.access_token) return;
        
        const { data, error } = await supabase.functions.invoke('user-stats', {
          body: { statType: 'total-investment' },
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`
          }
        });
        
        if (error) throw error;
        
        // Salvar em cache
        const investmentAmount = data?.totalAmount || 0;
        localStorage.setItem(INVESTMENT_CACHE_KEY, investmentAmount.toString());
        localStorage.setItem(INVESTMENT_TIMESTAMP_KEY, now.toString());
        console.log('[TotalInvestment] Investimento total salvo em cache:', investmentAmount);
        
        setTotalAmount(investmentAmount);
      } catch (error) {
        console.error('Erro ao buscar total de investimentos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalInvestment();
  }, [user, isTeamOwner]);

  if (!isTeamOwner) {
    return null; // Don't render anything if not a team owner
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Investimento Total</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <span className="inline-block animate-pulse bg-muted rounded h-7 w-24"></span>
          ) : (
            <>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format((totalAmount || 0) / 100)}
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Total gasto em tokens e assinaturas</p>
      </CardContent>
    </Card>
  );
};

export default TotalInvestment;

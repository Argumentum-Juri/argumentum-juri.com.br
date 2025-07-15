
import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useGoAuth } from '@/contexts/GoAuthContext';
import { useStatsData } from '@/hooks/useStatsData';
import StatsContainer from '@/components/stats/StatsContainer';
import { useTeamOwnership } from '@/hooks/useTeamOwnership';

const Stats = () => {
  const { user } = useGoAuth();
  const { stats, loading, investmentLoading, investmentError, fetchInvestmentTotal } = useStatsData(user?.id);
  // Por enquanto, assumimos que não há equipe no GoAuthContext
  const { isOwner: isTeamOwner, loading: checkingOwnerStatus } = useTeamOwnership(null);
  
  // Buscar dados de investimento se o usuário for dono da equipe
  useEffect(() => {
    if (isTeamOwner && fetchInvestmentTotal) {
      fetchInvestmentTotal();
    }
  }, [isTeamOwner, fetchInvestmentTotal]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-argumentum-text mb-6">Estatísticas</h1>
        
        {loading || checkingOwnerStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <StatsContainer 
            stats={stats}
            loading={loading}
            investmentLoading={investmentLoading}
            investmentError={investmentError}
            isTeamOwner={isTeamOwner}
          />
        )}
      </div>
    </div>
  );
};

export default Stats;

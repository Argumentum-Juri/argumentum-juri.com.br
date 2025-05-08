
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/contexts/AuthContext';
import { useStatsData } from '@/hooks/useStatsData';
import StatsContainer from '@/components/stats/StatsContainer';

const Stats = () => {
  const { user } = useAuth();
  const { stats, loading, investmentLoading, investmentError } = useStatsData(user?.id);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-argumentum-text mb-6">Estatísticas</h1>
        
        {loading ? (
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
          />
        )}
      </div>
    </div>
  );
};

export default Stats;

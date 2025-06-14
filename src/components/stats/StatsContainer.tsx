
import React from 'react';
import StatCard from './StatCard';
import AverageDeliveryCard from './AverageDeliveryCard';
import MonthlyVolumeChart from './MonthlyVolumeChart';
import DistributionPieChart from './DistributionPieChart';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StatsContainerProps {
  stats: {
    totalPetitions: number;
    totalInProgress: number;
    totalCompleted: number;
    totalInvested: number;
    averageDeliveryTime: number;
    petitionsByType: Array<{ name: string; value: number }>;
    petitionsByArea: Array<{ name: string; value: number }>;
    monthlyPetitions: Array<{ name: string; count: number }>;
  };
  loading: boolean;
  investmentLoading: boolean;
  investmentError?: string;
  isTeamOwner?: boolean; // Nova prop para verificar se o usuário é dono da equipe
}

const StatsContainer: React.FC<StatsContainerProps> = ({
  stats,
  loading,
  investmentLoading,
  investmentError,
  isTeamOwner = false // Valor padrão é falso
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total de Petições"
          value={stats.totalPetitions}
          loading={loading}
        />
        <StatCard
          title="Em Andamento"
          value={stats.totalInProgress}
          loading={loading}
        />
        <StatCard
          title="Concluídas"
          value={stats.totalCompleted}
          loading={loading}
        />
        
        {/* Card de Investimento apenas para donos de equipe */}
        {isTeamOwner ? (
          investmentError ? (
            <div className="bg-card p-4 rounded-lg border shadow">
              <Alert variant="destructive" className="bg-transparent border-0 shadow-none p-0">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erro ao carregar dados de investimento
                </AlertDescription>
              </Alert>
              <div className="text-center mt-2 text-muted-foreground text-sm">
                Tente novamente mais tarde
              </div>
            </div>
          ) : (
            <StatCard
              title="Investimento Total"
              value={formatCurrency(stats.totalInvested || 0)}
              loading={investmentLoading}
            />
          )
        ) : (
          <div className="bg-card p-4 rounded-lg border shadow">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Investimento Total</span>
            </div>
            <div className="text-center mt-4 text-muted-foreground text-sm">
              Apenas proprietários da equipe podem visualizar esta informação
            </div>
          </div>
        )}
      </div>
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AverageDeliveryCard days={stats.averageDeliveryTime} />
        <MonthlyVolumeChart data={stats.monthlyPetitions} />
      </div>
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionPieChart
          title="Distribuição por Tipo"
          description="Volume de petições por tipo selecionado no formulário"
          data={stats.petitionsByType}
        />
        <DistributionPieChart
          title="Distribuição por Área Jurídica"
          description="Volume de petições por área jurídica selecionada"
          data={stats.petitionsByArea}
        />
      </div>
    </>
  );
};

export default StatsContainer;

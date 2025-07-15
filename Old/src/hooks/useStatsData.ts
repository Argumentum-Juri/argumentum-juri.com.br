import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { tokenService } from "@/services/tokenService";
import { PetitionStatus } from '@/types/enums';

interface StatsData {
  totalPetitions: number;
  totalInProgress: number;
  totalCompleted: number;
  totalInvested: number;
  averageDeliveryTime: number;
  petitionsByType: Array<{ name: string; value: number }>;
  petitionsByArea: Array<{ name: string; value: number }>;
  monthlyPetitions: Array<{ name: string; count: number }>;
}

export const useStatsData = (userId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [investmentLoading, setInvestmentLoading] = useState(true);
  const [investmentError, setInvestmentError] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState<StatsData>({
    totalPetitions: 0,
    totalInProgress: 0,
    totalCompleted: 0,
    totalInvested: 0,
    averageDeliveryTime: 0,
    petitionsByType: [],
    petitionsByArea: [],
    monthlyPetitions: []
  });

  // Função para calcular o tempo médio de entrega (da criação até primeira revisão)
  const calculateAverageDeliveryTime = useCallback(async (petitions: any[]) => {
    if (!petitions || petitions.length === 0) {
      return 0;
    }
    
    try {
      const petitionIds = petitions
        .filter(p => p.status !== PetitionStatus.PENDING && p.status !== PetitionStatus.PROCESSING)
        .map(p => p.id);
      
      if (petitionIds.length === 0) return 0;
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('petition_comments')
        .select('*')
        .in('petition_id', petitionIds);
      
      if (commentsError) {
        console.error("Erro ao buscar comentários:", commentsError);
        // Não retorna erro fatal para permitir que outras estatísticas sejam calculadas
      }
      
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('petition_reviews')
        .select('*')
        .in('petition_id', petitionIds);
      
      if (reviewsError) {
        console.error("Erro ao buscar revisões:", reviewsError);
        // Não retorna erro fatal
      }
      
      // Continuar mesmo que commentsData ou reviewsData seja nulo/vazio devido a erro,
      // para não quebrar o cálculo se uma das fontes falhar mas a outra tiver dados.
      if ((!commentsData || commentsData.length === 0) && (!reviewsData || reviewsData.length === 0)) {
        return 0;
      }
      
      let totalDays = 0;
      let countedPetitions = 0;
      
      for (const petition of petitions) {
        // Certifique-se de que petition.created_at existe e é válido
        if (!petition.created_at) continue;
        const creationDate = new Date(petition.created_at);
        
        let firstInteractionDate: Date | null = null;
        
        if (reviewsData && reviewsData.length > 0) {
          const petitionReviews = reviewsData.filter(r => r.petition_id === petition.id);
          if (petitionReviews.length > 0) {
            const sortedReviews = petitionReviews.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            if (sortedReviews[0] && sortedReviews[0].created_at) {
                 firstInteractionDate = new Date(sortedReviews[0].created_at);
            }
          }
        }

        if (!firstInteractionDate && commentsData && commentsData.length > 0) {
          const petitionComments = commentsData.filter(c => c.petition_id === petition.id);
          if (petitionComments.length > 0) {
            const sortedComments = petitionComments.sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
             if (sortedComments[0] && sortedComments[0].created_at) {
                firstInteractionDate = new Date(sortedComments[0].created_at);
            }
          }
        }
        
        if (firstInteractionDate) {
          const diffTime = Math.abs(firstInteractionDate.getTime() - creationDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0) { // Apenas se a diferença for de pelo menos um dia
            totalDays += diffDays;
            countedPetitions++;
          }
        }
      }
      
      const averageDays = countedPetitions > 0 ? Math.round(totalDays / countedPetitions) : 0;
      return averageDays;
      
    } catch (error) {
      console.error("Erro ao calcular tempo médio de entrega:", error);
      return 0;
    }
  }, []);

  // Função para buscar o investimento total
  const fetchInvestmentTotal = useCallback(async () => {
    if (!userId) {
        setInvestmentLoading(false);
        return;
    }

    setInvestmentLoading(true);
    setInvestmentError(undefined);
    console.log("Buscando histórico de pagamentos do Stripe para o usuário", userId);

    try {
      const timeoutPromise = new Promise<{ data?: any[], error?: string }>((resolve) => {
        setTimeout(() => {
          resolve({
            error: "Tempo limite excedido ao buscar dados de pagamento"
          });
        }, 5000);
      });

      const paymentHistoryPromise = tokenService.getPaymentHistory(userId);
      const paymentHistoryResult = await Promise.race([
          paymentHistoryPromise, 
          timeoutPromise
      ]) as { data?: any[], error?: string, message?: string };

      const errorMessage = paymentHistoryResult.error || (typeof paymentHistoryResult.message === 'string' ? paymentHistoryResult.message : undefined);

      if (errorMessage) {
        console.warn("Aviso ao buscar histórico de pagamentos:", errorMessage);
        setInvestmentError("Dados de pagamento temporariamente indisponíveis");
        return;
      }

      let calculatedTotalInvested = 0;
      if (paymentHistoryResult.data && Array.isArray(paymentHistoryResult.data)) {
        paymentHistoryResult.data.forEach((payment: any) => {
          if (payment.status === 'succeeded' && typeof payment.amount === 'number') {
            calculatedTotalInvested += payment.amount / 100;
          }
        });
        console.log("Total investido calculado:", calculatedTotalInvested);
      } else {
        console.error("Dados de pagamento inválidos ou não são um array:", paymentHistoryResult.data);
        if (!errorMessage) {
            setInvestmentError("Não foi possível obter o histórico de pagamentos (formato inesperado)");
        }
      }
      
      setStats((prevStats) => ({
        ...prevStats,
        totalInvested: Math.round(calculatedTotalInvested)
      }));

    } catch (stripeError: any) {
      console.error("Erro ao processar dados de pagamento:", stripeError);
      setInvestmentError(stripeError?.message || "Erro ao processar dados de pagamento");
    } finally {
      setInvestmentLoading(false);
    }
  }, [userId]);

  // Buscar todos os dados de estatísticas
  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) {
        setLoading(true);
        setStats({
            totalPetitions: 0, 
            totalInProgress: 0, 
            totalCompleted: 0, 
            totalInvested: 0,
            averageDeliveryTime: 0, 
            petitionsByType: [], 
            petitionsByArea: [], 
            monthlyPetitions: []
        });
        return;
      }
      
      setLoading(true);
      
      try {
        // Primeiro verificamos se o usuário pertence a alguma equipe
        const { data: teamMemberData, error: teamMemberError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', userId)
          .maybeSingle();
          
        let petitions = [];
        
        if (teamMemberError) {
          console.error("Erro ao verificar associação à equipe:", teamMemberError);
        }
        
        if (teamMemberData?.team_id) {
          // O usuário faz parte de uma equipe, vamos buscar as petições de toda a equipe
          console.log(`Usuário ${userId} pertence à equipe ${teamMemberData.team_id}, buscando estatísticas da equipe`);
          
          // 1. Buscar todos os membros da equipe
          const { data: teamMembers, error: membersError } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamMemberData.team_id);
            
          if (membersError) {
            console.error("Erro ao buscar membros da equipe:", membersError);
            throw membersError;
          }
          
          if (!teamMembers || teamMembers.length === 0) {
            console.warn(`Nenhum membro encontrado para a equipe ${teamMemberData.team_id}`);
          }
          
          // 2. Buscar todas as petições de todos os membros da equipe
          const teamMemberIds = teamMembers?.map(member => member.user_id) || [];
          
          if (teamMemberIds.length > 0) {
            // Se encontramos membros da equipe, buscamos suas petições
            const { data: teamPetitions, error: petitionsError } = await supabase
              .from('petitions')
              .select('*')
              .in('user_id', teamMemberIds);
              
            if (petitionsError) {
              console.error("Erro ao buscar petições da equipe:", petitionsError);
              throw petitionsError;
            }
            
            petitions = teamPetitions || [];
            console.log(`Encontradas ${petitions.length} petições para a equipe`);
          }
          
          // 3. Também buscar petições vinculadas diretamente à equipe
          const { data: teamLinkedPetitions, error: teamPetitionsError } = await supabase
            .from('petitions')
            .select('*')
            .eq('team_id', teamMemberData.team_id);
            
          if (teamPetitionsError) {
            console.error("Erro ao buscar petições vinculadas à equipe:", teamPetitionsError);
          } else if (teamLinkedPetitions && teamLinkedPetitions.length > 0) {
            // Adicionar essas petições ao conjunto, evitando duplicatas
            const existingIds = new Set(petitions.map(p => p.id));
            const newPetitions = teamLinkedPetitions.filter(p => !existingIds.has(p.id));
            petitions = [...petitions, ...newPetitions];
            console.log(`Adicionadas ${newPetitions.length} petições vinculadas diretamente à equipe`);
          }
        } else {
          // Usuário não faz parte de uma equipe, buscamos apenas suas petições individuais
          console.log(`Buscando estatísticas individuais para o usuário ${userId}`);
          const { data: userPetitions, error } = await supabase
            .from('petitions')
            .select('*')
            .eq('user_id', userId);
          
          if (error) throw error;
          petitions = userPetitions || [];
        }
        
        if (!petitions || petitions.length === 0) {
          setStats(prev => ({
            ...prev,
            totalPetitions: 0, 
            totalInProgress: 0, 
            totalCompleted: 0, 
            averageDeliveryTime: 0, 
            petitionsByType: [], 
            petitionsByArea: [], 
            monthlyPetitions: []
          }));
          setLoading(false);
          fetchInvestmentTotal();
          return;
        }
        
        const totalPetitions = petitions.length;
        const completedPetitions = petitions.filter(p => 
          p.status === PetitionStatus.COMPLETE || p.status === PetitionStatus.APPROVED);
        const inProgressPetitions = petitions.filter(p => 
          p.status === PetitionStatus.PENDING || 
          p.status === PetitionStatus.PROCESSING || 
          p.status === PetitionStatus.IN_REVIEW || 
          p.status === PetitionStatus.REVIEW);
        
        const typeGroups = petitions.reduce((acc, petition) => {
          const type = petition.petition_type || 'Não especificado';
          if (!acc[type]) acc[type] = 0;
          acc[type]++;
          return acc;
        }, {} as Record<string, number>);
        
        const areaGroups = petitions.reduce((acc, petition) => {
          const area = petition.legal_area || 'Não especificada';
          if (!acc[area]) acc[area] = 0;
          acc[area]++;
          return acc;
        }, {} as Record<string, number>);
        
        const averageDeliveryDays = await calculateAverageDeliveryTime(petitions);
        
        const now = new Date();
        const monthlyData: Record<string, number> = {};
        
        for (let i = 5; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });
          monthlyData[monthName] = 0;
        }
        
        petitions.forEach(petition => {
          if (!petition.created_at) return;
          const date = new Date(petition.created_at);
          const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
          
          if (monthlyData[monthName] !== undefined) {
            monthlyData[monthName]++;
          }
        });
        
        // Properly type the chart data to ensure 'value' is always a number
        const petitionsByType = Object.entries(typeGroups).map(([name, value]) => ({ 
          name, 
          value: value as number 
        }));
        
        const petitionsByArea = Object.entries(areaGroups).map(([name, value]) => ({ 
          name, 
          value: value as number 
        }));
        
        const monthlyPetitions = Object.entries(monthlyData).map(([name, count]) => ({ 
          name, 
          count: count as number 
        }));
        
        setStats({
          totalPetitions,
          totalInProgress: inProgressPetitions.length,
          totalCompleted: completedPetitions.length,
          totalInvested: stats.totalInvested,
          averageDeliveryTime: averageDeliveryDays,
          petitionsByType,
          petitionsByArea,
          monthlyPetitions
        });
        
        // Não chamamos automaticamente o fetchInvestmentTotal aqui, deixamos para o componente Stats decidir
        
      } catch (error: any) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, calculateAverageDeliveryTime]);

  return { stats, loading, investmentLoading, investmentError, fetchInvestmentTotal };
};


import { useState, useEffect } from 'react';
import { Petition } from '@/types';
import { petitionService } from '@/services/petition';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePetitions = () => {
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPetitions = async () => {
      setIsLoading(true);
      try {
        // Obter o ID do usuário atual
        const { data: userData } = await supabase.auth.getSession();
        const userId = userData?.session?.user?.id;
        
        if (!userId) {
          throw new Error("Usuário não autenticado");
        }
        
        // Verificar se o usuário é um administrador
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", userId)
          .single();
        
        let petitionData: Petition[] = [];
        
        if (userProfile?.is_admin) {
          // Se for admin, busca todas as petições
          petitionData = await petitionService.getAllPetitions();
        } else {
          // Se não for admin, busca apenas as petições do usuário e suas equipes
          
          // 1. Buscar IDs das equipes do usuário
          const { data: teamMemberships } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId);
            
          const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
          
          // 2. Buscar petições
          const result = await petitionService.getPetitions({
            page: 1,
            limit: 100,
            sortDirection: 'desc'
          });
          
          // 3. Filtrar petições no frontend para garantir que o usuário só veja suas próprias petições
          // ou petições de suas equipes
          const allPetitions = result.data || [];
          petitionData = allPetitions.filter(petition => 
            petition.user_id === userId || 
            (petition.team_id && teamIds.includes(petition.team_id))
          );
          
          console.log(`Filtrando petições para usuário ${userId}: Encontradas ${petitionData.length} petições de ${allPetitions.length} total`);
        }
        
        setPetitions(petitionData);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar petições:", err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido ao carregar petições'));
        toast.error("Não foi possível carregar suas petições");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPetitions();
  }, []);

  return { petitions, isLoading, error };
};

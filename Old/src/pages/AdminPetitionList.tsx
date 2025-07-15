
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from "@/hooks/use-debounce";
import { petitionService } from '@/services';
import { Petition } from '@/types';
import { toast } from "sonner";
import PetitionSearch from '@/components/admin/petition-list/PetitionSearch'; 
import PetitionColumn from '@/components/admin/petition-list/PetitionColumn'; 
import { Loader2 } from 'lucide-react'; // Importar um ícone de loading
import { useIsMobile } from '@/hooks/use-mobile';

// AJUSTANDO OS STATUS PARA CORRESPONDER EXATAMENTE AOS VALORES DO BACKEND (minúsculas)
const BOARD_STATUSES = [
  { id: 'pending', title: 'Pendentes' },
  { id: 'review', title: 'Em Revisão' },
  { id: 'rejected', title: 'Rejeitadas' },
  { id: 'approved', title: 'Aprovadas' },
];
console.log("BOARD_STATUSES Definition:", BOARD_STATUSES);

type PetitionsByStatus = {
  [key: string]: Petition[];
};

interface PetitionBoardParams {
  page: number;
  limit: number;
  sortDirection: 'asc' | 'desc';
  status?: string;
  search?: string;
  sortBy?: string;
}

const AdminPetitionList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [allPetitions, setAllPetitions] = useState<Petition[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [clickedPetitionId, setClickedPetitionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoardPetitions = async () => {
      console.log("1. Iniciando fetch de petições..."); // Log 1
      setIsLoading(true);
      try {
        const params: PetitionBoardParams = {
          page: 1,
          limit: 100,
          sortDirection: 'desc'
        };
        
        if (debouncedSearchQuery) {
          params.search = debouncedSearchQuery;
        }
        console.log("2. Parâmetros da API:", params); // Log 2

        const result = await petitionService.getPetitions(params); 
        console.log("3. Resultado da API:", result); // Log 3: Verifique a estrutura e os dados aqui!

        // Verifique se result.data é um array antes de atualizar o estado
        if (Array.isArray(result?.data)) {
            console.log("4. Atualizando estado allPetitions com:", result.data); // Log 4
            setAllPetitions(result.data);
            // Log para verificar o status da primeira petição, se houver
            if (result.data.length > 0) {
                console.log("5. Status da primeira petição recebida:", result.data[0].status); // Log 5: Compare este valor com BOARD_STATUSES.id
            }
        } else {
            console.error("Erro: API não retornou um array em result.data", result);
            setAllPetitions([]); // Define como array vazio em caso de erro de formato
            toast.error("Formato inesperado da resposta da API.");
        }
        
      } catch (err: any) {
        console.error('Erro detalhado ao carregar petições:', err); // Log de erro
        toast.error('Erro ao buscar petições. ' + (err.message || 'Verifique o console'));
        setAllPetitions([]); // Limpa petições em caso de erro
      } finally {
        setIsLoading(false);
        console.log("6. Fetch finalizado."); // Log 6
      }
    };

    fetchBoardPetitions();
  }, [debouncedSearchQuery, refreshTrigger]); 

  const petitionsByStatus = useMemo<PetitionsByStatus>(() => {
    console.log("7. Iniciando agrupamento. Petições recebidas:", allPetitions); // Log 7
    const grouped: PetitionsByStatus = {};
    BOARD_STATUSES.forEach(status => {
      grouped[status.id] = []; 
    });

    allPetitions.forEach(petition => {
      // Log para cada petição e seu status antes de tentar agrupar
      console.log(`8. Tentando agrupar Petição ID: ${petition.id}, Status: "${petition.status}"`); // Log 8

      if (grouped[petition.status] !== undefined) { // Verifica se a chave existe (mesmo que seja array vazio)
        grouped[petition.status].push(petition);
        console.log(`   -> Adicionada à coluna "${petition.status}"`); // Confirmação
      } else {
        // Log MUITO IMPORTANTE: Indica que o status da petição não corresponde a nenhum ID em BOARD_STATUSES
        console.warn(`   -> Status "${petition.status}" não encontrado em BOARD_STATUSES! Verifique a definição.`); 
      }
    });
    console.log("9. Petições agrupadas:", grouped); // Log 9: Verifique se os arrays têm petições
    return grouped;
  }, [allPetitions]);

  const handlePetitionClick = (petition: Petition) => {
    if (clickedPetitionId === petition.id) return;
    setClickedPetitionId(petition.id);
    setTimeout(() => {
      navigate(`/admin/petitions/${petition.id}`);
      setClickedPetitionId(null); 
    }, 100);
  };

  // --- Render Function ---
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex flex-col">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Quadro de Petições</h1>
          <p className="text-muted-foreground mt-1">Gerencie as petições em um fluxo visual</p>
        </div>
        <PetitionSearch
          searchQuery={searchQuery}
          onSearchChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Board Area */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
          <p className='ml-2'>Carregando petições...</p> 
        </div>
      ) : (
        // Layout responsivo aprimorado
        <div className={`flex-grow grid gap-6 pb-6 ${isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} 
          items-start `}> 

          {BOARD_STATUSES.map(status => {
            console.log(`10. Renderizando coluna "${status.title}" com ${petitionsByStatus[status.id]?.length || 0} petições`);
            return (
              <PetitionColumn
                key={status.id}
                title={status.title}
                statusId={status.id}
                petitions={petitionsByStatus[status.id] || []} 
                onPetitionClick={handlePetitionClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPetitionList;

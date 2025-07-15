
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminPetitions } from '@/hooks/useAdminPetitions';
import { Petition } from '@/types';
import PetitionSearch from '@/components/admin/petition-list/PetitionSearch'; 
import PetitionColumn from '@/components/admin/petition-list/PetitionColumn'; 
import { Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// AJUSTANDO OS STATUS PARA CORRESPONDER EXATAMENTE AOS VALORES DO BACKEND (minúsculas)
const BOARD_STATUSES = [
  { id: 'pending', title: 'Pendentes' },
  { id: 'review', title: 'Em Revisão' },
  { id: 'rejected', title: 'Rejeitadas' },
  { id: 'approved', title: 'Aprovadas' },
];

type PetitionsByStatus = {
  [key: string]: Petition[];
};

const AdminPetitionList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [clickedPetitionId, setClickedPetitionId] = useState<string | null>(null);

  // Usando o novo hook para admin petitions
  const { 
    petitions, 
    isLoading, 
    error, 
    refreshPetitions,
    isAdmin 
  } = useAdminPetitions({
    page: 1,
    limit: 100,
    sortDirection: 'desc',
    ...(debouncedSearchQuery && { search: debouncedSearchQuery })
  });

  console.log('[AdminPetitionList] Hook status:', { 
    petitionsCount: petitions.length, 
    isLoading, 
    hasError: !!error,
    isAdmin,
    searchQuery: debouncedSearchQuery
  });

  const petitionsByStatus = useMemo<PetitionsByStatus>(() => {
    console.log('[AdminPetitionList] 🔄 Agrupando petições. Total recebidas:', petitions.length);
    const grouped: PetitionsByStatus = {};
    
    // Inicializar arrays vazios para cada status
    BOARD_STATUSES.forEach(status => {
      grouped[status.id] = []; 
    });

    petitions.forEach(petition => {
      console.log(`[AdminPetitionList] Agrupando Petição ID: ${petition.id}, Status: "${petition.status}"`);
      
      if (grouped[petition.status] !== undefined) {
        grouped[petition.status].push(petition);
        console.log(`   -> Adicionada à coluna "${petition.status}"`);
      } else {
        console.warn(`   -> Status "${petition.status}" não encontrado em BOARD_STATUSES!`);
      }
    });
    
    console.log('[AdminPetitionList] ✅ Petições agrupadas:', grouped);
    return grouped;
  }, [petitions]);

  const handlePetitionClick = (petition: Petition) => {
    if (clickedPetitionId === petition.id) return;
    setClickedPetitionId(petition.id);
    setTimeout(() => {
      navigate(`/admin/petitions/${petition.id}`);
      setClickedPetitionId(null); 
    }, 100);
  };

  // Verificar se não é admin
  if (!isAdmin && !isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error && !isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button 
            onClick={refreshPetitions}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

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
        <div className={`flex-grow grid gap-6 pb-6 ${isMobile 
          ? 'grid-cols-1' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} 
          items-start`}> 

          {BOARD_STATUSES.map(status => {
            const statusPetitions = petitionsByStatus[status.id] || [];
            console.log(`[AdminPetitionList] Renderizando coluna "${status.title}" com ${statusPetitions.length} petições`);
            
            return (
              <PetitionColumn
                key={status.id}
                title={status.title}
                statusId={status.id}
                petitions={statusPetitions} 
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

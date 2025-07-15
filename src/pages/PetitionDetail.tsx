
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAPIContext } from '@/contexts/APIContext';
import PetitionDetailAPI from '@/components/PetitionDetailAPI';
import PetitionDetailComponent from '@/components/PetitionDetailComponent';

const PetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { useNewPetitionsAPI } = useAPIContext();
  
  if (!id) {
    return <div>ID da petição não encontrado</div>;
  }
  
  // Usar o componente apropriado baseado no contexto
  return useNewPetitionsAPI ? 
    <PetitionDetailAPI petitionId={id} /> : 
    <PetitionDetailComponent petitionId={id} />;
};

export default PetitionDetail;

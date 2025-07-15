
import React from 'react';
import { useAPIContext } from '@/contexts/APIContext';
import PetitionListOriginal from '@/components/PetitionListOriginal';

const PetitionList: React.FC = () => {
  // Sempre usar o layout original, independente da API
  return <PetitionListOriginal />;
};

export default PetitionList;

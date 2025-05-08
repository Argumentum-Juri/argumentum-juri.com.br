import React from 'react';
import { Petition } from '@/types';
import PetitionCard from './PetitionCard';

interface PetitionColumnProps {
  title: string;
  petitions: Petition[];
  statusId: string;
  onPetitionClick: (petition: Petition) => void;
}

// Mapeamento dos IDs de status para as cores correspondentes
const statusBorderColors: { [key: string]: string } = {
    pending: '#f59e0b',   // Laranja/Amarelo
    review: '#6B7280',    // Cinza - Atualizado conforme sua última info
    approved: '#10b981',  // Verde (Emerald 500)
    rejected: '#ef4444',  // Vermelho (Red 500)
  };

const PetitionColumn: React.FC<PetitionColumnProps> = ({ title, petitions, statusId, onPetitionClick }) => {
    const borderColor = statusBorderColors[statusId] || statusBorderColors.default;

  return (
    <div 
        className="flex-shrink-0 min-w-[280px] max-w-[320px] bg-muted rounded-lg p-4 flex flex-col border-t-4"
        style={{ borderColor: borderColor }}
    >
      <h2 className="text-md font-semibold mb-4 px-1 text-primary">{title} ({petitions.length})</h2>
      <div className="flex-grow overflow-y-auto pr-1">
        {petitions.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma petição</p>
        )}
        {petitions.map(petition => (
          <PetitionCard 
            key={petition.id} 
            petition={petition} 
            onClick={onPetitionClick} 
          />
        ))}
      </div>
    </div>
  );
};

export default PetitionColumn;
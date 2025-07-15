
import React from 'react';
import { usePetitionsAPI } from '@/hooks/usePetitionsAPI';
import PetitionListHeader from './petition-list/PetitionListHeader';
import PetitionCard from './petition-list/PetitionCard';
import PetitionListSkeleton from './petition-list/PetitionListSkeleton';
import EmptyState from './petition-list/EmptyState';

const PetitionListAPI = () => {
  const { petitions, isLoading, error, refreshPetitions } = usePetitionsAPI();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PetitionListHeader />
        <PetitionListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PetitionListHeader />
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error.message}</p>
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
    <div className="space-y-6">
      <PetitionListHeader />
      
      {petitions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {petitions.map((petition) => (
            <PetitionCard 
              key={petition.id} 
              petition={petition} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PetitionListAPI;

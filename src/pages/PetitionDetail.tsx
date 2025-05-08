
import React from 'react';
import PetitionDetailComponent from '@/components/PetitionDetail';
import { useParams } from 'react-router-dom';
import NotFoundError from '@/components/petition-detail/NotFoundError';

const PetitionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotFoundError />
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PetitionDetailComponent petitionId={id} />
      </div>
    </div>
  );
};

export default PetitionDetailPage;


import React from 'react';
import PetitionDetailComponent from '@/components/PetitionDetail';
import { useParams, Navigate } from 'react-router-dom';
import NotFoundError from '@/components/petition-detail/NotFoundError';

const PetitionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // Validação mais rigorosa do ID
  if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
    console.error("Invalid petition ID in URL:", id);
    return <Navigate to="/petitions" replace />;
  }
  
  // Validação do formato UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    console.error("Invalid UUID format for petition ID:", id);
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotFoundError message="ID da petição inválido" />
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

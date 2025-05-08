
import React from 'react';
import { Petition } from '@/types';
import { formatDate } from '@/utils/formatDate';
import StatusBadge from '@/components/StatusBadge';

interface PetitionHeaderProps {
  petition: Petition;
  isLoading: boolean;
  hideId?: boolean;
}

const PetitionHeader: React.FC<PetitionHeaderProps> = ({ petition, isLoading, hideId = false }) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded w-3/4"></div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{petition.title}</h1>
        <StatusBadge status={petition.status} className="ml-2" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <p>Criada em: {formatDate(petition.createdAt)}</p>
        <p>Atualizada em: {formatDate(petition.updatedAt)}</p>
        {!hideId && (
          <p>ID: <span className="font-mono">{petition.id}</span></p>
        )}
      </div>
    </div>
  );
};

export default PetitionHeader;

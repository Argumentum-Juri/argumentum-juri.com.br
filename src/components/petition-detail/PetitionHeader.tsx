
import React from 'react';
import { Petition } from '@/types';
import { formatDate } from '@/utils/formatDate';
import StatusBadge from '@/components/StatusBadge';
import { useIsMobile } from '@/hooks/use-mobile';

interface PetitionHeaderProps {
  petition: Petition;
  isLoading: boolean;
  hideId?: boolean;
}

const PetitionHeader: React.FC<PetitionHeaderProps> = ({ petition, isLoading, hideId = false }) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded w-3/4"></div>
        <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
      </div>
    );
  }

  // Verificação mais robusta das datas
  const createdAt = petition.createdAt || petition.created_at;
  const updatedAt = petition.updatedAt || petition.updated_at;

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">{petition.title}</h1>
        <StatusBadge status={petition.status} className="self-start sm:self-auto" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
        {createdAt ? (
          <p>Criada em: {formatDate(createdAt)}</p>
        ) : (
          <p>Criada em: <span className="text-xs opacity-50">Carregando...</span></p>
        )}
        {updatedAt ? (
          <p>Atualizada em: {formatDate(updatedAt)}</p>
        ) : (
          <p>Atualizada em: <span className="text-xs opacity-50">Carregando...</span></p>
        )}
        {!hideId && (
          <p className="w-full sm:w-auto">ID: <span className="font-mono text-xs">{petition.id}</span></p>
        )}
      </div>
    </div>
  );
};

export default PetitionHeader;

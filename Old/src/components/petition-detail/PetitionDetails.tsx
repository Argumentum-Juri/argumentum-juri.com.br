
import React from 'react';
import { Petition } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

interface PetitionDetailsProps {
  petition: Petition;
  hideId?: boolean;
}

const PetitionDetails: React.FC<PetitionDetailsProps> = ({ petition, hideId = false }) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                <p className="text-sm md:text-md">{petition.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Área Jurídica</h3>
                <p className="text-sm md:text-md">{petition.legal_area || 'Não especificada'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo de Petição</h3>
                <p className="text-sm md:text-md">{petition.petition_type || 'Não especificado'}</p>
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {petition.has_process && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Número do Processo</h3>
                  <p className="text-sm md:text-md">{petition.process_number || 'Não informado'}</p>
                </div>
              )}
              
              {petition.user && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Solicitante</h3>
                  <p className="text-sm md:text-md">{petition.user.name || petition.user.email || 'Desconhecido'}</p>
                </div>
              )}
              
              {!hideId && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">ID da Petição</h3>
                  <p className="text-sm md:text-md font-mono">{petition.id}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PetitionDetails;

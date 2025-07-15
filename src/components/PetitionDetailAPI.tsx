
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetitionDetailAPI } from '@/hooks/usePetitionDetailAPI';
import PetitionDetailContainer from './petition-detail/PetitionDetailContainer';
import NotFoundError from './petition-detail/NotFoundError';
import ProcessingNotification from './petition-detail/ProcessingNotification';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink } from "./ui/breadcrumb";
import { useIsMobile } from '@/hooks/use-mobile';

const PetitionDetailAPI: React.FC<{ petitionId: string }> = ({ petitionId }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const { 
    petition, 
    isLoading, 
    error,
    refresh
  } = usePetitionDetailAPI(petitionId);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Carregando detalhes da petição...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error states
  if (error) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotFoundError message={error} />
        </div>
      </div>
    );
  }
  
  if (!petition) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotFoundError message="Não foi possível carregar os detalhes da petição" />
        </div>
      </div>
    );
  }

  const isProcessing = petition.status === 'pending' || petition.status === 'processing';
  const isRejected = petition.status === 'rejected';
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Button 
                    variant="ghost" 
                    className="gap-2 pl-0 text-muted-foreground" 
                    onClick={() => navigate('/petitions')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {!isMobile && "Voltar para lista de petições"}
                    {isMobile && "Voltar"}
                  </Button>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <ProcessingNotification 
          isProcessing={isProcessing} 
          isRejected={isRejected}
        />

        <PetitionDetailContainer
          petition={petition}
          isLoading={false}
          error={null}
          documents={petition.petition_documents || []}
          onRefresh={refresh}
          hideId={true}
          showDocumentsTabs={true}
          defaultTab="documents"
        />
      </div>
    </div>
  );
};

export default PetitionDetailAPI;

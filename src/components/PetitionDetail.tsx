
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePetitionDetail } from '@/hooks/use-petition-detail';
import PetitionDetailContainer from './petition-detail/PetitionDetailContainer';
import NotFoundError from './petition-detail/NotFoundError';
import ProcessingNotification from './petition-detail/ProcessingNotification';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { PetitionStatus } from '@/types';
import RejectPetitionDialog from './petition-detail/RejectPetitionDialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "./ui/breadcrumb";
import { useIsMobile } from '@/hooks/use-mobile';

const PetitionDetail: React.FC<{ petitionId: string }> = ({ petitionId }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  
  const { 
    petition, 
    isLoading, 
    error,
    handleApprovePetition,
    handleRejectPetition,
    approveLoading,
    rejectLoading,
    documents,
    refresh
  } = usePetitionDetail(petitionId);

  useEffect(() => {
    if (!petitionId) {
      navigate('/petitions');
    }
  }, [petitionId, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    if (error.type === 'PERMISSION_DENIED') {
      return (
        <Alert variant="destructive" className="my-6">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <div className="mt-4">
            <button 
              className="text-sm text-blue-600 hover:underline"
              onClick={() => navigate('/petitions')}
            >
              Voltar para a lista de petições
            </button>
          </div>
        </Alert>
      );
    }
    
    return <NotFoundError message={error.message} />;
  }
  
  if (!petition) {
    return <NotFoundError message="Não foi possível carregar os detalhes da petição" />;
  }

  const isProcessing = petition.status === PetitionStatus.PENDING || 
                      petition.status === PetitionStatus.PROCESSING;
  
  const isRejected = petition.status === PetitionStatus.REJECTED;
  const canReviewPetition = petition?.status === PetitionStatus.REVIEW;
  
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

        {canReviewPetition && (
          <div className="mb-6 flex flex-col sm:flex-row justify-end gap-4">
            <Button
              onClick={() => handleApprovePetition()}
              disabled={approveLoading}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              size={isMobile ? "default" : "lg"}
            >
              {approveLoading ? 'Processando...' : 'Aprovar Petição'}
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={rejectLoading}
              size={isMobile ? "default" : "lg"}
              className="w-full sm:w-auto"
            >
              {rejectLoading ? 'Processando...' : 'Rejeitar Petição'}
            </Button>
          </div>
        )}

        <PetitionDetailContainer
          petition={petition}
          isLoading={isLoading}
          error={error}
          documents={documents}
          onRefresh={refresh}
          hideId={true}
          showDocumentsTabs={true}
          defaultTab="documents"
        />

        <RejectPetitionDialog
          isOpen={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          onConfirm={async (reason) => {
            const success = await handleRejectPetition(reason);
            if (success) setShowRejectDialog(false);
          }}
          isLoading={rejectLoading}
        />
      </div>
    </div>
  );
};

export default PetitionDetail;

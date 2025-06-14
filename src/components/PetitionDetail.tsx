
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePetitionDetailRest as usePetitionDetail } from '@/hooks/use-petition-detail-rest';
import PetitionDetailContainer from './petition-detail/PetitionDetailContainer';
import NotFoundError from './petition-detail/NotFoundError';
import ProcessingNotification from './petition-detail/ProcessingNotification';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { PetitionStatus } from '@/types';
import RejectPetitionDialog from './petition-detail/RejectPetitionDialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink } from "./ui/breadcrumb";
import { useIsMobile } from '@/hooks/use-mobile';

const PetitionDetail: React.FC<{ petitionId: string }> = ({ petitionId }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  
  const { 
    data: petition, 
    loading: isLoading, 
    error
  } = usePetitionDetail();

  // Funções mock para manter compatibilidade (podem ser implementadas depois)
  const handleApprovePetition = async () => {
    console.log('Approve petition placeholder');
  };

  const handleRejectPetition = async (reason: string) => {
    console.log('Reject petition placeholder:', reason);
    return true;
  };

  const refresh = async () => {
    window.location.reload();
  };

  const approveLoading = false;
  const rejectLoading = false;
  const documents: any[] = [];

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
  const canReviewPetition = petition?.status === 'review';
  
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
              onClick={handleApprovePetition}
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
          isLoading={false}
          error={null}
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


import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Petition } from '@/types';
import PetitionHeader from './PetitionHeader';
import PetitionSkeleton from './PetitionSkeleton';
import NotFoundError from './NotFoundError';
import ProcessingNotification from './ProcessingNotification';
import PetitionDetails from './PetitionDetails';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, X, FileText, History, MessageSquare, Paperclip, List } from 'lucide-react';
import RejectPetitionDialog from './RejectPetitionDialog';
import { PetitionStatus } from '@/types/enums';
import { PetitionError } from '@/types';
import FormAnswersTab from './FormAnswersTab';
import AttachmentsView from './AttachmentsView';
import MessagesView from './MessagesView';
import HistoryView from './HistoryView';
import DocumentsView from './DocumentsView';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PetitionTabs from './PetitionTabs';

interface PetitionDetailContainerProps {
  petition: Petition | null;
  isLoading: boolean;
  error: PetitionError | null;
  approveLoading?: boolean;
  rejectLoading?: boolean;
  handleApprovePetition?: () => Promise<void>;
  handleRejectPetition?: (reason: string) => Promise<boolean | void>;
  isAdmin?: boolean;
  onRefresh?: () => Promise<void> | void;
  hideId?: boolean;
  showDocumentsTabs?: boolean;
  documents?: any[];
  defaultTab?: "documents" | "answers" | "attachments" | "messages" | "history";
}

const PetitionDetailContainer: React.FC<PetitionDetailContainerProps> = ({
  petition,
  isLoading,
  error,
  approveLoading = false,
  rejectLoading = false,
  handleApprovePetition = async () => {},
  handleRejectPetition = async () => false,
  isAdmin = false,
  onRefresh,
  hideId = false,
  showDocumentsTabs = true,
  documents = [],
  defaultTab = "documents"
}) => {
  const [activeTab, setActiveTab] = useState<"documents" | "answers" | "attachments" | "messages" | "history">(defaultTab);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const isMobile = useIsMobile();

  if (error) {
      return <div className="p-4">Erro ao carregar petição: {error.message}</div>;
  }

  if (isLoading) {
    return <PetitionSkeleton />;
  }

  if (!petition) {
    return <NotFoundError />;
  }

  const isProcessing = petition?.status === PetitionStatus.PENDING;
  const isUnderReview = petition?.status === PetitionStatus.REVIEW || petition?.status === PetitionStatus.IN_REVIEW;
  const canApproveReject = isAdmin && isUnderReview;

  // Pega documentos e anexos do objeto petition
  const attachments = petition.attachments || [];

  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <PetitionHeader petition={petition} isLoading={isLoading} hideId={hideId} />
        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            title="Atualizar dados"
            className="self-end md:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <>
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg font-semibold mb-3">Detalhes da Solicitação</h2>
          <PetitionDetails petition={petition} hideId={hideId} />
        </div>

        {isUnderReview && canApproveReject && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4 md:mb-6">
            <Button 
              onClick={handleApprovePetition} 
              disabled={approveLoading}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              {approveLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar Petição
                </>
              )}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={() => setShowRejectDialog(true)}
              disabled={rejectLoading}
              className="w-full sm:w-auto"
            >
              {rejectLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Rejeitar Petição
                </>
              )}
            </Button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <PetitionTabs
            showDocumentsTabs={showDocumentsTabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <div className="mt-4">
            <TabsContent value="documents" className="m-0">
                <DocumentsView
                    petitionId={petition.id}
                    documents={documents || []}
                    isLoading={false}
                    isAdmin={isAdmin}
                    onDocumentChange={onRefresh}
                />
            </TabsContent>

            <TabsContent value="answers" className="m-0">
                <FormAnswersTab formAnswers={petition.form_answers || {}} />
            </TabsContent>

            <TabsContent value="attachments" className="m-0">
                <AttachmentsView
                    petition={petition}
                    onAttachmentChange={onRefresh}
                    isAdmin={isAdmin}
                />
            </TabsContent>

            <TabsContent value="messages" className="m-0">
                <MessagesView petitionId={petition.id} />
            </TabsContent>

            <TabsContent value="history" className="m-0">
                <HistoryView petition={petition} />
            </TabsContent>
          </div>
        </Tabs>

        <RejectPetitionDialog
            isOpen={showRejectDialog}
            onClose={() => setShowRejectDialog(false)}
            onConfirm={async (reason) => {
                await handleRejectPetition(reason);
                setShowRejectDialog(false);
            }}
            isLoading={rejectLoading}
        />
      </>
    </div>
  );
};

export default PetitionDetailContainer;

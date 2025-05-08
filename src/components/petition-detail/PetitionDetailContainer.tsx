
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Petition, PetitionAttachment } from '@/types';
import PetitionHeader from './PetitionHeader';
import PetitionSkeleton from './PetitionSkeleton';
import NotFoundError from './NotFoundError';
import ProcessingNotification from './ProcessingNotification';
import PetitionDetails from './PetitionDetails';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, X, FileText, History, MessageSquare, Paperclip, List } from 'lucide-react';
import RejectPetitionDialog from './RejectPetitionDialog';
import { PetitionStatus, PetitionError } from '@/types/enums';
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
      return <div>Erro ao carregar petição: {error.message}</div>;
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

  // Opções de tabs disponíveis
  const tabOptions = [
    { value: "documents", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
    { value: "answers", label: "Detalhes", icon: <List className="h-4 w-4" /> },
    { value: "attachments", label: "Anexos", icon: <Paperclip className="h-4 w-4" /> },
    { value: "messages", label: "Mensagens", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "history", label: "Histórico", icon: <History className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <PetitionHeader petition={petition} isLoading={isLoading} hideId={hideId} />
         {onRefresh && (
            <Button variant="outline" size="icon" onClick={onRefresh} title="Atualizar dados">
                <RefreshCw className="h-4 w-4" />
            </Button>
         )}
      </div>

      <>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Detalhes da Solicitação</h2>
          <PetitionDetails petition={petition} hideId={hideId} />
        </div>

        {isUnderReview && canApproveReject && (
          <div className="flex space-x-4 mb-6">
            <Button 
              onClick={handleApprovePetition} 
              disabled={approveLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "documents" | "answers" | "attachments" | "messages" | "history")}>
          {isMobile ? (
            <div className="mb-4">
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {tabOptions.find(tab => tab.value === activeTab)?.icon}
                      {tabOptions.find(tab => tab.value === activeTab)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {tabOptions.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      <div className="flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <TabsList className="grid w-full grid-cols-5">
              {tabOptions.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <TabsContent value="documents">
              <DocumentsView
                  petitionId={petition.id}
                  documents={documents || []}
                  isLoading={false}
                  isAdmin={isAdmin}
                  onDocumentChange={onRefresh}
              />
          </TabsContent>

          <TabsContent value="answers">
              <FormAnswersTab formAnswers={petition.form_answers || {}} />
          </TabsContent>

          <TabsContent value="attachments">
              <AttachmentsView
                  petition={petition}
                  onAttachmentChange={onRefresh}
                  isAdmin={isAdmin}
              />
          </TabsContent>

          <TabsContent value="messages">
              <MessagesView petitionId={petition.id} />
          </TabsContent>

          <TabsContent value="history">
              <HistoryView petition={petition} />
          </TabsContent>
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

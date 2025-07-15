
import React from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Petition } from '@/types';
import AttachmentsView from './AttachmentsView';
import HistoryView from './HistoryView';
import DocumentsView from './DocumentsView';
import MessagesView from './MessagesView';

interface PetitionTabsContentProps {
  petition: Petition;
  activeTab: string;
  showDocumentsTabs?: boolean;
  documents?: any[];
}

const PetitionTabsContent: React.FC<PetitionTabsContentProps> = ({
  petition,
  activeTab,
  showDocumentsTabs = true,
  documents = []
}) => {
  const renderAttachmentsView = () => {
    try {
      return <AttachmentsView petition={petition} />;
    } catch (error) {
      console.error("Error rendering AttachmentsView:", error);
      return (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">Ocorreu um erro ao carregar os anexos.</p>
        </div>
      );
    }
  };

  const renderHistoryView = () => {
    try {
      return <HistoryView petition={petition} />;
    } catch (error) {
      console.error("Error rendering HistoryView:", error);
      return (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">Ocorreu um erro ao carregar o histórico.</p>
        </div>
      );
    }
  };
  
  const renderDocumentsView = () => {
    try {
      return <DocumentsView petitionId={petition.id} documents={documents} />;
    } catch (error) {
      console.error("Error rendering DocumentsView:", error);
      return (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">Ocorreu um erro ao carregar os documentos.</p>
        </div>
      );
    }
  };
  
  const renderMessagesView = () => {
    try {
      return <MessagesView petitionId={petition.id} />;
    } catch (error) {
      console.error("Error rendering MessagesView:", error);
      return (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">Ocorreu um erro ao carregar as mensagens.</p>
        </div>
      );
    }
  };

  return (
    <>
      {showDocumentsTabs && (
        <TabsContent value="documents" className="border p-4 rounded-md">
          {renderDocumentsView()}
        </TabsContent>
      )}
      
      <TabsContent value="attachments" className="border p-4 rounded-md">
        {renderAttachmentsView()}
      </TabsContent>
      
      <TabsContent value="messages" className="border p-4 rounded-md">
        {renderMessagesView()}
      </TabsContent>
      
      <TabsContent value="history" className="border p-4 rounded-md">
        {renderHistoryView()}
      </TabsContent>
    </>
  );
};

export default PetitionTabsContent;

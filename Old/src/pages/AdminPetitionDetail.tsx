import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePetitionDetail } from '@/hooks/use-petition-detail';
import PetitionSkeleton from '@/components/petition-detail/PetitionSkeleton';
import NotFoundError from '@/components/petition-detail/NotFoundError';
import { Check, FileText, History, List, MessageSquare, Paperclip, SendHorizontal, Settings, X } from "lucide-react";
import { Card } from '@/components/ui/card';
import RejectPetitionDialog from '@/components/admin/RejectPetitionDialog';
import AttachmentsView from '@/components/petition-detail/AttachmentsView';
import DocumentsView from '@/components/petition-detail/DocumentsView';
import HistoryView from '@/components/petition-detail/HistoryView';
import MessagesView from '@/components/petition-detail/MessagesView';
import FormattingView from '@/components/petition-detail/FormattingView';
import FormAnswersTab from '@/components/petition-detail/FormAnswersTab';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/utils/formatDate';
import { PetitionStatus } from '@/types';
import { toast } from 'sonner';
import { petitionService } from '@/services';
import { petitionSettings } from '@/services/petition/petitionSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminPetitionDetail: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { 
    petition, 
    isLoading, 
    error, 
    handleApprovePetition,
    handleRejectPetition,
    approveLoading,
    rejectLoading,
    documents,
    isAdmin,
    refresh
  } = usePetitionDetail(id);

  const [activeTab, setActiveTab] = useState("documents");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [sendingToReview, setSendingToReview] = useState(false);
  const [formatSettings, setFormatSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    const fetchPetitionSettings = async () => {
      if (petition && petition.id) {
        setLoadingSettings(true);
        try {
          const data = await petitionSettings.getSettingsForUser(petition.user_id);
          if (data) {
            setFormatSettings(data);
          } else {
            setFormatSettings({ 
              font: 'Arial', 
              font_size: '12pt', 
              line_spacing: '1.5',
              margin: '3cm 2cm 2cm 3cm'
            });
          }
        } catch (error) {
          console.error("Erro ao buscar configurações:", error);
          setFormatSettings({ 
            font: 'Arial', 
            font_size: '12pt', 
            line_spacing: '1.5',
            margin: '3cm 2cm 2cm 3cm'
          });
        } finally {
          setLoadingSettings(false);
        }
      }
    };
    
    fetchPetitionSettings();
  }, [petition]);

  if (isLoading) {
    return <PetitionSkeleton />;
  }

  if (error || !petition) {
    return (
      <NotFoundError 
        message="Não foi possível encontrar esta petição ou você não tem permissão para acessá-la."
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSendToReview = async () => {
    if (!documents || documents.length === 0) {
      toast.error("É necess��rio importar pelo menos um documento antes de enviar para revisão.");
      return;
    }

    setSendingToReview(true);
    try {
      await petitionService.updatePetitionStatus(id, PetitionStatus.REVIEW);
      toast.success("Petição enviada para revisão com sucesso!");
      await refresh();
    } catch (error) {
      console.error("Erro ao enviar para revisão:", error);
      toast.error("Falha ao enviar a petição para revisão.");
    } finally {
      setSendingToReview(false);
    }
  };

  const shouldShowActionButtons = () => {
    return ![
      PetitionStatus.APPROVED, 
      PetitionStatus.COMPLETE
    ].includes(petition.status as PetitionStatus);
  };

  const renderActionButtons = () => {
    const isRejected = petition.status === PetitionStatus.REJECTED;
    
    if (!shouldShowActionButtons() && !isRejected) {
      return null;
    }
    
    return (
      <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 sm:w-auto">
        {(petition.status === PetitionStatus.PENDING ||
          petition.status === PetitionStatus.PROCESSING ||
          petition.status === PetitionStatus.REJECTED) && (
          <Button
            onClick={handleSendToReview}
            disabled={sendingToReview}
            className="flex items-center gap-1 w-full sm:w-auto"
          >
            <SendHorizontal className="h-4 w-4" />
            {sendingToReview ? 'Enviando...' : 'Enviar para Revisão'}
          </Button>
        )}
      </div>
    );
  };

  // Definir as opções de abas
  const tabOptions = [
    { value: "documents", label: "Documentos", icon: <FileText className="h-4 w-4 mr-2" /> },
    { value: "answers", label: "Detalhes", icon: <List className="h-4 w-4 mr-2" /> },
    { value: "attachments", label: "Anexos", icon: <Paperclip className="h-4 w-4 mr-2" /> },
    { value: "messages", label: "Mensagens", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { value: "history", label: "Histórico", icon: <History className="h-4 w-4 mr-2" /> },
    { value: "formatting", label: "Formatação", icon: <Settings className="h-4 w-4 mr-2" /> }
  ];

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button 
                  variant="ghost" 
                  className="gap-2 pl-0 text-muted-foreground" 
                  onClick={() => navigate('/admin/petitions')}
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

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-1">{petition.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground text-sm">
                  <span>Criado em {formatDate(petition.created_at)}</span>
                  <span className="hidden sm:block">•</span>
                  <span>
                    Por {petition.user?.name || petition.user?.email || "Usuário não identificado"}
                  </span>
                </div>
              </div>
              <div className="sm:text-right">
                <StatusBadge status={petition.status} />
              </div>
            </div>
            
            <p className="text-muted-foreground mb-4">{petition.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {petition.legal_area && (
                <div>
                  <p className="text-sm font-medium">Área Jurídica</p>
                  <p className="text-muted-foreground">{petition.legal_area}</p>
                </div>
              )}
              
              {petition.petition_type && (
                <div>
                  <p className="text-sm font-medium">Tipo de Petição</p>
                  <p className="text-muted-foreground">{petition.petition_type}</p>
                </div>
              )}
              
              {petition.has_process && (
                <div>
                  <p className="text-sm font-medium">Número do Processo</p>
                  <p className="text-muted-foreground">{petition.process_number || "Não informado"}</p>
                </div>
              )}
            </div>
          </div>
          
          {shouldShowActionButtons() && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 sm:w-auto">
              {(petition.status === PetitionStatus.PENDING ||
                petition.status === PetitionStatus.PROCESSING ||
                petition.status === PetitionStatus.REJECTED) && (
                <Button
                  onClick={handleSendToReview}
                  disabled={sendingToReview}
                  className="flex items-center gap-1 w-full sm:w-auto"
                >
                  <SendHorizontal className="h-4 w-4" />
                  {sendingToReview ? 'Enviando...' : 'Enviar para Revisão'}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <Tabs defaultValue="documents" value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile selector */}
        {isMobile && (
          <div className="mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full mb-4">
                <SelectValue>
                  <div className="flex items-center">
                    {tabOptions.find(tab => tab.value === activeTab)?.icon}
                    {tabOptions.find(tab => tab.value === activeTab)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tabOptions.map(tab => (
                  <SelectItem key={tab.value} value={tab.value}>
                    <div className="flex items-center">
                      {tab.icon}
                      {tab.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Desktop tabs - Modified to use centered design similar to user version */}
        <div className="flex justify-center mb-4">
          <TabsList className={`grid ${tabOptions.length === 6 ? 'grid-cols-6' : 'grid-cols-5'} w-full max-w-3xl`}>
            {tabOptions.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                {tab.icon.type && <tab.icon.type className="h-4 w-4" />}
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <TabsContent value="documents">
          <DocumentsView 
            petitionId={petition?.id || ''}
            documents={documents}
            isAdmin={true}
            onDocumentChange={refresh}
            disableGenerateButton={true}
          />
        </TabsContent>
        
        <TabsContent value="answers">
          <FormAnswersTab formAnswers={petition?.form_answers || {}} />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentsView 
            petition={petition}
            isAdmin={isAdmin}
            onAttachmentChange={refresh}
          />
        </TabsContent>
        
        <TabsContent value="messages">
          <MessagesView 
            petitionId={petition?.id || ''}
            isAdmin={true}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <HistoryView 
            petition={petition}
          />
        </TabsContent>
        
        <TabsContent value="formatting">
          <FormattingView 
            petitionId={petition?.id || ''}
            userId={petition?.user_id || ''}
            settings={formatSettings}
            isLoading={loadingSettings}
          />
        </TabsContent>
      </Tabs>

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
  );
};

export default AdminPetitionDetail;

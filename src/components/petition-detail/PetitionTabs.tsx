
import React, { useState } from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, MessageSquare, Paperclip } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PetitionTabsProps {
  showDocumentsTabs: boolean;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const PetitionTabs: React.FC<PetitionTabsProps> = ({ 
  showDocumentsTabs,
  activeTab,
  onTabChange
}) => {
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState(activeTab || (showDocumentsTabs ? "documents" : "attachments"));
  
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (onTabChange) {
      onTabChange(value);
    }
  };

  // Opções de tabs disponíveis
  const documentsTabs = [
    { value: "documents", label: "Documentos", icon: <FileText className="h-4 w-4" /> },
    { value: "attachments", label: "Anexos", icon: <Paperclip className="h-4 w-4" /> },
    { value: "messages", label: "Mensagens", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "history", label: "Histórico", icon: <History className="h-4 w-4" /> }
  ];
  
  const regularTabs = [
    { value: "attachments", label: "Anexos", icon: <Paperclip className="h-4 w-4" /> },
    { value: "messages", label: "Mensagens", icon: <MessageSquare className="h-4 w-4" /> },
    { value: "history", label: "Histórico", icon: <History className="h-4 w-4" /> }
  ];
  
  const tabs = showDocumentsTabs ? documentsTabs : regularTabs;

  // Render para mobile (usando Select)
  if (isMobile) {
    return (
      <div className="mb-4">
        <Select value={selectedTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue>
              <div className="flex items-center gap-2">
                {tabs.find(tab => tab.value === selectedTab)?.icon}
                {tabs.find(tab => tab.value === selectedTab)?.label}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background">
            {tabs.map(tab => (
              <SelectItem key={tab.value} value={tab.value} className="select-item">
                <div className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  // Render para desktop (usando TabsList)
  return (
    <TabsList className={`grid w-full mb-4 ${showDocumentsTabs ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {tabs.map(tab => (
        <TabsTrigger 
          key={tab.value} 
          value={tab.value} 
          className="flex items-center gap-2"
          onClick={() => handleTabChange(tab.value)}
          data-state={selectedTab === tab.value ? "active" : ""}
        >
          {tab.icon}
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default PetitionTabs;

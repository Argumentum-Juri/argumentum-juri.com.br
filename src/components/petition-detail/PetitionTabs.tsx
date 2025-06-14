
import React, { useState } from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, History, MessageSquare, Paperclip, List } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PetitionTabsProps {
  showDocumentsTabs: boolean;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const PetitionTabs: React.FC<PetitionTabsProps> = ({ 
  showDocumentsTabs,
  activeTab = "documents",
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
    { value: "answers", label: "Detalhes", icon: <List className="h-4 w-4" /> },
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
  const gridColsClass = `grid-cols-${tabs.length}`;

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
    <div className="flex justify-center mb-4">
      <TabsList className={`grid w-full max-w-3xl ${showDocumentsTabs ? 'grid-cols-5' : 'grid-cols-3'}`}>
        {tabs.map(tab => (
          <TabsTrigger 
            key={tab.value} 
            value={tab.value} 
            className="flex items-center gap-2"
            onClick={() => handleTabChange(tab.value)}
            data-state={selectedTab === tab.value ? "active" : ""}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
};

export default PetitionTabs;

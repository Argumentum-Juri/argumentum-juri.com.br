
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { Petition } from '@/types';
import PetitionSettingsDisplay from './PetitionSettingsDisplay';

interface PetitionDetailsSidebarProps {
  petition: Petition;
  settings: any;
  isLoadingSettings: boolean;
}

const PetitionDetailsSidebar: React.FC<PetitionDetailsSidebarProps> = ({ 
  petition, 
  settings,
  isLoadingSettings 
}) => {
  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="personalization">Personalização</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Área do Direito</h3>
                <p className="text-base">{petition.legal_area || "Não especificada"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tipo de Petição</h3>
                <p className="text-base">{petition.petition_type || "Não especificado"}</p>
              </div>
              
              {petition.process_number && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Número do Processo</h3>
                  <p className="text-base">{petition.process_number}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                <p className="text-base whitespace-pre-line">{petition.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="personalization">
        <PetitionSettingsDisplay 
          settings={settings} 
          isLoading={isLoadingSettings} 
        />
      </TabsContent>
    </Tabs>
  );
};

export default PetitionDetailsSidebar;

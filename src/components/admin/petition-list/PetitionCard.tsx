import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Petition } from '@/types';
import { formatDate } from '@/utils/formatDate';
import { FileText } from 'lucide-react'; 

interface PetitionCardProps {
  petition: Petition;
  onClick: (petition: Petition) => void;
}

const PetitionCard: React.FC<PetitionCardProps> = ({ petition, onClick }) => {
  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary" 
      onClick={() => onClick(petition)}
    >
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-medium line-clamp-1">{petition.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {petition.user?.name || petition.user?.email || "Usuário não identificado"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex justify-between items-end"> 
        <div className="flex flex-col space-y-1"> 
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 flex-shrink-0" /> 
            <span>{petition.legal_area || "Área não informada"}</span> 
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 flex-shrink-0" />
            <span>{petition.petition_type || "Tipo não informado"}</span>
          </div>

        </div> 

        <div className="text-xs text-muted-foreground self-end">
           {formatDate(petition.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
};

export default PetitionCard;
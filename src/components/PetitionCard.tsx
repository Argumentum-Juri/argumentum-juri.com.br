
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from "lucide-react";
import { Petition } from '@/types';
import { formatDate } from '@/utils/formatDate';

interface PetitionCardProps {
  petition: Petition;
  adminView?: boolean;
}

export const PetitionCard: React.FC<PetitionCardProps> = ({ petition, adminView }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'in_review': return 'bg-purple-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'complete': return 'bg-green-700';
      default: return 'bg-gray-500';
    }
  };

  const translateStatus = (status: string) => {
    switch(status) {
      case 'pending': return 'PENDENTE';
      case 'processing': return 'EM PROCESSAMENTO';
      case 'in_review': return 'EM REVISÃO';
      case 'approved': return 'APROVADO';
      case 'rejected': return 'REJEITADO';
      case 'complete': return 'CONCLUÍDO';
      default: return status.toUpperCase();
    }
  };

  const linkPath = adminView ? `/admin/petitions/${petition.id}` : `/petition/${petition.id}`;

  return (
    <Link to={linkPath} className="block h-full">
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow border-muted hover:border-primary/20 cursor-pointer">
        <CardContent className="p-4">
          <div className="mb-2">
            <Badge className={getStatusColor(petition.status)}>
              {translateStatus(petition.status)}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{petition.title}</h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {petition.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {petition.legal_area && (
              <Badge variant="outline" className="whitespace-nowrap">
                {petition.legal_area}
              </Badge>
            )}
            {petition.petition_type && (
              <Badge variant="outline" className="whitespace-nowrap">
                {petition.petition_type}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/30 px-4 py-2">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{petition.petition_type || "Petição"}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(petition.created_at)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PetitionCard;

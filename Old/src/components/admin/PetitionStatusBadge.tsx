
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertTriangle, FileText, Eye } from "lucide-react";
import { PetitionStatus } from '@/types';

interface PetitionStatusBadgeProps {
  status: PetitionStatus;
}

const PetitionStatusBadge: React.FC<PetitionStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case PetitionStatus.PENDING:
      return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    case PetitionStatus.IN_REVIEW:
      return <Badge className="bg-blue-500"><FileText className="w-3 h-3 mr-1" />Em Revisão</Badge>;
    case PetitionStatus.APPROVED:
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
    case PetitionStatus.REJECTED:
      return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
    case PetitionStatus.REVIEW:
      return <Badge className="bg-purple-500"><Eye className="w-3 h-3 mr-1" />Aguardando Revisão do Cliente</Badge>;
    case PetitionStatus.PROCESSING:
      return <Badge className="bg-blue-500"><FileText className="w-3 h-3 mr-1" />Processando</Badge>;
    case PetitionStatus.COMPLETE:
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completo</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default PetitionStatusBadge;


import React from 'react';
import { Badge } from "@/components/ui/badge";
import { PetitionStatus } from '@/types';
import { CheckCircle, Clock, AlertCircle, RotateCw, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: PetitionStatus;
  className?: string; // Add className prop support
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusDetails = () => {
    switch (status) {
      case PetitionStatus.PENDING:
        return {
          label: 'Pendente',
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3 mr-1" />
        };
      case PetitionStatus.PROCESSING:
        return {
          label: 'Em processamento',
          variant: 'default' as const,
          icon: <RotateCw className="h-3 w-3 mr-1 animate-spin" />
        };
      case PetitionStatus.IN_REVIEW:
      case PetitionStatus.REVIEW:
        return {
          label: 'Em revisão',
          variant: 'outline' as const, // Changed from 'warning' to 'outline'
          icon: <AlertCircle className="h-3 w-3 mr-1" />
        };
      case PetitionStatus.APPROVED:
        return {
          label: 'Aprovada',
          variant: 'default' as const, // Changed from 'success' to 'default'
          icon: <CheckCircle className="h-3 w-3 mr-1" />
        };
      case PetitionStatus.REJECTED:
        return {
          label: 'Rejeitada',
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3 mr-1" />
        };
      case PetitionStatus.COMPLETE:
        return {
          label: 'Concluída',
          variant: 'default' as const, // Changed from 'success' to 'default'
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />
        };
      default:
        return {
          label: 'Status desconhecido',
          variant: 'outline' as const,
          icon: null
        };
    }
  };

  const { label, variant, icon } = getStatusDetails();

  return (
    <Badge variant={variant} className={`flex items-center ${className || ''}`}>
      {icon}
      {label}
    </Badge>
  );
};

export default StatusBadge;

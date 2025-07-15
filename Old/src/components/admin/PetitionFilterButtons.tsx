
import React from 'react';
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertTriangle, FileText, Filter } from "lucide-react";
import { PetitionStatus } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PetitionFilterButtonsProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

const PetitionFilterButtons: React.FC<PetitionFilterButtonsProps> = ({ 
  currentFilter, 
  onFilterChange 
}) => {
  const isMobile = useIsMobile();
  
  const filterOptions = [
    { value: 'all', label: 'Todas', icon: null },
    { value: 'pending', label: 'Pendentes', icon: <Clock className="w-4 h-4" /> },
    { value: 'in_review', label: 'Em Revisão', icon: <FileText className="w-4 h-4" /> },
    { value: 'approved', label: 'Aprovadas', icon: <CheckCircle className="w-4 h-4" /> },
    { value: 'rejected', label: 'Rejeitadas', icon: <AlertTriangle className="w-4 h-4" /> }
  ];
  
  // Versão mobile usando dropdown
  if (isMobile) {
    return (
      <div className="mb-4">
        <Select value={currentFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue>
              {filterOptions.find(option => option.value === currentFilter)?.label || 'Filtrar por status'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center">
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  // Versão desktop com botões
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {filterOptions.map(option => (
        <Button 
          key={option.value}
          variant={currentFilter === option.value ? 'default' : 'outline'} 
          onClick={() => onFilterChange(option.value)}
          size="sm"
          className="flex items-center"
        >
          {option.icon && <span className="mr-1">{option.icon}</span>}
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default PetitionFilterButtons;

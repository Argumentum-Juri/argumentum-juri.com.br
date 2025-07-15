
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
      <FileText className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
      <h3 className="text-lg font-medium mb-2">Nenhuma petição encontrada</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Você ainda não tem nenhuma petição. Crie uma nova petição para começar a usar o Petição Ágil.
      </p>
      <Button asChild>
        <Link to="/petitions/new" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Petição
        </Link>
      </Button>
    </div>
  );
};

export default EmptyState;

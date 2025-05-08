
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileX, ArrowLeft } from "lucide-react";

interface NotFoundErrorProps {
  message?: string;
}

export const NotFoundError: React.FC<NotFoundErrorProps> = ({ 
  message = "O recurso que você está procurando não existe ou você não tem permissão para acessá-lo."
}) => {
  return (
    <div className="text-center py-16 space-y-6">
      <div className="inline-flex items-center justify-center p-6 bg-muted/50 rounded-full">
        <FileX className="h-16 w-16 text-muted-foreground" />
      </div>
      
      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold">Não encontrado</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
      
      <Button asChild variant="outline">
        <Link to="/" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a página inicial
        </Link>
      </Button>
    </div>
  );
};

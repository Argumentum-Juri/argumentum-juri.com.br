
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from "lucide-react";

interface AppContentProps {
  router: any;
}

const AppContent: React.FC<AppContentProps> = ({ router }) => {
  const { authInitialized, isLoading } = useAuth();
  
  // Mostrar loading apenas se ainda não inicializou ou está carregando
  if (!authInitialized || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="h-16 w-16 animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
};

export default AppContent;

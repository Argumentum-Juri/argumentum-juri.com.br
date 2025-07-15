
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading, authInitialized } = useGoAuth();
  const location = useLocation();

  // Aguardando autenticação
  if (!authInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirecionar se não autenticado
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirecionar se não for admin
  if (!user.isAdmin) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  // Admin autenticado - renderizar conteúdo
  return <>{children}</>;
};

export default AdminRoute;

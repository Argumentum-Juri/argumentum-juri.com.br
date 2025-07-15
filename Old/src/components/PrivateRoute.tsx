
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading, authInitialized } = useAuth();
  const location = useLocation();

  // Aguardar inicialização da autenticação
  if (!authInitialized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sua sessão...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    console.log('[PrivateRoute] Usuário não autenticado, redirecionando para /auth');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Usuário autenticado - renderizar conteúdo
  return <>{children}</>;
};

export default PrivateRoute;


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, isLoading, authInitialized } = useGoAuth();
  const location = useLocation();

  console.log('[PrivateRoute] Estado atual:', { 
    hasUser: !!user, 
    isLoading, 
    authInitialized,
    currentPath: location.pathname 
  });

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
  console.log('[PrivateRoute] ✅ Usuário autenticado, liberando acesso');
  return <>{children}</>;
};

export default PrivateRoute;
